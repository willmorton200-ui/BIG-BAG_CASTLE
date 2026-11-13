@echo off
chcp 65001 >nul
title BIG-BAG_CASTLE - Запуск приложения

echo ========================================================
echo   Запуск BIG-BAG_CASTLE (Калькулятор ЗОК из МКР)
echo ========================================================
echo.

cd /d "%~dp0"

:: Проверка наличия node_modules
if not exist "node_modules\" (
    echo [ИНФО] Папка node_modules не найдена. Устанавливаем зависимости...
    call npm install
    if errorlevel 1 (
        echo [ОШИБКА] Не удалось установить зависимости npm.
        pause
        exit /b %errorlevel%
    )
)

echo [1/2] Запуск сервера разработки Vite...
echo [2/2] Приложение будет автоматически открыто в браузере...
echo.
echo Для завершения работы закройте это окно или нажмите Ctrl+C.
echo.

:: Запуск dev-сервера с автоматическим открытием страницы в браузере
call npm run dev -- --open

pause
