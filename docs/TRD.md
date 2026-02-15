# TRD (Technical Requirements Document)

## 1. 문서 목적
- 본 문서는 `simulate_building_sunshade`의 기술 구조, 모듈 책임, 구현 규칙, 검증 기준을 정의한다.

## 2. 기술 스택
- Framework: Next.js 16 (App Router)
- Language: TypeScript + React 19
- 3D: Three.js
- Styling: Tailwind CSS 4
- Tooling: ESLint, TypeScript(`tsc --noEmit`)

## 3. 시스템 구조
- 렌더링/입력 오케스트레이션: `src/app/page.tsx`
- 도메인 모델/상수: `src/features/sun-simulation/model.ts`
- 태양/하늘 계산 로직: `src/features/sun-simulation/solar.ts`
- 제어 패널 UI 컴포넌트: `src/features/sun-simulation/components/panels.tsx`
- 레이아웃/메타데이터: `src/app/layout.tsx`
- API 헬스 확인: `src/app/api/route.ts`

## 4. 모듈 책임
### 4.1 `page.tsx`
- Three.js Scene/Camera/Renderer 초기화 및 해제
- 마우스/휠/터치 이벤트 바인딩
- React 상태(time, season, buildings, sunRiseAngle 등) 관리
- 상태 변화에 따른 3D 객체 업데이트

### 4.2 `model.ts`
- 계절 상수(`SEASONS`) 및 타입(`SeasonKey`)
- 건물 타입(`BuildingPosition`)과 초기값(`INITIAL_BUILDINGS`)
- 방위각→방향명 계산(`getDirectionName`)

### 4.3 `solar.ts`
- 시간대별 하늘색 계산(`getSkyColor`)
- 시간/계절/방위각 기반 태양 좌표 계산(`getSunPosition`)

### 4.4 `panels.tsx`
- 방위각 다이얼, 시뮬레이션 패널, 건물 제어 패널, 상태 패널 UI 제공
- 입력 이벤트를 상위(page)로 전달하는 프레젠테이션 계층 역할

## 5. 데이터/상태 설계
- 핵심 상태
  - `time: number` (0~24)
  - `season: SeasonKey`
  - `sunRiseAngle: number` (0~359)
  - `buildings: BuildingPosition[]`
  - `selectedBuilding: number | null`
  - `isAnimating: boolean`
- Three.js 참조 상태(`useRef`)
  - scene/camera/renderer/sun/light/meshes/raycaster 등

## 6. 렌더링 및 이벤트 흐름
1. 마운트 시 Scene/Renderer/오브젝트를 초기화한다.
2. `requestAnimationFrame` 루프로 프레임 렌더링을 수행한다.
3. React 상태 변경 시:
   - 태양 좌표 및 광원 강도 갱신
   - 하늘색 갱신
   - 건물 좌표 갱신
4. 언마운트 시:
   - 이벤트 리스너 제거
   - geometry/material/texture dispose
   - renderer/context 해제

## 7. 계산 규칙(요약)
- 일출/일몰 기준 시간: 06:00 ~ 18:00
- 주간:
  - 태양 고도는 계절별 `sunAngle`을 최대치로 사용
  - 방위각(`riseAngle`) 기반으로 동쪽/서쪽 이동 경로 계산
- 야간:
  - 태양은 지평선 아래 좌표로 배치
  - 주변광 강도는 낮보다 낮게 유지

## 8. 성능 및 안정성 요구사항
- 메모리 누수 방지를 위해 Three.js 리소스 dispose 필수
- 이벤트 리스너는 반드시 cleanup에서 해제
- 상태 변경에 따라 필요한 객체만 갱신 (불필요 재생성 지양)
- 좌표 입력은 범위를 클램프하여 화면 이탈 방지

## 9. 코드 규칙
- 도메인 계산 로직은 `features/sun-simulation`에 유지
- `app/page.tsx`는 장면 제어/오케스트레이션 중심으로 유지
- 신규 기능 추가 시:
  - 타입 우선 정의
  - UI와 계산 로직 분리
  - lint/typecheck 통과 필수

## 10. 빌드/검증/실행
- 개발 실행: `npm run dev`
- 정적 검사: `npm run check`
- 프로덕션 빌드: `npm run build`
- 프로덕션 실행: `npm run start`

## 11. 배포 스크립트 참고
- `.zscripts/build.sh`: 빌드 산출물 패키징
- `.zscripts/start.sh`: standalone 실행 + Caddy 구동
- mini-services 관련 스크립트는 해당 디렉터리 존재 시에만 동작

## 12. 향후 기술 개선 항목
- 천문 계산 정밀도 개선(위도/경도/일자 기반)
- 건물 수 증가 시 렌더링 최적화(LOD/인스턴싱 검토)
- 시뮬레이션 상태 저장/불러오기 포맷 정의(JSON schema)
