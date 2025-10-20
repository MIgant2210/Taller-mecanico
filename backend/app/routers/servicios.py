from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import Optional
from database import get_db
from auth import get_current_active_user, require_admin_or_jefe
import schemas
import crud

router = APIRouter()

# =============================================
# CATEGORÍAS DE SERVICIOS
# =============================================

@router.get("/categorias-servicios", response_model=list[schemas.CategoriaServicioResponse])
def get_categorias_servicios(
    db: Session = Depends(get_db),
    current_user: schemas.UsuarioResponse = Depends(get_current_active_user)
):
    """Obtener todas las categorías de servicios"""
    return crud.get_categorias_servicios(db)

@router.post("/categorias-servicios", response_model=schemas.CategoriaServicioResponse, status_code=status.HTTP_201_CREATED)
def create_categoria_servicio(
    categoria_data: schemas.CategoriaServicioCreate,
    db: Session = Depends(get_db),
    current_user: schemas.UsuarioResponse = Depends(require_admin_or_jefe)
):
    """Crear nueva categoría de servicio (Admin/Jefe)"""
    try:
        return crud.create_categoria_servicio(db, categoria_data)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Error al crear categoría: {str(e)}"
        )

# =============================================
# SERVICIOS
# =============================================

@router.get("/servicios", response_model=list[schemas.ServicioResponse])
def get_servicios(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    categoria_id: Optional[int] = Query(None, description="Filtrar por categoría"),
    activo: bool = Query(True, description="Filtrar por servicios activos"),
    db: Session = Depends(get_db),
    current_user: schemas.UsuarioResponse = Depends(get_current_active_user)
):
    """Obtener catálogo de servicios"""
    return crud.get_servicios(db, skip=skip, limit=limit)

@router.get("/servicios/{servicio_id}", response_model=schemas.ServicioResponse)
def get_servicio(
    servicio_id: int,
    db: Session = Depends(get_db),
    current_user: schemas.UsuarioResponse = Depends(get_current_active_user)
):
    """Obtener servicio por ID"""
    servicio = crud.get_servicio(db, servicio_id)
    if not servicio:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Servicio no encontrado"
        )
    return servicio

@router.post("/servicios", response_model=schemas.ServicioResponse, status_code=status.HTTP_201_CREATED)
def create_servicio(
    servicio_data: schemas.ServicioCreate,
    db: Session = Depends(get_db),
    current_user: schemas.UsuarioResponse = Depends(require_admin_or_jefe)
):
    """Crear nuevo servicio (Admin/Jefe)"""
    # Verificar que la categoría existe si se proporciona
    if servicio_data.id_categoria_servicio:
        categoria = db.query(crud.models.CategoriaServicio).filter(
            crud.models.CategoriaServicio.id_categoria_servicio == servicio_data.id_categoria_servicio
        ).first()
        if not categoria:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Categoría de servicio no encontrada"
            )
    
    try:
        return crud.create_servicio(db, servicio_data)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Error al crear servicio: {str(e)}"
        )

@router.put("/servicios/{servicio_id}", response_model=schemas.ServicioResponse)
def update_servicio(
    servicio_id: int,
    servicio_update: schemas.ServicioCreate,
    db: Session = Depends(get_db),
    current_user: schemas.UsuarioResponse = Depends(require_admin_or_jefe)
):
    """Actualizar servicio (Admin/Jefe)"""
    servicio = crud.get_servicio(db, servicio_id)
    if not servicio:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Servicio no encontrado"
        )
    
    # Actualizar campos
    update_data = servicio_update.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(servicio, key, value)
    
    try:
        db.commit()
        db.refresh(servicio)
        return servicio
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Error al actualizar servicio: {str(e)}"
        )

@router.delete("/servicios/{servicio_id}")
def deactivate_servicio(
    servicio_id: int,
    db: Session = Depends(get_db),
    current_user: schemas.UsuarioResponse = Depends(require_admin_or_jefe)
):
    """Desactivar servicio (Admin/Jefe)"""
    servicio = crud.get_servicio(db, servicio_id)
    if not servicio:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Servicio no encontrado"
        )
    
    servicio.activo = False
    db.commit()
    
    return {"message": "Servicio desactivado correctamente"}

# =============================================
# BÚSQUEDA Y FILTROS AVANZADOS
# =============================================

@router.get("/servicios/buscar", response_model=list[schemas.ServicioResponse])
def search_servicios(
    q: str = Query(..., min_length=2, description="Término de búsqueda"),
    precio_min: Optional[float] = Query(None, ge=0, description="Precio mínimo"),
    precio_max: Optional[float] = Query(None, ge=0, description="Precio máximo"),
    categoria_id: Optional[int] = Query(None, description="Filtrar por categoría"),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: schemas.UsuarioResponse = Depends(get_current_active_user)
):
    """Buscar servicios por nombre y filtros"""
    query = db.query(crud.models.Servicio).options(
        crud.joinedload(crud.models.Servicio.categoria)
    ).filter(
        crud.models.Servicio.activo == True,
        crud.models.Servicio.nombre_servicio.contains(q)
    )
    
    if precio_min is not None:
        query = query.filter(crud.models.Servicio.precio_base >= precio_min)
    
    if precio_max is not None:
        query = query.filter(crud.models.Servicio.precio_base <= precio_max)
    
    if categoria_id:
        query = query.filter(crud.models.Servicio.id_categoria_servicio == categoria_id)
    
    return query.offset(skip).limit(limit).all()

@router.get("/servicios/populares", response_model=list[schemas.ServicioResponse])
def get_servicios_populares(
    limit: int = Query(10, ge=1, le=50),
    db: Session = Depends(get_db),
    current_user: schemas.UsuarioResponse = Depends(get_current_active_user)
):
    """Obtener servicios más utilizados"""
    # Query que cuenta cuántas veces se ha usado cada servicio
    servicios_populares = db.query(
        crud.models.Servicio,
        crud.func.count(crud.models.TicketServicio.id_servicio).label('uso_count')
    ).options(
        crud.joinedload(crud.models.Servicio.categoria)
    ).join(
        crud.models.TicketServicio, crud.models.Servicio.id_servicio == crud.models.TicketServicio.id_servicio
    ).filter(
        crud.models.Servicio.activo == True
    ).group_by(
        crud.models.Servicio.id_servicio
    ).order_by(
        crud.func.count(crud.models.TicketServicio.id_servicio).desc()
    ).limit(limit).all()
    
    # Extraer solo los servicios (sin el count)
    return [servicio for servicio, count in servicios_populares]