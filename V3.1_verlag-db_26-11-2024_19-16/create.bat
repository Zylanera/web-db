@echo off
REM Erstellt die Ordnerstruktur und die Dateien

REM Root-Dateien
echo. > app.js
echo. > package.json

REM public-Verzeichnis und Unterordner
mkdir public
mkdir public\css
mkdir public\js
echo. > public\css\styles.css
echo. > public\js\scripts.js

REM views-Verzeichnis und Unterordner
mkdir views
mkdir views\partials
echo. > views\partials\header.ejs
echo. > views\partials\footer.ejs
echo. > views\index.ejs
echo. > views\login.ejs
echo. > views\register.ejs
echo. > views\dashboard.ejs
echo. > views\books.ejs
echo. > views\collections.ejs

REM routes-Verzeichnis
mkdir routes
echo. > routes\auth.js
echo. > routes\books.js
echo. > routes\collections.js

REM models-Verzeichnis
mkdir models
echo. > models\user.js
echo. > models\book.js
echo. > models\collection.js

REM config-Verzeichnis
mkdir config
echo. > config\database.js

echo Struktur erfolgreich erstellt!
pause