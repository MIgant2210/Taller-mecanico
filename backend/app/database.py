from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from decouple import config

# Configuración de la base de datos
DATABASE_URL = config('DATABASE_URL')

# Crear el engine
engine = create_engine(
    DATABASE_URL,
    echo=config('DEBUG', default=False, cast=bool),
    pool_pre_ping=True,
    pool_recycle=300
)

# Crear SessionLocal
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base para los modelos
Base = declarative_base()

# Dependency para obtener la sesión de base de datos
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Función para inicializar la base de datos
def init_db():
    """Crear todas las tablas en la base de datos"""
    Base.metadata.create_all(bind=engine)