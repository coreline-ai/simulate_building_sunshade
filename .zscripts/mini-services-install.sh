#!/bin/bash

# 설정값
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT_DIR="${ROOT_DIR:-$(cd "$SCRIPT_DIR/.." && pwd)/mini-services}"

main() {
    echo "🚀 의존성 일괄 설치를 시작합니다..."

    # rootdir 존재 여부 확인
    if [ ! -d "$ROOT_DIR" ]; then
        echo "ℹ️  디렉터리 $ROOT_DIR 가 없어 설치를 건너뜁니다"
        return
    fi

    # 통계 변수
    success_count=0
    fail_count=0
    failed_projects=""

    # mini-services 디렉터리 하위 폴더 순회
    for dir in "$ROOT_DIR"/*; do
        # 디렉터리이며 package.json 포함 여부 확인
        if [ -d "$dir" ] && [ -f "$dir/package.json" ]; then
            project_name=$(basename "$dir")
            echo ""
            echo "📦 의존성 설치 중: $project_name..."

            # 프로젝트 디렉터리로 이동 후 bun install 실행
            if (cd "$dir" && bun install); then
                echo "✅ $project_name 의존성 설치 성공"
                success_count=$((success_count + 1))
            else
                echo "❌ $project_name 의존성 설치 실패"
                fail_count=$((fail_count + 1))
                if [ -z "$failed_projects" ]; then
                    failed_projects="$project_name"
                else
                    failed_projects="$failed_projects $project_name"
                fi
            fi
        fi
    done

    # 결과 요약
    echo ""
    echo "=================================================="
    if [ $success_count -gt 0 ] || [ $fail_count -gt 0 ]; then
        echo "🎉 설치 완료!"
        echo "✅ 성공: $success_count개"
        if [ $fail_count -gt 0 ]; then
            echo "❌ 실패: $fail_count개"
            echo ""
            echo "실패한 프로젝트:"
            for project in $failed_projects; do
                echo "  - $project"
            done
        fi
    else
        echo "ℹ️  package.json 을 포함한 프로젝트를 찾지 못했습니다"
    fi
    echo "=================================================="
}

main
