#!/bin/bash

# 설정값
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT_DIR="${ROOT_DIR:-$(cd "$SCRIPT_DIR/.." && pwd)/mini-services}"
DIST_DIR="/tmp/build_fullstack_$BUILD_ID/mini-services-dist"

main() {
    echo "🚀 mini-services 일괄 빌드를 시작합니다..."

    # rootdir 존재 여부 확인
    if [ ! -d "$ROOT_DIR" ]; then
        echo "ℹ️  디렉터리 $ROOT_DIR 가 없어 빌드를 건너뜁니다"
        return
    fi

    # 출력 디렉터리 생성 (없으면 생성)
    mkdir -p "$DIST_DIR"

    # 통계 변수
    success_count=0
    fail_count=0

    # mini-services 디렉터리 하위 폴더 순회
    for dir in "$ROOT_DIR"/*; do
        # 디렉터리이며 package.json 포함 여부 확인
        if [ -d "$dir" ] && [ -f "$dir/package.json" ]; then
            project_name=$(basename "$dir")

            # 우선순위에 따라 엔트리 파일 자동 탐색
            entry_path=""
            for entry in "src/index.ts" "index.ts" "src/index.js" "index.js"; do
                if [ -f "$dir/$entry" ]; then
                    entry_path="$dir/$entry"
                    break
                fi
            done

            if [ -z "$entry_path" ]; then
                echo "⚠️  건너뜀 $project_name: 엔트리 파일(index.ts/js)을 찾지 못했습니다"
                continue
            fi

            echo ""
            echo "📦 빌드 중: $project_name..."

            # bun build CLI로 빌드
            output_file="$DIST_DIR/mini-service-$project_name.js"

            if bun build "$entry_path" \
                --outfile "$output_file" \
                --target bun \
                --minify; then
                echo "✅ $project_name 빌드 성공 -> $output_file"
                success_count=$((success_count + 1))
            else
                echo "❌ $project_name 빌드 실패"
                fail_count=$((fail_count + 1))
            fi
        fi
    done

    if [ -f ./.zscripts/mini-services-start.sh ]; then
        cp ./.zscripts/mini-services-start.sh "$DIST_DIR/mini-services-start.sh"
        chmod +x "$DIST_DIR/mini-services-start.sh"
    fi

    echo ""
    echo "🎉 모든 작업이 완료되었습니다!"
    if [ $success_count -gt 0 ] || [ $fail_count -gt 0 ]; then
        echo "✅ 성공: $success_count개"
        if [ $fail_count -gt 0 ]; then
            echo "❌ 실패: $fail_count개"
        fi
    fi
}

main
