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
