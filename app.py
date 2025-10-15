import os
import uuid

from flask import Flask, render_template, redirect, url_for, flash, request, abort
from flask_login import login_user, logout_user, login_required, current_user
from sqlalchemy import select, or_
from database import SessionLocal, init_db
from models import User, Collection, Book
from auth import login_manager, LoginUser
from forms import LoginForm, RegisterForm, CollectionForm, BookForm
from config import cfg
from passlib.hash import bcrypt
from utils import get_statistics, can_view, can_edit, log_action
from werkzeug.utils import secure_filename


# --- Flask App Setup ---
app = Flask(__name__)
app.config['SECRET_KEY'] = cfg.SECRET_KEY
login_manager.init_app(app)

# --- File Uploads (robust: relativ zum App-Root) ---
UPLOAD_FOLDER = os.path.join(app.root_path, 'static', 'uploads')
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
ALLOWED_EXTENSIONS = {'.jpg', '.jpeg', '.png', '.webp'}

def _save_cover_file(file_storage):
    """Speichert ein hochgeladenes Bild und gibt den Webpfad (für <img src=...>) zurück."""
    if not file_storage or not getattr(file_storage, "filename", ""):
        return None
    name = secure_filename(file_storage.filename)
    ext = os.path.splitext(name)[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        return None
    fname = f"{uuid.uuid4().hex}{ext}"
    dest = os.path.join(UPLOAD_FOLDER, fname)
    os.makedirs(os.path.dirname(dest), exist_ok=True)
    file_storage.save(dest)
    # Webpfad zurückgeben ("/static/uploads/...")
    rel = os.path.relpath(dest, app.root_path).replace(os.sep, "/")
    return f"/{rel}"


# --- Blueprints ---
from admin import bp as admin_bp
app.register_blueprint(admin_bp)


# --- Context Processor ---
@app.context_processor
def inject_user():
    return {"current_user": current_user}


# --- Auth & Dashboard ---
@app.route('/')
def root():
    return redirect(url_for('dashboard'))

@app.route('/login', methods=['GET', 'POST'])
def login():
    form = LoginForm()
    if form.validate_on_submit():
        with SessionLocal() as db:
            user = db.execute(
                select(User).where(User.username == form.username.data)
            ).scalar_one_or_none()
            if not user or not bcrypt.verify(form.password.data, user.password_hash):
                flash('Ungültiger Benutzer oder Passwort', 'error')
                return redirect(url_for('login'))
            login_user(LoginUser(user))
            return redirect(url_for('dashboard'))
    return render_template('login.html', form=form)

@app.route('/logout')
@login_required
def logout():
    logout_user()
    return redirect(url_for('login'))

@app.route('/register', methods=['GET', 'POST'])
def register():
    form = RegisterForm()
    with SessionLocal() as db:
        admin_exists = db.execute(
            select(User).where(User.role == 'admin').limit(1)
        ).scalar_one_or_none() is not None

    if form.validate_on_submit():
        with SessionLocal() as db:
            if db.execute(
                select(User).where(User.username == form.username.data)
            ).scalar_one_or_none():
                flash('Username ist bereits vergeben', 'error')
                return redirect(url_for('register'))

            role = 'user'
            if not admin_exists and form.makeAdmin.data:
                role = 'admin'
            elif admin_exists and form.adminToken.data and cfg.ADMIN_SETUP_TOKEN and form.adminToken.data == cfg.ADMIN_SETUP_TOKEN:
                role = 'admin'

            user = User(
                username=form.username.data,
                email=form.email.data or None,
                password_hash=bcrypt.hash(form.password.data),
                role=role
            )
            db.add(user)
            db.commit()
            flash('Registrierung erfolgreich. Bitte einloggen.', 'success')
            return redirect(url_for('login'))

    return render_template('register.html', form=form, admin_exists=admin_exists)

@app.route('/dashboard')
@login_required
def dashboard():
    with SessionLocal() as db:
        stats = get_statistics(db, user_id=int(current_user.id))
    return render_template('dashboard.html', stats=stats)


# --- Helpers ---
def _normalize_collection_id(raw):
    """Konvertiert Select-Feld (0/None/'' => None, sonst int) in eine valide collection_id."""
    try:
        val = int(raw)
    except (TypeError, ValueError):
        return None
    return None if val == 0 else val


# --- Collections ---
@app.route('/collections')
@login_required
def collections():
    role = getattr(current_user, 'role', 'viewer')
    with SessionLocal() as db:
        if role == 'admin':
            rows = db.execute(select(Collection)).scalars().all()
        else:
            clauses = [
                (Collection.user_id == int(current_user.id)),
                (Collection.visible_to == "all"),
            ]
            if role in ["editor", "admin"]:
                clauses.append(Collection.visible_to == "editor")
            rows = db.execute(select(Collection).where(or_(*clauses))).scalars().all()
    return render_template('collections.html', collections=rows)

@app.route('/collections/new', methods=['GET', 'POST'])
@login_required
def new_collection():
    form = CollectionForm()
    if form.validate_on_submit():
        with SessionLocal() as db:
            c = Collection(
                user_id=int(current_user.id),
                name=form.name.data,
                description=form.description.data or ''
            )
            db.add(c)
            db.flush()
            log_action(current_user, 'create', 'Collection', c.id, db=db)
            db.commit()
        flash("Collection erstellt.", "success")
        return redirect(url_for('collections'))
    return render_template('new_collection.html', form=form)

@app.route('/collections/<int:cid>')
@login_required
def collection_details(cid: int):
    role = getattr(current_user, 'role', 'viewer')
    with SessionLocal() as db:
        c = db.get(Collection, cid)
        if not c:
            return redirect(url_for('collections'))

        # Sichtbarkeitsprüfung
        allowed = (
            role == 'admin' or
            c.user_id == int(current_user.id) or
            c.visible_to == 'all' or
            (c.visible_to == 'editor' and role in ['editor', 'admin'])
        )
        if not allowed:
            flash("Keine Berechtigung, diese Collection zu sehen.", "error")
            return redirect(url_for('collections'))

        books = db.execute(select(Book).where(Book.collection_id == c.id)).scalars().all()
    return render_template('collection_details.html', collection=c, books=books)

@app.route('/collections/<int:cid>/edit', methods=['GET', 'POST'])
@login_required
def edit_collection(cid: int):
    with SessionLocal() as db:
        c = db.get(Collection, cid)
        if not c or not can_edit(current_user, c):
            return redirect(url_for('collections'))
        form = CollectionForm(obj=c)
        if form.validate_on_submit():
            c.name = form.name.data
            c.description = form.description.data or ''
            db.commit()
            log_action(current_user, "update", "Collection", c.id, db=db)
            flash("Collection aktualisiert.", "success")
            return redirect(url_for('collections'))
    return render_template('edit_collection.html', form=form, collection_id=cid)

@app.post('/collections/<int:cid>/delete')
@login_required
def delete_collection(cid: int):
    """Löscht eine Collection (Owner oder Admin)."""
    with SessionLocal() as db:
        c = db.get(Collection, cid)
        if not c:
            flash("Collection nicht gefunden.", "error")
            return redirect(url_for("collections"))
        if not (current_user.role == "admin" or current_user.id == c.user_id):
            abort(403)
        log_action(current_user, "delete", "Collection", c.id, db=db)
        db.delete(c)
        db.commit()
        flash(f'Collection "{c.name}" wurde gelöscht.', "success")
    return redirect(url_for("collections"))


# --- Books ---
@app.route('/books')
@login_required
def books():
    role = getattr(current_user, 'role', 'viewer')
    with SessionLocal() as db:
        if role == 'admin':
            rows = db.execute(select(Book)).scalars().all()
        else:
            clauses = [
                (Book.user_id == int(current_user.id)),
                (Book.visible_to == "all"),
            ]
            if role in ["editor", "admin"]:
                clauses.append(Book.visible_to == "editor")
            rows = db.execute(select(Book).where(or_(*clauses))).scalars().all()
    return render_template('books.html', books=rows)

@app.route('/books/new', methods=['GET', 'POST'])
@login_required
def new_book():
    form = BookForm()
    with SessionLocal() as db:
        # Collections für Auswahl (eigene Collections – so war es ursprünglich)
        colls = db.execute(
            select(Collection).where(Collection.user_id == int(current_user.id))
        ).scalars().all()
    form.collection_id.choices = [(0, '-- Keine --')] + [(c.id, c.name) for c in colls]

    if form.validate_on_submit():
        file_obj = request.files.get('cover_file')
        cover_path = _save_cover_file(file_obj) if file_obj else None

        with SessionLocal() as db:
            b = Book(
                user_id=int(current_user.id),
                collection_id=_normalize_collection_id(form.collection_id.data),
                cover=cover_path or (form.cover.data or None),
                title=form.title.data,
                description=form.description.data or '',
                price=float(form.price.data or 0),
                release_date=form.release_date.data or None,
                volumeNumber=int(form.volumeNumber.data or 1),
                isbn13=form.isbn13.data or None
            )
            db.add(b)
            db.flush()
            log_action(current_user, "create", "Book", b.id, db=db)
            db.commit()
        flash("Buch erstellt.", "success")
        return redirect(url_for('books'))

    return render_template('new_book.html', form=form)

@app.route('/books/<int:bid>/edit', methods=['GET', 'POST'])
@login_required
def edit_book(bid: int):
    with SessionLocal() as db:
        b = db.get(Book, bid)
        if not b or not can_edit(current_user, b):
            return redirect(url_for('books'))
        colls = db.execute(
            select(Collection).where(Collection.user_id == int(current_user.id))
        ).scalars().all()
    form = BookForm(obj=b)
    form.collection_id.choices = [(0, '-- Keine --')] + [(c.id, c.name) for c in colls]

    if form.validate_on_submit():
        with SessionLocal() as db:
            b = db.get(Book, bid)
            if not b or not can_edit(current_user, b):
                return redirect(url_for('books'))

            # Cover: URL bevorzugt, ansonsten neuer Upload (falls vorhanden)
            b.cover = form.cover.data or b.cover
            up = request.files.get('cover_file')
            new_cover = _save_cover_file(up) if up else None
            if new_cover:
                b.cover = new_cover

            b.title = form.title.data
            b.description = form.description.data or ''
            b.price = float(form.price.data or 0)
            b.release_date = form.release_date.data or None
            b.volumeNumber = int(form.volumeNumber.data or 1)
            b.isbn13 = form.isbn13.data or None
            b.collection_id = _normalize_collection_id(form.collection_id.data)

            log_action(current_user, "update", "Book", b.id, db=db)
            db.commit()
        flash("Buch aktualisiert.", "success")
        return redirect(url_for('books'))

    return render_template('edit_book.html', form=form, book_id=bid)

@app.route('/books/<int:bid>/delete', methods=['POST'])
@login_required
def delete_book(bid: int):
    with SessionLocal() as db:
        b = db.get(Book, bid)
        if b and (current_user.role == "admin" or current_user.id == b.user_id):
            log_action(current_user, "delete", "Book", b.id, db=db)
            db.delete(b)
            db.commit()
            flash("Buch gelöscht.", "success")
        else:
            abort(403)
    return redirect(url_for('books'))


# --- Start Server ---
if __name__ == "__main__":
    init_db()
    app.run(host="0.0.0.0", port=int(os.environ.get("PORT", "3000")), debug=True)
