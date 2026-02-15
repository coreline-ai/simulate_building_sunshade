#!/bin/sh

# 설정값
DIST_DIR="./mini-services-dist"

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
}

main() {
    echo "🚀 모든 mini services 시작..."

    # dist 디렉터리 존재 여부 확인
    if [ ! -d "$DIST_DIR" ]; then
        echo "ℹ️  디렉터리 $DIST_DIR 가 없습니다"
        return
    fi

    # mini-service-*.js 파일 검색
    service_files=""
    for file in "$DIST_DIR"/mini-service-*.js; do
        if [ -f "$file" ]; then
            if [ -z "$service_files" ]; then
                service_files="$file"
            else
                service_files="$service_files $file"
            fi
        fi
    done

    # 서비스 파일 개수 계산
    service_count=0
    for file in $service_files; do
        service_count=$((service_count + 1))
    done

    if [ $service_count -eq 0 ]; then
        echo "ℹ️  mini service 파일을 찾지 못했습니다"
        return
    fi

    echo "📦 $service_count개 서비스를 찾았습니다. 시작합니다..."
    echo ""

    # 각 서비스 시작
    for file in $service_files; do
        service_name=$(basename "$file" .js | sed 's/mini-service-//')
        echo "▶️  서비스 시작: $service_name..."

        # bun으로 서비스 실행(백그라운드)
        bun "$file" &
        pid=$!
        if [ -z "$pids" ]; then
            pids="$pid"
        else
            pids="$pids $pid"
        fi

        # 잠시 대기 후 실행 여부 확인
        sleep 0.5
        if ! kill -0 "$pid" 2>/dev/null; then
            echo "❌ $service_name 시작 실패"
            # 실패한 PID를 문자열에서 제거
            pids=$(echo "$pids" | sed "s/\b$pid\b//" | sed 's/  */ /g' | sed 's/^ *//' | sed 's/ *$//')
        else
            echo "✅ $service_name 시작됨 (PID: $pid)"
        fi
    done

    # 실행 중인 서비스 개수 계산
    running_count=0
    for pid in $pids; do
        if kill -0 "$pid" 2>/dev/null; then
            running_count=$((running_count + 1))
        fi
    done

    echo ""
    echo "🎉 모든 서비스가 시작되었습니다! 현재 실행 중: $running_count개"
    echo ""
    echo "💡 Ctrl+C 로 모든 서비스를 중지할 수 있습니다"
    echo ""

    # 모든 백그라운드 프로세스 대기
    wait
}

main
