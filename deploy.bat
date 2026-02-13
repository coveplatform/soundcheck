@echo off
echo Pushing to GitHub...
git push origin main
echo.
echo Triggering Vercel deployment...
curl -X POST https://api.vercel.com/v1/integrations/deploy/prj_2KaEMzxJELu2YBsOaGYRluYXKaXO/g4ktXzUnTH
echo.
echo Done! Check Vercel dashboard for deployment status.
