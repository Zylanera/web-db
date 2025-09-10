Alright — here’s a clear, slightly casual English version with the same structure and code blocks.

# Web DB (Python/Flask)

Small publisher/books DB with auth, collections & books, plus a dashboard.
Backend: **Flask + SQLAlchemy** · DB: **SQLite** (default) or **MariaDB/MySQL**.

---

## Features

* Login/Logout, sign-up with **“make first registrant an admin”**
* CRUD for **Books** & **Collections**
* Dashboard stats (month, last month, yearly trend, avg price)
* CSRF protection via Flask-WTF
* Modern templates (Bootstrap 5, dark theme)

---

## Requirements

* **Python 3.11+** (3.12 recommended)
* Optional **MariaDB/MySQL** if you don’t use SQLite
* For Docker: Docker Engine (or remote build via GitHub Actions)

---

## Configuration

1. Copy the example env:

```bash
# Linux/macOS
cp .example.env .env
# Windows (PowerShell)
copy .example.env .env
```

2. Edit `.env`:

```ini
SECRET_KEY=change-this-in-prod

# SQLite (default) — file is created automatically
DATABASE_URL=sqlite:///data/app.sqlite3

# MariaDB/MySQL (optional):
# DATABASE_URL=mysql+pymysql://user:password@host:3306/publisherdb

# Optional: later admin promotions require a token
ADMIN_SETUP_TOKEN=
```

---

## Install & Run (from source)

### A) Windows **without venv** (good for locked-down environments)

```powershell
# Install deps into the user profile (no admin needed)
python -m pip install --user --upgrade pip
python -m pip install --user -r requirements.txt

# Create DB tables (SQLite file will be created)
python -c "from database import init_db; init_db()"

# Start
python app.py
# -> http://localhost:3000
```

### B) Windows **without venv** using a project-local “vendor” folder (`_deps`)

```powershell
# Install packages locally into the project
python -m pip install --upgrade pip
python -m pip install --target ".\_deps" -r requirements.txt

# Create DB tables
$env:PYTHONPATH="$PWD\_deps"
python -c "from database import init_db; init_db()"

# Start
$env:PYTHONPATH="$PWD\_deps"
python app.py
```

> Tip (create a batch script `run-no-venv-python.bat`):
>
> ```bat
> @echo off
> setlocal
> set "DEPS=%CD%\_deps"
> if not exist "%DEPS%" (
>   python -m pip install --upgrade pip
>   python -m pip install --target "%DEPS%" -r requirements.txt
> )
> if not exist ".env" copy .env.example .env >NUL
> set "PYTHONPATH=%DEPS%"
> python -c "from database import init_db; init_db()"
> python app.py
> endlocal
> ```

### C) Linux/macOS (with venv)

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

# Create DB tables
python -c "from database import init_db; init_db()"

# Start
python app.py
# -> http://localhost:3000
```

---

## Using MariaDB/MySQL

1. Install the driver (if it’s not already in your Docker image):

```bash
# Linux/macOS (venv)
pip install PyMySQL
# Windows without venv (user install)
python -m pip install --user PyMySQL
```

2. Edit `.env`:

```ini
SECRET_KEY=change-this-in-prod

# SQLite (default) — file is created automatically
#DATABASE_URL=sqlite:///data/app.sqlite3

# MariaDB/MySQL (optional):
DATABASE_URL=mysql+pymysql://user:password@host:3306/publisherdb

# Optional: later admin promotions require a token
ADMIN_SETUP_TOKEN=
```

3. Start the app — tables are created on first run.

---

## Docker (without Compose)

### Dockerfile

Drop this file in the project as `Dockerfile` (or use the one that’s already there). Tweak things like the port if you want:

```dockerfile
# === Dockerfile for Publisher DB (Flask) ===
FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    FLASK_ENV=production \
    PORT=3000

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
      curl build-essential \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt \
    && pip install --no-cache-dir gunicorn PyMySQL

