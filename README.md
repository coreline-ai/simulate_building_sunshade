# Simulate Building Sunshade

건물 배치와 계절/시간/해 뜨는 방위각에 따라 일조 상태를 확인하는 3D 시뮬레이터입니다.

## 주요 기능
- 3D 단지 뷰에서 건물 드래그 이동
- 시간 슬라이더 및 자동 재생
- 계절(춘분/하지/추분/동지 기준) 전환
- 해 뜨는 방향(방위각) 다이얼 조정
- 태양 고도/주야 상태 시각화

## 기술 스택
- Next.js 16 (App Router)
- React 19 + TypeScript
- Three.js
- Tailwind CSS 4
- Prisma (SQLite)

## 프로젝트 구조
```text
src/
  app/
    page.tsx                     # 메인 시뮬레이터 화면
  features/
    sun-simulation/
      components/
        panels.tsx                # 제어 패널 UI 컴포넌트
      model.ts                   # 계절/건물 모델, 방향 계산
      solar.ts                   # 하늘색/태양 위치 계산
  components/ui/                 # shadcn/ui 컴포넌트
prisma/
  schema.prisma
db/
  custom.db
```

## 실행 방법
### 1) 의존성 설치
```bash
bun install
```

### 2) 개발 서버
```bash
bun run dev
```

### 3) 프로덕션 빌드/실행
```bash
bun run build
bun run start
```

### 4) 정적 검사
```bash
bun run check
```

## 데이터베이스
기본 Prisma datasource는 SQLite이며 `DATABASE_URL`을 사용합니다.

예시:
```bash
DATABASE_URL="file:./db/custom.db"
```

## 참고
- `src/app/page.tsx`는 화면/입력 제어 중심으로 유지하고, 계산/도메인 로직은 `src/features/sun-simulation/*`로 분리해 두었습니다.
- `examples/websocket/*`는 본 서비스와 별도의 예제 코드입니다.
- 타입 에러를 임시 허용해야 하면 `ALLOW_TS_ERRORS=1`로 빌드할 수 있습니다. 기본값은 타입 에러를 허용하지 않습니다.
- `Caddyfile`의 `XTransformPort` 프록시는 현재 `3003`으로 고정되어 있습니다.
