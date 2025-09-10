# Changelog

All notable changes to this project are tracked here.

## \[5.0.0] — 2025-09-10

### Added

* **Full rewrite in Python (Flask + SQLAlchemy)** with the same feature set:

  * Auth (login/logout), sign-up.
  * CRUD for **Books** and **Collections**.
  * **Dashboard stats** (per month, last month, yearly breakdown, avg price).
* **Database options** you can pick from:

  * **SQLite** (default, file `./data/app.sqlite3`).
  * **MariaDB/MySQL** via `DATABASE_URL=mysql+pymysql://…`.
* **CSRF protection** via Flask-WTF.
* Modern **UI/theme** (Bootstrap 5, dark-mode templates).

### Changed

* Swapped the Node/Express codebase for Python/Flask.
* Data layer now uses SQLAlchemy (no more MySQL-specific dialect needed).

### Migration

* Data migration:

  * If you used SQLite before, you can recreate the tables 1:1 and move data over via script/export.
  * For MariaDB/MySQL: create the DB, set `DATABASE_URL`, start the app — it will create the tables automatically.
* Environment:

  * `.env` now uses `SECRET_KEY`, `DATABASE_URL`, `ADMIN_SETUP_TOKEN`.

---

## \[4.0.4] — 2025-09-10

### Fixed

* Made **server startup** more robust: explicit `app.listen(...)`, port checks, clean error logs.
* Prevented the “silent exit” when there’s no startup block.

## \[4.0.3] — 2025-09-10

### Fixed

* Finally ported **stats queries** to **SQLite** (`strftime`, `extract` equivalents); no MySQL functions anymore.
* Helper `config/safeQuery.js` to debug SQL errors.

## \[4.0.2] — 2025-09-10

### Added

* **SQLite backend** as an integrated wrapper (`config/database.js`) compatible with `db.query(...)`.
* **Sessions** via `connect-sqlite3` (`./data/sessions.sqlite`).
* **Security**: `helmet`, rate limiting.
* **Migrations** (`scripts/migrate.js` + `db/schema.sql`) without a demo user.

### Changed

* **Dashboard stats** switched to SQLite-safe queries.

## \[4.0.1] — 2025-09-10

### Added

* **“Make first registrant an admin”**:

  * The very first registered user can tick a checkbox to become admin.
  * Future admins only with `ADMIN_SETUP_TOKEN` (from `.env`).
* Updated views/routes for this (`routes/auth.js`, `views/register.ejs`).

### Fixed

* Removed the **demo user** (no longer auto-created).
* Discord bot only starts if `DISCORD_TOKEN` is set (no more crash).

## \[4.0.0] — 2025-09-10

> Internal consolidation release, foundation for the 4.x line.

### Changed

* Cleaned up project structure and dependencies; prepped for SQLite.
* Improved logging/checks and startup procedure.

---

## \[3.2.0] — 2024-11-27

*(Last published Node/Express version before 4.x)*

### Added

* Management of **Books** and **Collections** (EJS views).
* **Dashboard stats** (Month/Last month/Year/Avg price).
* **Discord bot** with commands (release/utility commands).

### Known Issues (historical)

* Reliance on MySQL-like date functions → **SQLite incompatibilities**.
* Bot would crash if the token was missing.
* No admin onboarding during first-time setup.

---

## Upgrade Notes

### From 4.x to 5.0.0 (Python)

1. **Pull the new codebase** (Flask version).
2. Create `.env` by copying and renaming `.example.env`:

   ```ini
    SECRET_KEY=replace-by-your-own-secret-key
    DATABASE_URL=sqlite:///data/app.sqlite3
    # For MariaDB/MySQL:
    # DATABASE_URL=mysql+pymysql://user:password@localhost:3306/verlagdb
    ADMIN_SETUP_TOKEN=replace-by-your-own-secret-token
   ```
