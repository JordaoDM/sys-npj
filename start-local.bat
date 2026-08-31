@echo off
echo ========================================
echo  SISTEMA NPJ - INICIAR SERVIDORES
echo ========================================
echo.

echo Iniciando servidores de desenvolvimento...
echo.

echo Backend: http://localhost:3001
echo Frontend: http://localhost:5173
echo.

echo Abrindo terminais...
echo.

:: Iniciar backend
start "NPJ Backend" cmd /k "cd /d %~dp0backend && npm run dev"

:: Aguardar um pouco antes de iniciar o frontend
timeout /t 3 /nobreak >nul

:: Iniciar frontend
start "NPJ Frontend" cmd /k "cd /d %~dp0frontend && npm run dev"

echo.
echo Servidores iniciados!
echo.
echo Backend rodando em: http://localhost:3001
echo Frontend rodando em: http://localhost:5173
echo.
echo Pressione qualquer tecla para sair...
pause >nul
