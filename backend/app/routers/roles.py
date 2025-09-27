from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from pydantic import BaseModel
from typing import List

router = APIRouter()

# Modelo Pydantic (respuesta JSON)
class RolOut(BaseModel):
    id_rol: int
    nombre_rol: str
    descripcion: str | None = None

    class Config:
        orm_mode = True

# GET - listar roles
@router.get("/roles", response_model=List[RolOut])
def listar_roles(db: Session = Depends(get_db)):
    roles = db.execute("SELECT id_rol, nombre_rol, descripcion FROM roles").fetchall()
    return roles
