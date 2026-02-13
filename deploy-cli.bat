@echo off
echo ========================================
echo   Vercel CLI Deployment
echo ========================================
echo.
echo This will deploy the CURRENT local code to production,
echo bypassing the broken Git integration.
echo.
echo First-time setup required:
echo   1. Run this script
echo   2. When prompted, login to Vercel with your browser
echo   3. The deployment will start automatically
echo.
echo ========================================
echo.

REM Login to Vercel (will skip if already logged in)
echo Checking Vercel authentication...
npx vercel whoami

if errorlevel 1 (
    echo.
    echo You need to login first:
    npx vercel login
)

echo.
echo ========================================
echo Starting production deployment...
echo ========================================
echo.

REM Deploy to production with auto-yes
npx vercel deploy --prod --yes

echo.
echo ========================================
echo Deployment complete!
echo ========================================
echo.
echo Check: https://vercel.com/coveplatform/soundcheck/deployments
echo.
pause
