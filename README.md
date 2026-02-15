# 🏙️ Simulate Building Sunshade

<div align="center">

![Next.js 16](https://img.shields.io/badge/Next.js_16-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)
![React 19](https://img.shields.io/badge/React_19-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Three.js](https://img.shields.io/badge/Three.js-000000?style=for-the-badge&logo=three.js&logoColor=white)
![Tailwind CSS 4](https://img.shields.io/badge/Tailwind_CSS_4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)

<p align="center">
  <img width="1515" height="875" alt="스크린샷 2026-02-15 오후 6 19 51" src="https://github.com/user-attachments/assets/88e75d4b-b2d8-408d-a0f4-201f443c596a" />
</p>

**건물 배치, 시간, 계절, 방위각 변화에 따른 일조/그림자 상태를 3D로 시각화하는 웹 시뮬레이터**

</div>

---

## 📖 Overview

**Simulate Building Sunshade**는 건물 배치와 태양 조건을 빠르게 바꿔가며 일조 변화를 확인할 수 있도록 만든 3D 시뮬레이터입니다.

현재 구현은 **Next.js 16 (App Router)** + **React 19** + **Three.js** 기반이며, 시뮬레이션 계산 로직과 UI를 기능 단위로 분리한 구조를 사용합니다.

## 🔎 Project Analysis Summary

- **핵심 범위**: 단일 화면 3D 시뮬레이션(건물 이동, 시간/계절/방위각 제어)
- **아키텍처**: `app/page.tsx`(렌더링/입력 제어) + `features/sun-simulation/*`(도메인 계산/패널 UI)
- **렌더링 루프**: `requestAnimationFrame` 기반, 언마운트 시 geometry/material/texture dispose 처리
- **런타임 구성**: `next.config.ts`에서 `output: "standalone"` 사용
- **품질 기준**: `npm run check`(ESLint + TypeScript) 통과 기준으로 유지
- **현재 제약**:
  - 물리 엔진/정밀 천문 라이브러리를 사용하지 않는 경량 모델
  - 지리 좌표(위도/경도) 기반 고정밀 계산은 미포함

## ✨ Key Features

- **🌞 태양 시뮬레이션 제어**
  - 시간(0~24) 수동 조절
  - 자동 재생(시간 흐름 애니메이션)
  - 계절 전환(봄/여름/가을/겨울, 기준일 표시)
- **🧭 해 뜨는 방향 다이얼**
  - 방위각(0~359°) 조절
  - 일출/일몰 방향 텍스트 동시 표시
- **🏗️ 건물 위치 조정**
  - 3D 화면에서 건물 드래그 이동
  - 패널 내 방향 버튼 및 슬라이더로 정밀 이동
  - 초기 위치 리셋
- **🎨 장면 시각화**
  - 시간대별 하늘색 변화
  - 태양/광원 강도 및 주변광 변화
  - 그림자 표시
- **🎥 카메라 조작**
  - 빈 공간 드래그로 회전
  - 마우스 휠로 확대/축소

## 🛠️ Technology Stack

| Category | Technology | Description |
|----------|------------|-------------|
| **Framework** | Next.js 16 | App Router 기반 구조, standalone 빌드 출력 |
| **Language** | TypeScript | 시뮬레이션 상태/도메인 모델 타입 안정성 확보 |
| **3D Engine** | Three.js | WebGL 렌더링, 광원/그림자/메시 제어 |
| **UI** | React 19 | 훅 기반 상태/이벤트/렌더링 제어 |
| **Styling** | Tailwind CSS 4 | 제어 패널 오버레이 스타일링 |
| **Quality** | ESLint + tsc | 정적 분석(`npm run check`) |

## 📂 Project Structure

```text
.
├── docs/
│   ├── PRD.md
│   └── TRD.md
├── src/
│   ├── app/
│   │   ├── api/route.ts
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   └── page.tsx
│   └── features/
│       └── sun-simulation/
│           ├── components/panels.tsx
│           ├── model.ts
│           └── solar.ts
├── .zscripts/
└── README.md
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18.18+
- npm

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/coreline-ai/simulate_building_sunshade.git
cd simulate_building_sunshade
```

2. **Install dependencies**
```bash
npm install
```

3. **Run development server**
```bash
npm run dev
```
기본 접속 주소: [http://localhost:3000](http://localhost:3000)

포트 충돌 시:
```bash
npx next dev -p 3001
```

## 🎮 Usage Guide

### 1. 태양 제어 패널 (좌측)
- **시간 슬라이더**: 00:00 ~ 24:00 조절
- **자동 재생/정지**: 시간 흐름 애니메이션
- **계절 선택**: 봄/여름/가을/겨울 전환

### 2. 해 뜨는 방향 다이얼 (좌측 상단)
- 다이얼 포인터를 드래그해 방위각을 변경
- 일출 방향과 일몰 방향 텍스트 확인

### 3. 건물 위치 패널 (우측)
- 건물 선택 후 방향 버튼(북/동/서/남)으로 이동
- X/Z 슬라이더로 정밀 위치 조정
- 3D 화면에서 건물 직접 드래그 가능

### 4. 마우스 조작
- 건물 클릭+드래그: 건물 이동
- 빈 공간 드래그: 카메라 회전
- 휠 스크롤: 확대/축소

## ✅ Validation Commands

```bash
npm run lint
npm run typecheck
npm run check
npm run build
```

## 📚 Documentation

- 제품 요구사항: `docs/PRD.md`
- 기술 요구사항: `docs/TRD.md`

## 🤝 Contributing

이슈/개선 제안/PR 모두 환영합니다. 변경 시 `npm run check` 통과 상태를 유지해 주세요.

## 📄 License

현재 저장소에 별도 라이선스 파일은 없습니다.
