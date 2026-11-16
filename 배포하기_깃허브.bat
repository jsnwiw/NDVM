@echo off
chcp 65001 >nul
echo =======================================================
echo NDVM GitHub Pages 배포 - https://github.com/jsnwiw/NDVM
echo =======================================================
echo.
echo GitHub으로 업로드(Push)를 시작합니다...
echo (화면에 GitHub 로그인 창이 나타나면 브라우저 로그인을 완료해 주세요.)
echo.

git remote remove origin 2>nul
git remote add origin https://github.com/jsnwiw/NDVM.git
git branch -M main
git push -u origin main

if errorlevel 1 (
    echo.
    echo =======================================================
    echo [안내] 푸시가 완료되지 않았습니다.
    echo GitHub 로그인 창에서 로그인을 승인했는지 확인해 주세요.
    echo =======================================================
) else (
    echo.
    echo =======================================================
    echo ★ 배포 파일 업로드가 성공적으로 완료되었습니다!
    echo.
    echo 이제 브라우저에서 아래 주소로 접속하세요:
    echo https://github.com/jsnwiw/NDVM/settings/pages
    echo.
    echo [설정 방법]
    echo 1. Build and deployment > Source 항목에서 [GitHub Actions] 선택
    echo 2. 잠시 후 전 세계 어디서든 접속 가능한 웹 링크가 생성됩니다!
    echo =======================================================
)
pause