COPY . .
RUN mkdir -p /app/data

# Non-root user
RUN useradd -ms /bin/bash appuser \
 && chown -R appuser:appuser /app
USER appuser

EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=5 \
  CMD curl -fsS http://localhost:3000/ || exit 1

CMD ["gunicorn", "-b", "0.0.0.0:3000", "-w", "2", "-k", "gthread", "--threads", "4", "app:app"]
```

### Build the image

```bash
# in the project directory
docker build -t publisher-db:flask .
```

### Run with **SQLite** (persistent data)

```bash
# Linux/macOS
docker run -d --name publisher-db -p 3000:3000 -v "$PWD/data:/app/data" publisher-db:flask

# Windows PowerShell
docker run -d --name publisher-db -p 3000:3000 -v "${PWD}\data:/app/data" publisher-db:flask
```

### Run with **MariaDB/MySQL**

```bash
docker run -d --name publisher-db \
  -p 3000:3000 \
  -e DATABASE_URL="mysql+pymysql://user:password@db-host:3306/publisherdb" \
  -e SECRET_KEY="change-this-in-prod" \
  publisher-db:flask
```

**View logs:** `docker logs -f publisher-db`
**Stop/Remove:** `docker rm -f publisher-db`

---

## Remote Image Build (no local Docker) — GitHub Actions → GHCR

Create `.github/workflows/docker.yml`:

```yaml
name: Build & Push Docker image (GHCR)
on:
  push: { branches: [ main ] }
  workflow_dispatch:
jobs:
  build:
    runs-on: ubuntu-latest
    permissions: { contents: read, packages: write }
    steps:
      - uses: actions/checkout@v4
      - uses: docker/login-action@v3
        with:
          registry: ghcr.io
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}
      - name: Set image name
        id: meta
        run: |
          echo "IMAGE=ghcr.io/$(echo ${{ github.repository }} | tr '[:upper:]' '[:lower:]')" >> $GITHUB_OUTPUT
      - uses: docker/build-push-action@v6
        with:
          context: .
          push: true
          tags: |
            ${{ steps.meta.outputs.IMAGE }}:latest
            ${{ steps.meta.outputs.IMAGE }}:sha-${{ github.sha }}
          cache-from: type=gha
          cache-to: type=gha,mode=max
```

The image will show up in **GitHub Container Registry** at
`ghcr.io/<owner>/<repo>:latest`.

---

## Admin Onboarding

* **First user**: Tick **“Set as admin”** during sign-up.
* **More admins**: Only with `ADMIN_SETUP_TOKEN` from `.env` (field on the registration form).

---

## Directory Layout (short)

```
.
├─ app.py                 # Flask routes & views
├─ models.py              # SQLAlchemy models
├─ database.py            # Engine & init_db()
├─ auth.py                # Flask-Login integration
├─ forms.py               # Flask-WTF forms (CSRF)
├─ utils.py               # Stats helpers
├─ templates/             # Jinja2 templates (Bootstrap UI)
├─ static/styles.css      # Custom CSS
├─ requirements.txt
├─ .env.example
└─ Dockerfile             # optional (see above)
```

---

## Troubleshooting

* **White screen / blank page**

  * Clear browser cache / hard reload (Ctrl+F5).
  * Check the terminal: template error or stack trace?

* **`SQLITE_CANTOPEN`**

  * Is the `./data` folder there and writable? With Docker, mount it via `-v`.

* **MariaDB won’t connect**

  * Check `DATABASE_URL` (user/pass/host/port/db).
  * Is the port open? Does the user have the right permissions?

* **Windows: “python” not found**

  * Try `python --version`. Maybe enable **App execution aliases** or reinstall Python.

If it still won’t behave, please open an issue!

---

## License & Changelog

* See **CHANGELOG.md** for changes.
* License is in: `LICENCE.md`
