from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer
from sqlalchemy.orm import Session
from datetime import timedelta
from database import get_db
from auth import (
    authenticate_user, create_access_token, get_current_active_user,
    create_user, change_password, reset_password, require_admin
)
import schemas
import crud

router = APIRouter()
security = HTTPBearer()

# =============================================
# AUTENTICACIÓN
# =============================================

@router.post("/login", response_model=schemas.TokenResponse)
def login(login_data: schemas.LoginRequest, db: Session = Depends(get_db)):
    """Iniciar sesión y obtener token"""
    user = authenticate_user(db, login_data.username, login_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token_expires = timedelta(minutes=30)
    access_token = create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )
    
    # Cargar datos completos del usuario
    user_complete = crud.get_usuario_by_username(db, user.username)
    
    return schemas.TokenResponse(
        access_token=access_token,
        token_type="bearer",
        user_info=schemas.UsuarioResponse.from_orm(user_complete)
    )

@router.post("/logout")
def logout(current_user: schemas.UsuarioResponse = Depends(get_current_active_user)):
    """Cerrar sesión"""
    return {"message": "Successfully logged out"}

@router.get("/me", response_model=schemas.UsuarioResponse)
def get_current_user_info(current_user: schemas.UsuarioResponse = Depends(get_current_active_user)):
    """Obtener información del usuario actual"""
    return current_user

# =============================================
# GESTIÓN DE USUARIOS (Solo Admin)
# =============================================

@router.get("/users", response_model=list[schemas.UsuarioResponse])
def get_users(
    skip: int = 0, 
    limit: int = 100, 
    db: Session = Depends(get_db),
    # current_user: schemas.UsuarioResponse = Depends(require_admin)
):
    """Obtener lista de usuarios (Solo administrador)"""
    return crud.get_usuarios(db, skip=skip, limit=limit)

@router.post("/users", response_model=schemas.UsuarioResponse)
def create_new_user(
    user_data: schemas.UsuarioCreate,
    db: Session = Depends(get_db),
    # current_user: schemas.UsuarioResponse = Depends(require_admin)
):
    """Crear nuevo usuario (Solo administrador)"""
    return create_user(db, user_data)

@router.put("/users/{user_id}/reset-password")
def reset_user_password(
    user_id: int,
    new_password: str,
    db: Session = Depends(get_db),
    #current_user: schemas.UsuarioResponse = Depends(require_admin)
):
    """Resetear password de usuario (Solo administrador)"""
    return reset_password(db, user_id, new_password, current_user)

# =============================================
# CAMBIO DE PASSWORD
# =============================================

@router.put("/change-password")
def change_user_password(
    old_password: str,
    new_password: str,
    db: Session = Depends(get_db),
    current_user: schemas.UsuarioResponse = Depends(get_current_active_user)
):
    """Cambiar password del usuario actual"""
    return change_password(db, current_user.id_usuario, old_password, new_password)

# =============================================
# ROLES Y PERMISOS
# =============================================

@router.get("/roles", response_model=list[schemas.RolResponse])
def get_roles(db: Session = Depends(get_db)):
    """Obtener lista de roles disponibles"""
    return crud.get_roles(db)

@router.post("/roles", response_model=schemas.RolResponse)
def create_role(
    rol_data: schemas.RolCreate,
    db: Session = Depends(get_db),
    current_user: schemas.UsuarioResponse = Depends(require_admin)
):
    """Crear nuevo rol (Solo administrador)"""
    return crud.create_rol(db, rol_data)

# =============================================
# EMPLEADOS Y PUESTOS
# =============================================

@router.get("/empleados", response_model=list[schemas.EmpleadoResponse])
def get_empleados(
    skip: int = 0, 
    limit: int = 100, 
    db: Session = Depends(get_db),
    current_user: schemas.UsuarioResponse = Depends(get_current_active_user)
):
    """Obtener lista de empleados"""
    return crud.get_empleados(db, skip=skip, limit=limit)

@router.get("/empleados/{empleado_id}", response_model=schemas.EmpleadoResponse)
def get_empleado(
    empleado_id: int,
    db: Session = Depends(get_db),
    current_user: schemas.UsuarioResponse = Depends(get_current_active_user)
):
    """Obtener empleado por ID"""
    empleado = crud.get_empleado(db, empleado_id)
    if not empleado:
        raise HTTPException(status_code=404, detail="Employee not found")
    return empleado

@router.post("/empleados", response_model=schemas.EmpleadoResponse)
def create_empleado(
    empleado_data: schemas.EmpleadoCreate,
    db: Session = Depends(get_db),
    current_user: schemas.UsuarioResponse = Depends(require_admin)
):
    """Crear nuevo empleado (Solo administrador)"""
    return crud.create_empleado(db, empleado_data)

@router.get("/puestos", response_model=list[schemas.PuestoResponse])
def get_puestos(db: Session = Depends(get_db)):
    """Obtener lista de puestos de trabajo"""
    return crud.get_puestos(db)

@router.post("/puestos", response_model=schemas.PuestoResponse)
def create_puesto(
    puesto_data: schemas.PuestoCreate,
    db: Session = Depends(get_db),
    current_user: schemas.UsuarioResponse = Depends(require_admin)
):
    """Crear nuevo puesto de trabajo (Solo administrador)"""
    return crud.create_puesto(db, puesto_data)