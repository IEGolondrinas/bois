@echo off
cd /d "%~dp0"
set "PY="
where py >nul 2>nul && set "PY=py -3"
if not defined PY where python >nul 2>nul && set "PY=python"
if not defined PY where python3 >nul 2>nul && set "PY=python3"
if not defined PY (
  echo No se encontro Python. Instala Python 3 desde https://www.python.org
  echo o abre directamente dist\BOIS_IO.html en el navegador.
  pause
  exit /b 1
)
echo Servidor en http://localhost:8000  (cierra esta ventana para detenerlo)
start "" cmd /c "timeout /t 2 /nobreak >nul & start http://localhost:8000/index.html"
%PY% -m http.server 8000
