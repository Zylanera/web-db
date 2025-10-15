from flask import Blueprint, render_template, redirect, url_for, request, abort, flash
from flask_login import login_required, current_user
from sqlalchemy import select
from sqlalchemy.orm import joinedload
from database import SessionLocal
from models import User, Collection, Book, AuditLog
from utils import role_required, log_action

bp = Blueprint("admin", __name__, url_prefix="/admin")

# --- Übersicht / Hauptmenü ---
@bp.route("/")
@login_required
@role_required("admin")
def index():
    """Admin-Hauptmenü."""
    return render_template("admin/index.html")


# --- Benutzerverwaltung ---
@bp.route("/users")
@login_required
@role_required("admin")
def users():
    with SessionLocal() as db:
        users = db.execute(select(User)).scalars().all()
    return render_template("admin/users.html", users=users)


@bp.post("/users/<int:uid>/role")
@login_required
@role_required("admin")
def set_role(uid: int):
    """Ändert die Rolle eines Benutzers."""
    role = request.form.get("role", "viewer")
    if role not in {"viewer", "editor", "admin"}:
        abort(400)
    with SessionLocal() as db:
        u = db.get(User, uid)
        if not u:
            abort(404)
        u.role = role
        db.commit()
    log_action(current_user, f"set role={role}", "User", uid)
    flash("Rolle aktualisiert.", "success")
    return redirect(url_for("admin.users"))


# --- Collections & Books (Entities + Berechtigungen) ---
@bp.route("/entities")
@login_required
@role_required("admin")
def entities():
    """Verwaltet Bücher und Collections inkl. Berechtigungen."""
    with SessionLocal() as db:
        collections = db.execute(
            select(Collection).options(joinedload(Collection.owner))
        ).scalars().all()
        books = db.execute(
            select(Book).options(joinedload(Book.owner))
        ).scalars().all()
    return render_template("admin/entities.html", collections=collections, books=books)


@bp.post("/collections/<int:cid>/permissions")
@login_required
@role_required("admin")
def set_collection_permissions(cid: int):
    """Setzt Berechtigungen für eine Collection."""
    visible_to = request.form.get("visible_to", "all")
    editable_by = request.form.get("editable_by", "owner")
    if visible_to not in {"all", "admin", "editor", "owner"} or editable_by not in {"owner", "editor", "admin"}:
        abort(400)
    with SessionLocal() as db:
        c = db.get(Collection, cid)
        if not c:
            abort(404)
        c.visible_to = visible_to
        c.editable_by = editable_by
        db.commit()
    log_action(current_user, f"update permissions v={visible_to} e={editable_by}", "Collection", cid)
    flash("Berechtigungen aktualisiert.", "success")
    return redirect(url_for("admin.entities"))


@bp.post("/books/<int:bid>/permissions")
@login_required
@role_required("admin")
def set_book_permissions(bid: int):
    """Setzt Berechtigungen für ein Buch."""
    visible_to = request.form.get("visible_to", "all")
    editable_by = request.form.get("editable_by", "owner")
    if visible_to not in {"all", "admin", "editor", "owner"} or editable_by not in {"owner", "editor", "admin"}:
        abort(400)
    with SessionLocal() as db:
        b = db.get(Book, bid)
        if not b:
            abort(404)
        b.visible_to = visible_to
        b.editable_by = editable_by
        db.commit()
    log_action(current_user, f"update permissions v={visible_to} e={editable_by}", "Book", bid)
    flash("Berechtigungen aktualisiert.", "success")
    return redirect(url_for("admin.entities"))


# --- Audit Log (mit Pagination, unlimitiert) ---
@bp.route("/audit")
@login_required
@role_required("admin")
def audit():
    page = int(request.args.get("page", 1))
    per_page = 50
    offset = (page - 1) * per_page

    with SessionLocal() as db:
        total = db.query(AuditLog).count()
        logs = (
            db.query(AuditLog)
            .order_by(AuditLog.timestamp.desc())
            .offset(offset)
            .limit(per_page)
            .all()
        )

    has_next = total > offset + per_page
    has_prev = page > 1

    return render_template(
        "admin/audit.html",
        logs=logs,
        page=page,
        has_next=has_next,
        has_prev=has_prev,
        total=total,
    )
