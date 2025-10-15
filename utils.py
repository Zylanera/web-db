from datetime import date, timedelta
from sqlalchemy import select, func, extract
from models import Book, Collection

def month_bounds(dt: date):
    first = dt.replace(day=1)
    if first.month == 12:
        next_first = first.replace(year=first.year+1, month=1)
    else:
        next_first = first.replace(month=first.month+1)
    return first, next_first - timedelta(days=1)

def get_statistics(db, user_id: int | None = None):
    today = date.today()
    m_first, m_last = month_bounds(today)
    lm_first, lm_last = month_bounds((today.replace(day=1) - timedelta(days=1)))

    filters = []
    if user_id:
        filters.append(Book.user_id == user_id)

    monthly = db.execute(select(func.count()).select_from(Book).where(*(filters + [Book.release_date >= m_first, Book.release_date <= m_last]))).scalar_one()
    last_month = db.execute(select(func.count()).select_from(Book).where(*(filters + [Book.release_date >= lm_first, Book.release_date <= lm_last]))).scalar_one()
    book_entries = db.execute(select(func.count()).select_from(Book).where(*filters)).scalar_one()
    q_colls = select(func.count()).select_from(Collection)
    if user_id: q_colls = q_colls.where(Collection.user_id == user_id)
    collection_entries = db.execute(q_colls).scalar_one()
    average = float(db.execute(select(func.avg(Book.price)).where(*filters)).scalar() or 0.0)
    year_rows = db.execute(
        select(extract("month", Book.release_date), func.count())
        .where(*filters).where(extract("year", Book.release_date) == today.year)
        .group_by(extract("month", Book.release_date)).order_by(extract("month", Book.release_date))
    ).all()
    yearly = [{"month": int(m or 0), "count": int(c or 0)} for m, c in year_rows]
    return {
        "monthlyReleases": [{"count": int(monthly)}],
        "lastMonthReleases": [{"count": int(last_month)}],
        "bookEntries": [{"count": int(book_entries)}],
        "collectionEntries": [{"count": int(collection_entries)}],
        "averagePrice": [{"average": average}],
        "yearlyReleases": yearly,
    }

# ==== RBAC & Permissions helpers ====
from flask import abort
from flask_login import current_user
from functools import wraps
from typing import Callable
from models import AuditLog, Collection, Book
from database import SessionLocal


def role_in(min_role: str) -> bool:
    order = {"viewer": 0, "editor": 1, "admin": 2}
    try:
        return order.get(getattr(current_user, "role", "viewer"), 0) >= order[min_role]
    except Exception:
        return False

def role_required(min_role: str):
    def decorator(f: Callable):
        @wraps(f)
        def wrapper(*args, **kwargs):
            if not current_user.is_authenticated or not role_in(min_role):
                from flask import abort
                return abort(403)
            return f(*args, **kwargs)
        return wrapper
    return decorator

def can_view(obj, user) -> bool:
    if getattr(user, "role", "viewer") == "admin":
        return True
    rule = getattr(obj, "visible_to", "all")
    if rule == "all":
        return True
    if rule == "editor" and getattr(user, "role", "viewer") in {"editor"}:
        return True
    if rule == "owner" and getattr(obj, "user_id", None) == int(getattr(user, "id", -1)):
        return True
    if rule == "admin":
        return getattr(user, "role", "viewer") == "admin"
    return False

def can_edit(obj, user) -> bool:
    if getattr(user, "role", "viewer") == "admin":
        return True
    rule = getattr(obj, "editable_by", "owner")
    if rule == "editor" and getattr(user, "role", "viewer") in {"editor"}:
        return True
    if rule == "owner" and getattr(obj, "user_id", None) == int(getattr(user, "id", -1)):
        return True
    return False

def log_action(user, action: str, target_type: str, target_id: int | None, details: str | None = None, db=None):
    """Writes an audit log entry, optionally using an existing session."""
    try:
        if db is None:
            with SessionLocal() as db_new:
                entry = AuditLog(
                    user_id=(int(user.id) if getattr(user, "is_authenticated", False) else None),
                    action=action,
                    target_type=target_type,
                    target_id=target_id,
                    details=details,
                )
                db_new.add(entry)
                db_new.commit()
        else:
            entry = AuditLog(
                user_id=(int(user.id) if getattr(user, "is_authenticated", False) else None),
                action=action,
                target_type=target_type,
                target_id=target_id,
                details=details,
            )
            db.add(entry)
            
    except Exception as e:
        print("Audit log failed:", e)
        pass

def admin_required(f):
    from functools import wraps
    @wraps(f)
    def wrapper(*args, **kwargs):
        if not current_user.is_authenticated or current_user.role != 'admin':
            abort(403)
        return f(*args, **kwargs)
    return wrapper
