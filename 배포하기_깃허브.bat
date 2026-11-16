@echo off
chcp 65001 >nul
echo =======================================================
echo NDVM GitHub Pages 배포 도우미
echo =======================================================
echo.
echo 1. GitHub(https://github.com/new)에서 새 레포지토리를 만드세요.
echo    (Repository name 예시: ndvm)
echo.
set /p REPO_URL="생성된 GitHub 저장소 주소를 입력하세요 (예: https://github.com/유저명/ndvm.git): "
if "%REPO_URL%"=="" (
    echo 저장소 주소가 입력되지 않았습니다. 취소합니다.
    pause
    exit /b
)
git remote remove origin 2>nul
git remote add origin %REPO_URL%
git branch -M main
echo.
echo GitHub으로 업로드(Push) 중입니다...
git push -u origin main
if errorlevel 1 (
    echo.
    echo [안내] 푸시 도중 오류가 발생했다면 GitHub 로그인 또는 권한을 확인해주세요.
) else (
    echo.
    echo =======================================================
    echo 배포 파일 업로드가 성공적으로 완료되었습니다!
    echo.
    echo GitHub 저장소 페이지의:
    echo 1. Settings 탭 클릭
    echo 2. 좌측 Pages 메뉴 클릭
    echo 3. Source를 [GitHub Actions]로 지정하시면
    echo    잠시 후 전 세계 어디서든 접속 가능한 웹 주소가 생성됩니다!
    echo =======================================================
)
pause
