from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import Optional
from database import get_db
from auth import get_current_active_user
import schemas
import crud

router = APIRouter()

# =============================================
# CLIENTES
# =============================================

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import Optional
from database import get_db
from auth import get_current_active_user
import schemas
import crud

router = APIRouter()

# =============================================
# CLIENTES
# =============================================

@router.get("/clientes", response_model=list[schemas.ClienteResponse])
def get_clientes(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    search: Optional[str] = Query(None, description="Buscar por nombre, cédula o teléfono"),
    db: Session = Depends(get_db),
    current_user: schemas.UsuarioResponse = Depends(get_current_active_user)
):
    """Obtener lista de clientes con búsqueda opcional"""
    return crud.get_clientes(db, skip=skip, limit=limit, search=search)

@router.get("/clientes/{cliente_id}", response_model=schemas.ClienteResponse)
def get_cliente(
    cliente_id: int,
    db: Session = Depends(get_db),
    current_user: schemas.UsuarioResponse = Depends(get_current_active_user)
):
    """Obtener cliente por ID"""
    cliente = crud.get_cliente(db, cliente_id)
    if not cliente:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Cliente no encontrado"
        )
    return cliente

@router.post("/clientes", response_model=schemas.ClienteResponse, status_code=status.HTTP_201_CREATED)
def create_cliente(
    cliente_data: schemas.ClienteCreate,
    db: Session = Depends(get_db),
    current_user: schemas.UsuarioResponse = Depends(get_current_active_user)
):
    """Crear nuevo cliente"""
    try:
        return crud.create_cliente(db, cliente_data)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Error al crear cliente: {str(e)}"
        )

@router.put("/clientes/{cliente_id}", response_model=schemas.ClienteResponse)
def update_cliente(
    cliente_id: int,
    cliente_update: schemas.ClienteUpdate,
    db: Session = Depends(get_db),
    current_user: schemas.UsuarioResponse = Depends(get_current_active_user)
):
    """Actualizar datos del cliente"""
    cliente = crud.update_cliente(db, cliente_id, cliente_update)
    if not cliente:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Cliente no encontrado"
        )
    return cliente

@router.get("/clientes/{cliente_id}/vehiculos", response_model=list[schemas.VehiculoResponse])
def get_vehiculos_cliente(
    cliente_id: int,
    db: Session = Depends(get_db),
    current_user: schemas.UsuarioResponse = Depends(get_current_active_user)
):
    """Obtener vehículos de un cliente"""
    # Verificar que el cliente existe
    cliente = crud.get_cliente(db, cliente_id)
    if not cliente:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Cliente no encontrado"
        )
    
    return crud.get_vehiculos_by_cliente(db, cliente_id)

# =============================================
# VEHÍCULOS
# =============================================

@router.get("/vehiculos/{vehiculo_id}", response_model=schemas.VehiculoResponse)
def get_vehiculo(
    vehiculo_id: int,
    db: Session = Depends(get_db),
    current_user: schemas.UsuarioResponse = Depends(get_current_active_user)
):
    """Obtener vehículo por ID"""
    vehiculo = crud.get_vehiculo(db, vehiculo_id)
    if not vehiculo:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Vehículo no encontrado"
        )
    return vehiculo

@router.post("/vehiculos", response_model=schemas.VehiculoResponse, status_code=status.HTTP_201_CREATED)
def create_vehiculo(
    vehiculo_data: schemas.VehiculoCreate,
    db: Session = Depends(get_db),
    current_user: schemas.UsuarioResponse = Depends(get_current_active_user)
):
    """Registrar nuevo vehículo"""
    # Verificar que el cliente existe
    cliente = crud.get_cliente(db, vehiculo_data.id_cliente)
    if not cliente:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Cliente no encontrado"
        )
    
    try:
        return crud.create_vehiculo(db, vehiculo_data)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Error al registrar vehículo: {str(e)}"
        )

@router.get("/vehiculos", response_model=list[schemas.VehiculoResponse])
def search_vehiculos(
    placa: Optional[str] = Query(None, description="Buscar por placa"),
    marca: Optional[str] = Query(None, description="Filtrar por marca"),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    db: Session = Depends(get_db),
    current_user: schemas.UsuarioResponse = Depends(get_current_active_user)
):
    """Buscar vehículos con filtros opcionales"""
    # Esta función requerirá una implementación más específica en crud.py
    # Por ahora, retornamos todos los vehículos (se puede implementar después)
    vehiculos = db.query(crud.models.Vehiculo).options(
        crud.joinedload(crud.models.Vehiculo.cliente)
    )
    
    if placa:
        vehiculos = vehiculos.filter(crud.models.Vehiculo.placa.contains(placa))
    if marca:
        vehiculos = vehiculos.filter(crud.models.Vehiculo.marca.contains(marca))
    
    return vehiculos.offset(skip).limit(limit).all()