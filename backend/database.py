from sqlalchemy import create_engine, event
from sqlalchemy.orm import declarative_base, sessionmaker
from sqlalchemy.pool import QueuePool
from config import Config

# Optimized engine with connection pooling for better performance
engine = create_engine(
    Config.SQLALCHEMY_DATABASE_URI,
    echo=False,  # Disable SQL echo in production for performance
    pool_size=10,  # Number of connections to keep open
    max_overflow=20,  # Max connections beyond pool_size
    pool_timeout=30,  # Timeout for getting connection from pool
    pool_recycle=3600,  # Recycle connections after 1 hour
    pool_pre_ping=True,  # Verify connections before using
    poolclass=QueuePool,
    connect_args={
        "connect_timeout": 10,
        "options": "-c statement_timeout=30000"  # 30 second query timeout
    }
)

Base = declarative_base()

Session = sessionmaker(bind=engine, expire_on_commit=False)





