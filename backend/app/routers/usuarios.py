from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
from database import get_db
from models import Usuario as UsuarioModel

router = APIRouter()

# Pydantic
class UsuarioResponse(BaseModel):
    id_usuario: int
    username: str
    id_rol: Optional[int]
    activo: bool
    ultimo_acceso: Optional[str] = None
    fecha_creacion: Optional[str] = None

    class Config:
        orm_mode = True

class UsuarioCreate(BaseModel):
    username: str
    password: str
    id_empleado: Optional[int] = None
    id_rol: Optional[int] = None

# GET - listar usuarios
@router.get("/usuarios", response_model=List[UsuarioResponse])
def listar_usuarios(db: Session = Depends(get_db)):
    return db.query(UsuarioModel).all()

# POST - crear usuario
@router.post("/usuarios", response_model=UsuarioResponse)
def crear_usuario(usuario: UsuarioCreate, db: Session = Depends(get_db)):
    nuevo_usuario = UsuarioModel(
        username=usuario.username,
        password_hash=usuario.password,  # luego le ponemos hashing
        id_empleado=usuario.id_empleado,
        id_rol=usuario.id_rol,
        activo=True
    )
    db.add(nuevo_usuario)
    db.commit()
    db.refresh(nuevo_usuario)
    return nuevo_usuario

# PUT - actualizar usuario
@router.put("/usuarios/{usuario_id}", response_model=UsuarioResponse)
def actualizar_usuario(usuario_id: int, usuario: UsuarioCreate, db: Session = Depends(get_db)):
    usuario_db = db.query(UsuarioModel).filter(UsuarioModel.id_usuario == usuario_id).first()
    if not usuario_db:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    usuario_db.username = usuario.username
    usuario_db.password_hash = usuario.password
    usuario_db.id_empleado = usuario.id_empleado
    usuario_db.id_rol = usuario.id_rol
    db.commit()
    db.refresh(usuario_db)
    return usuario_db

# DELETE - eliminar usuario
@router.delete("/usuarios/{usuario_id}")
def eliminar_usuario(usuario_id: int, db: Session = Depends(get_db)):
    usuario_db = db.query(UsuarioModel).filter(UsuarioModel.id_usuario == usuario_id).first()
    if not usuario_db:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    db.delete(usuario_db)
    db.commit()
    return {"message": "Usuario eliminado"}

