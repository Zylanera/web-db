import os
from flask import Flask, render_template, redirect, url_for, flash
from flask_login import login_user, logout_user, login_required, current_user
from sqlalchemy import select
from database import SessionLocal, init_db
from models import User, Collection, Book
from auth import login_manager, LoginUser
from forms import LoginForm, RegisterForm, CollectionForm, BookForm
from config import cfg
from passlib.hash import bcrypt
from utils import get_statistics

app = Flask(__name__)
app.config['SECRET_KEY'] = cfg.SECRET_KEY
login_manager.init_app(app)

@app.context_processor
def inject_user():
    return {"current_user": current_user}

@app.route('/')
def root():
    return redirect(url_for('dashboard'))

@app.route('/login', methods=['GET', 'POST'])
def login():
    form = LoginForm()
    if form.validate_on_submit():
        with SessionLocal() as db:
            user = db.execute(select(User).where(User.username == form.username.data)).scalar_one_or_none()
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
        admin_exists = db.execute(select(User).where(User.role == 'admin').limit(1)).scalar_one_or_none() is not None
    if form.validate_on_submit():
        with SessionLocal() as db:
            if db.execute(select(User).where(User.username == form.username.data)).scalar_one_or_none():
                flash('Username ist bereits vergeben', 'error')
                return redirect(url_for('register'))
            role = 'user'
            if not admin_exists and form.makeAdmin.data:
                role = 'admin'
            elif admin_exists and form.adminToken.data and cfg.ADMIN_SETUP_TOKEN and form.adminToken.data == cfg.ADMIN_SETUP_TOKEN:
                role = 'admin'
            user = User(username=form.username.data, email=form.email.data or None, password_hash=bcrypt.hash(form.password.data), role=role)
            db.add(user); db.commit()
            flash('Registrierung erfolgreich. Bitte einloggen.', 'success')
            return redirect(url_for('login'))
    return render_template('register.html', form=form, admin_exists=admin_exists)

@app.route('/dashboard')
@login_required
def dashboard():
    with SessionLocal() as db:
        stats = get_statistics(db, user_id=int(current_user.id))
    return render_template('dashboard.html', stats=stats)

# Collections
@app.route('/collections')
@login_required
def collections():
    with SessionLocal() as db:
        rows = db.execute(select(Collection).where(Collection.user_id == int(current_user.id))).scalars().all()
    return render_template('collections.html', collections=rows)

@app.route('/collections/new', methods=['GET', 'POST'])
@login_required
def new_collection():
    form = CollectionForm()
    if form.validate_on_submit():
        with SessionLocal() as db:
            c = Collection(user_id=int(current_user.id), name=form.name.data, description=form.description.data or '')
            db.add(c); db.commit()
        return redirect(url_for('collections'))
    return render_template('new_collection.html', form=form)

@app.route('/collections/<int:cid>')
@login_required
def collection_details(cid: int):
    with SessionLocal() as db:
        c = db.get(Collection, cid)
        if not c or c.user_id != int(current_user.id):
            return redirect(url_for('collections'))
        books = db.execute(select(Book).where(Book.collection_id == c.id)).scalars().all()
    return render_template('collection_details.html', collection=c, books=books)

@app.route('/collections/<int:cid>/edit', methods=['GET', 'POST'])
@login_required
def edit_collection(cid: int):
    with SessionLocal() as db:
        c = db.get(Collection, cid)
        if not c or c.user_id != int(current_user.id):
            return redirect(url_for('collections'))
        form = CollectionForm(obj=c)
        if form.validate_on_submit():
            c.name = form.name.data; c.description = form.description.data or ''
            db.commit()
            return redirect(url_for('collections'))
    return render_template('edit_collection.html', form=form, collection_id=cid)

# Books
@app.route('/books')
@login_required
def books():
    with SessionLocal() as db:
        rows = db.execute(select(Book).where(Book.user_id == int(current_user.id))).scalars().all()
    return render_template('books.html', books=rows)

@app.route('/books/new', methods=['GET', 'POST'])
@login_required
def new_book():
    form = BookForm()
    with SessionLocal() as db:
        colls = db.execute(select(Collection).where(Collection.user_id == int(current_user.id))).scalars().all()
    form.collection_id.choices = [(0, '-- Keine --')] + [(c.id, c.name) for c in colls]
    if form.validate_on_submit():
        with SessionLocal() as db:
            b = Book(
                user_id=int(current_user.id),
                collection_id=form.collection_id.data or None if form.collection_id.data != 0 else None,
                cover=form.cover.data or None,
                title=form.title.data,
                description=form.description.data or '',
                price=float(form.price.data or 0),
                release_date=form.release_date.data or None,
                volumeNumber=int(form.volumeNumber.data or 1),
                isbn13=form.isbn13.data or None
            )
            db.add(b); db.commit()
        return redirect(url_for('books'))
    return render_template('new_book.html', form=form)

@app.route('/books/<int:bid>/edit', methods=['GET', 'POST'])
@login_required
def edit_book(bid: int):
    with SessionLocal() as db:
        b = db.get(Book, bid)
        if not b or b.user_id != int(current_user.id):
            return redirect(url_for('books'))
        colls = db.execute(select(Collection).where(Collection.user_id == int(current_user.id))).scalars().all()
    form = BookForm(obj=b)
    form.collection_id.choices = [(0, '-- Keine --')] + [(c.id, c.name) for c in colls]
    if form.validate_on_submit():
        with SessionLocal() as db:
            b = db.get(Book, bid)
            b.cover = form.cover.data or None
            b.title = form.title.data
            b.description = form.description.data or ''
            b.price = float(form.price.data or 0)
            b.release_date = form.release_date.data or None
            b.volumeNumber = int(form.volumeNumber.data or 1)
            b.isbn13 = form.isbn13.data or None
            b.collection_id = form.collection_id.data or None if form.collection_id.data != 0 else None
            db.commit()
        return redirect(url_for('books'))
    return render_template('edit_book.html', form=form, book_id=bid)

@app.route('/books/<int:bid>/delete', methods=['POST'])
@login_required
def delete_book(bid: int):
    with SessionLocal() as db:
        b = db.get(Book, bid)
        if b and b.user_id == int(current_user.id):
            db.delete(b); db.commit()
    return redirect(url_for('books'))

if __name__ == "__main__":
    init_db()
    app.run(host="0.0.0.0", port=int(os.environ.get("PORT", "3000")), debug=True)
