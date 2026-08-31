@echo off
setlocal

cd /d "%~dp0"

echo ========================================
echo  SISTEMA NPJ - CONFIGURACAO COM DOCKER
echo ========================================
echo.

where docker >nul 2>&1
if errorlevel 1 (
    echo Docker nao encontrado. Instale e inicie o Docker Desktop.
    exit /b 1
)

docker info >nul 2>&1
if errorlevel 1 (
    echo O Docker nao esta em execucao. Inicie o Docker Desktop e tente novamente.
    exit /b 1
)

if not exist ".env" (
    copy ".env.example" ".env" >nul
    echo O arquivo .env foi criado a partir de .env.example.
    echo Edite o arquivo .env, substitua todos os valores CHANGE_ME e execute este script novamente.
    exit /b 0
)

findstr /c:"CHANGE_ME" ".env" >nul
if not errorlevel 1 (
    echo O arquivo .env ainda possui valores CHANGE_ME.
    echo Configure as senhas e os segredos antes de iniciar o sistema.
    exit /b 1
)

echo Construindo e iniciando os servicos...
docker compose up -d --build
if errorlevel 1 (
    echo Nao foi possivel iniciar os servicos.
    exit /b 1
)

echo.
echo Sistema iniciado com sucesso.
echo Frontend: http://localhost:5173
echo API:      http://localhost:3001
echo Mailpit:  http://localhost:8025
echo.
echo O administrador usa ADMIN_EMAIL e ADMIN_PASSWORD definidos no arquivo .env.
echo Os usuarios de teste sao controlados por SEED_TEST_USERS.

endlocal
