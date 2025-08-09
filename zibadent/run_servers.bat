@REM @echo off
@REM echo Starting Django HTTP server on port 8000...
@REM start cmd /k python manage.py runserver 8000
@REM echo Starting Daphne WebSocket server on port 8001...
@REM start cmd /k daphne -p 8001 zibadent.asgi:application
@REM echo Servers running. Close the command windows to stop.


@REM @echo off
@REM echo Activating virtual environment...
@REM call venv\Scripts\activate.bat

@REM echo Starting Django HTTP server on port 8000...
@REM start cmd /k python manage.py runserver 8000

@REM echo Starting Daphne WebSocket server on port 8001...
@REM start cmd /k daphne -p 8001 zibadent.asgi:application

@REM echo Servers running. Close the command windows to stop.
