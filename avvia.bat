@echo off
echo.
echo  ====================================
echo   SafetyAI - Avvio in corso...
echo  ====================================
echo.

:: Imposta la chiave API - SOSTITUISCI CON LA TUA CHIAVE
set ANTHROPIC_KEY=INCOLLA-QUI-LA-TUA-CHIAVE-API

:: Verifica che la chiave sia stata impostata
if "%ANTHROPIC_KEY%"=="INCOLLA-QUI-LA-TUA-CHIAVE-API" (
  echo  ATTENZIONE: devi inserire la tua chiave API nel file avvia.bat
  echo  Aprilo con blocco note e sostituisci INCOLLA-QUI-LA-TUA-CHIAVE-API
  echo  con la tua chiave che inizia con sk-ant-...
  echo.
  pause
  exit
)

echo  Avvio server API su porta 3001...
start "SafetyAI API Server" cmd /k "set ANTHROPIC_KEY=%ANTHROPIC_KEY% && node server.js"

echo  Attendo 2 secondi...
timeout /t 2 /nobreak > nul

echo  Avvio interfaccia web su porta 3000...
start "SafetyAI Web" cmd /k "npm start"

echo.
echo  SafetyAI si sta avviando...
echo  Il browser si apre automaticamente su http://localhost:3000
echo.
