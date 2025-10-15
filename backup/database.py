from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase
from config import cfg
import os

if cfg.DATABASE_URL.startswith("sqlite"):
    path = cfg.DATABASE_URL.split("///")[-1]
    os.makedirs(os.path.dirname(path), exist_ok=True)

engine = create_engine(cfg.DATABASE_URL, echo=cfg.SQLALCHEMY_ECHO, future=True)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False, future=True)

class Base(DeclarativeBase):
    pass

def init_db():
    import models  # noqa
    Base.metadata.create_all(bind=engine)
