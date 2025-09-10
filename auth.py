from flask_login import LoginManager, UserMixin
from sqlalchemy.orm import Session
from models import User
from database import SessionLocal

login_manager = LoginManager()
login_manager.login_view = "login"

class LoginUser(UserMixin):
    def __init__(self, db_user: User):
        self.id = str(db_user.id)
        self.role = db_user.role
        self.username = db_user.username

@login_manager.user_loader
def load_user(user_id: str):
    with SessionLocal() as db:
        u = db.get(User, int(user_id))
        if u:
            return LoginUser(u)
        return None
