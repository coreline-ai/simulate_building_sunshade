#!/bin/sh

set -e

# 스크립트가 위치한 디렉터리 경로
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
BUILD_DIR="$SCRIPT_DIR"

# 모든 자식 프로세스 PID 저장
pids=""

# 정리 함수: 모든 서비스를 정상 종료
cleanup() {
    echo ""
    echo "🛑 모든 서비스를 종료하는 중..."

    # 모든 자식 프로세스에 SIGTERM 전송
    for pid in $pids; do
        if kill -0 "$pid" 2>/dev/null; then
            service_name=$(ps -p "$pid" -o comm= 2>/dev/null || echo "unknown")
            echo "   프로세스 종료 $pid ($service_name)..."
            kill -TERM "$pid" 2>/dev/null
        fi
    done

    # 모든 프로세스 종료 대기 (최대 5초)
    sleep 1
    for pid in $pids; do
        if kill -0 "$pid" 2>/dev/null; then
            # 아직 실행 중이면 최대 4초 추가 대기
            timeout=4
            while [ $timeout -gt 0 ] && kill -0 "$pid" 2>/dev/null; do
                sleep 1
                timeout=$((timeout - 1))
            done
            # 여전히 실행 중이면 강제 종료
            if kill -0 "$pid" 2>/dev/null; then
                echo "   프로세스 강제 종료 $pid..."
                kill -KILL "$pid" 2>/dev/null
            fi
        fi
    done

    echo "✅ 모든 서비스가 종료되었습니다"
    exit 0
}

echo "🚀 모든 서비스 시작..."
echo ""

# 빌드 디렉터리로 이동
cd "$BUILD_DIR" || exit 1

ls -lah

# Next.js 서버 시작
if [ -f "./next-service-dist/server.js" ]; then
    echo "🚀 Next.js 서버 시작..."
    cd next-service-dist/ || exit 1

    # 환경 변수 설정
    export NODE_ENV=production
    export PORT=${PORT:-3000}
    export HOSTNAME=${HOSTNAME:-0.0.0.0}

    # Next.js 백그라운드 실행
    node server.js &
    NEXT_PID=$!
    pids="$NEXT_PID"

    # 잠시 대기 후 실행 여부 확인
    sleep 1
    if ! kill -0 "$NEXT_PID" 2>/dev/null; then
        echo "❌ Next.js 서버 시작 실패"
        exit 1
    else
        echo "✅ Next.js 서버 시작됨 (PID: $NEXT_PID, Port: $PORT)"
    fi

    cd ../
else
    echo "⚠️  Next.js 서버 파일을 찾지 못했습니다: ./next-service-dist/server.js"
fi

# mini-services 시작
if [ -f "./mini-services-start.sh" ]; then
    echo "🚀 mini-services 시작..."

    # 루트 경로에서 시작 스크립트 실행 (스크립트 내부에서 mini-services-dist 처리)
    sh ./mini-services-start.sh &
    MINI_PID=$!
    pids="$pids $MINI_PID"

    # 잠시 대기 후 실행 여부 확인
    sleep 1
    if ! kill -0 "$MINI_PID" 2>/dev/null; then
        echo "⚠️  mini-services 시작에 실패했을 수 있으나 계속 진행합니다..."
    else
        echo "✅ mini-services 시작됨 (PID: $MINI_PID)"
    fi
elif [ -d "./mini-services-dist" ]; then
    echo "⚠️  mini-services 시작 스크립트가 없지만 디렉터리는 존재합니다"
else
    echo "ℹ️  mini-services 디렉터리가 없어 건너뜁니다"
fi

# Caddy 시작 (Caddyfile이 있는 경우)
echo "🚀 Caddy 시작..."

# Caddy를 포그라운드(메인 프로세스)로 실행
echo "✅ Caddy 시작됨 (포그라운드 실행)"
echo ""
echo "🎉 모든 서비스가 시작되었습니다!"
echo ""
echo "💡 Ctrl+C 로 모든 서비스를 중지할 수 있습니다"
echo ""

# Caddy를 메인 프로세스로 실행
exec caddy run --config Caddyfile --adapter caddyfile
