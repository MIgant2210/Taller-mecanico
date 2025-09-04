from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from decouple import config
from database import get_db
from models import Usuario, Empleado, Rol
import schemas

# Configuración de seguridad
SECRET_KEY = config('SECRET_KEY')
ALGORITHM = config('ALGORITHM', default='HS256')
ACCESS_TOKEN_EXPIRE_MINUTES = config('ACCESS_TOKEN_EXPIRE_MINUTES', default=30, cast=int)

# Context para hash de passwords
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Security scheme
security = HTTPBearer()

# =============================================
# FUNCIONES DE HASHING
# =============================================

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verificar password plano contra hash"""
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    """Generar hash de password"""
    return pwd_context.hash(password)

# =============================================
# FUNCIONES JWT
# =============================================

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    """Crear token JWT"""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def decode_access_token(token: str):
    """Decodificar token JWT"""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            return None
        return username
    except JWTError:
        return None

# =============================================
# AUTENTICACIÓN DE USUARIOS
# =============================================

def authenticate_user(db: Session, username: str, password: str):
    """Autenticar usuario con username y password"""
    user = db.query(Usuario).filter(
        Usuario.username == username,
        Usuario.activo == True
    ).first()
    
    if not user:
        return False
    if not verify_password(password, user.password_hash):
        return False
    
    # Actualizar último acceso
    user.ultimo_acceso = datetime.utcnow()
    db.commit()
    
    return user

def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
):
    """Obtener usuario actual desde token JWT"""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        token = credentials.credentials
        username = decode_access_token(token)
        if username is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    user = db.query(Usuario).filter(
        Usuario.username == username,
        Usuario.activo == True
    ).first()
    
    if user is None:
        raise credentials_exception
    
    return user

def get_current_active_user(current_user: Usuario = Depends(get_current_user)):
    """Verificar que el usuario esté activo"""
    if not current_user.activo:
        raise HTTPException(status_code=400, detail="Inactive user")
    return current_user

# =============================================
# AUTORIZACIÓN POR ROLES
# =============================================

class RoleChecker:
    def __init__(self, allowed_roles: list):
        self.allowed_roles = allowed_roles

    def __call__(self, current_user: Usuario = Depends(get_current_active_user)):
        if current_user.rol.nombre_rol not in self.allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Operation not permitted"
            )
        return current_user

# Decoradores de roles específicos
require_admin = RoleChecker(["Administrador"])
require_admin_or_jefe = RoleChecker(["Administrador", "Jefe de Taller"])
require_any_role = RoleChecker(["Administrador", "Jefe de Taller", "Mecánico", "Recepcionista"])

# =============================================
# UTILIDADES DE USUARIO
# =============================================

def create_user(db: Session, user_data: schemas.UsuarioCreate) -> Usuario:
    """Crear nuevo usuario"""
    # Verificar que no exista el username
    if db.query(Usuario).filter(Usuario.username == user_data.username).first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already registered"
        )
    
    # Verificar que el empleado exista
    empleado = db.query(Empleado).filter(Empleado.id_empleado == user_data.id_empleado).first()
    if not empleado:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Employee not found"
        )
    
    # Verificar que el empleado no tenga usuario
    if db.query(Usuario).filter(Usuario.id_empleado == user_data.id_empleado).first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Employee already has a user account"
        )
    
    # Crear el usuario
    hashed_password = get_password_hash(user_data.password)
    db_user = Usuario(
        username=user_data.username,
        password_hash=hashed_password,
        id_empleado=user_data.id_empleado,
        id_rol=user_data.id_rol,
        activo=user_data.activo
    )
    
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    
    return db_user

def change_password(db: Session, user_id: int, old_password: str, new_password: str):
    """Cambiar password de usuario"""
    user = db.query(Usuario).filter(Usuario.id_usuario == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    if not verify_password(old_password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Incorrect password"
        )
    
    user.password_hash = get_password_hash(new_password)
    db.commit()
    
    return {"message": "Password updated successfully"}

def reset_password(db: Session, user_id: int, new_password: str, admin_user: Usuario):
    """Resetear password (solo admin)"""
    if admin_user.rol.nombre_rol != "Administrador":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only administrators can reset passwords"
        )
    
    user = db.query(Usuario).filter(Usuario.id_usuario == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    user.password_hash = get_password_hash(new_password)
    db.commit()
    
    return {"message": "Password reset successfully"}