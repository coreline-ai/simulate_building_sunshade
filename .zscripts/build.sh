#!/bin/bash

# stderr를 stdout으로 리다이렉트하여 execute_command가 stderr 출력으로 실패하지 않도록 처리
exec 2>&1

set -e

# 스크립트가 위치한 디렉터리(.zscripts) 경로
# sh/bash 호환을 위해 $0 사용
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

# Next.js 프로젝트 경로
NEXTJS_PROJECT_DIR="${NEXTJS_PROJECT_DIR:-$(cd "$SCRIPT_DIR/.." && pwd)}"

# Next.js 프로젝트 디렉터리 존재 여부 확인
if [ ! -d "$NEXTJS_PROJECT_DIR" ]; then
    echo "❌ 오류: Next.js 프로젝트 디렉터리가 없습니다: $NEXTJS_PROJECT_DIR"
    exit 1
fi

echo "🚀 Next.js 앱과 mini-services 빌드를 시작합니다..."
echo "📁 Next.js 프로젝트 경로: $NEXTJS_PROJECT_DIR"

# Next.js 프로젝트 디렉터리로 이동
cd "$NEXTJS_PROJECT_DIR" || exit 1

# 환경 변수 설정
export NEXT_TELEMETRY_DISABLED=1

BUILD_DIR="/tmp/build_fullstack_$BUILD_ID"
echo "📁 빌드 디렉터리 준비: $BUILD_DIR"
mkdir -p "$BUILD_DIR"

# 의존성 설치
echo "📦 의존성 설치 중..."
if [ -f "package-lock.json" ]; then
    npm ci
else
    npm install
fi

# Next.js 앱 빌드
echo "🔨 Next.js 앱 빌드 중..."
npm run build

# mini-services 빌드
# Next.js 프로젝트 경로 아래 mini-services 디렉터리 존재 여부 확인
if [ -d "$NEXTJS_PROJECT_DIR/mini-services" ]; then
    echo "🔨 mini-services 빌드 중..."
    # .zscripts 아래 mini-services 스크립트 실행
    sh "$SCRIPT_DIR/mini-services-install.sh"
    sh "$SCRIPT_DIR/mini-services-build.sh"

    # mini-services-start.sh를 빌드 출력 경로로 복사
    echo "  - mini-services-start.sh 복사: $BUILD_DIR"
    cp "$SCRIPT_DIR/mini-services-start.sh" "$BUILD_DIR/mini-services-start.sh"
    chmod +x "$BUILD_DIR/mini-services-start.sh"
else
    echo "ℹ️  mini-services 디렉터리가 없어 건너뜁니다"
fi

# 모든 빌드 산출물을 임시 빌드 디렉터리로 복사
echo "📦 빌드 산출물 수집 중: $BUILD_DIR"

# Next.js standalone 빌드 출력 복사
if [ -d ".next/standalone" ]; then
    echo "  - .next/standalone 복사"
    cp -r .next/standalone "$BUILD_DIR/next-service-dist/"
fi

# Next.js 정적 파일 복사
if [ -d ".next/static" ]; then
    echo "  - .next/static 복사"
    mkdir -p "$BUILD_DIR/next-service-dist/.next"
    cp -r .next/static "$BUILD_DIR/next-service-dist/.next/"
fi

# public 디렉터리 복사
if [ -d "public" ]; then
    echo "  - public 복사"
    cp -r public "$BUILD_DIR/next-service-dist/"
fi

# Caddyfile 복사 (존재하는 경우)
if [ -f "Caddyfile" ]; then
    echo "  - Caddyfile 복사"
    cp Caddyfile "$BUILD_DIR/"
else
    echo "ℹ️  Caddyfile이 없어 건너뜁니다"
fi

# start.sh 스크립트 복사
echo "  - start.sh 복사: $BUILD_DIR"
cp "$SCRIPT_DIR/start.sh" "$BUILD_DIR/start.sh"
chmod +x "$BUILD_DIR/start.sh"

# $BUILD_DIR.tar.gz로 패키징
PACKAGE_FILE="${BUILD_DIR}.tar.gz"
echo ""
echo "📦 빌드 산출물 압축 중: $PACKAGE_FILE"
cd "$BUILD_DIR" || exit 1
tar -czf "$PACKAGE_FILE" .
cd - > /dev/null || exit 1

# # 임시 디렉터리 정리
# rm -rf "$BUILD_DIR"

echo ""
echo "✅ 빌드 완료! 모든 산출물을 $PACKAGE_FILE 에 패키징했습니다"
echo "📊 패키지 파일 크기:"
ls -lh "$PACKAGE_FILE"
