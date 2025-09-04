from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import Optional
from database import get_db
from auth import get_current_active_user, require_admin_or_jefe
import schemas
import crud

router = APIRouter()

# =============================================
# PROVEEDORES
# =============================================

@router.get("/proveedores", response_model=list[schemas.ProveedorResponse])
def get_proveedores(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    activo: bool = Query(True, description="Filtrar proveedores activos"),
    db: Session = Depends(get_db),
    current_user: schemas.UsuarioResponse = Depends(get_current_active_user)
):
    """Obtener lista de proveedores"""
    return crud.get_proveedores(db, skip=skip, limit=limit)

@router.post("/proveedores", response_model=schemas.ProveedorResponse, status_code=status.HTTP_201_CREATED)
def create_proveedor(
    proveedor_data: schemas.ProveedorCreate,
    db: Session = Depends(get_db),
    current_user: schemas.UsuarioResponse = Depends(require_admin_or_jefe)
):
    """Crear nuevo proveedor (Admin/Jefe)"""
    try:
        return crud.create_proveedor(db, proveedor_data)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Error al crear proveedor: {str(e)}"
        )

# =============================================
# CATEGORÍAS DE REPUESTOS
# =============================================

@router.get("/categorias-repuestos", response_model=list[schemas.CategoriaRepuestoResponse])
def get_categorias_repuestos(
    db: Session = Depends(get_db),
    current_user: schemas.UsuarioResponse = Depends(get_current_active_user)
):
    """Obtener todas las categorías de repuestos"""
    return crud.get_categorias_repuestos(db)

@router.post("/categorias-repuestos", response_model=schemas.CategoriaRepuestoResponse, status_code=status.HTTP_201_CREATED)
def create_categoria_repuesto(
    categoria_data: schemas.CategoriaRepuestoCreate,
    db: Session = Depends(get_db),
    current_user: schemas.UsuarioResponse = Depends(require_admin_or_jefe)
):
    """Crear nueva categoría de repuesto (Admin/Jefe)"""
    try:
        return crud.create_categoria_repuesto(db, categoria_data)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Error al crear categoría: {str(e)}"
        )

# =============================================
# REPUESTOS
# =============================================

@router.get("/repuestos", response_model=list[schemas.RepuestoResponse])
def get_repuestos(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    search: Optional[str] = Query(None, description="Buscar por código o nombre"),
    categoria_id: Optional[int] = Query(None, description="Filtrar por categoría"),
    proveedor_id: Optional[int] = Query(None, description="Filtrar por proveedor"),
    stock_bajo: bool = Query(False, description="Solo repuestos con stock bajo"),
    db: Session = Depends(get_db),
    current_user: schemas.UsuarioResponse = Depends(get_current_active_user)
):
    """Obtener inventario de repuestos con filtros"""
    if stock_bajo:
        return crud.get_repuestos_stock_bajo(db)
    
    return crud.get_repuestos(db, skip=skip, limit=limit, search=search, categoria_id=categoria_id)

@router.get("/repuestos/{repuesto_id}", response_model=schemas.RepuestoResponse)
def get_repuesto(
    repuesto_id: int,
    db: Session = Depends(get_db),
    current_user: schemas.UsuarioResponse = Depends(get_current_active_user)
):
    """Obtener repuesto por ID"""
    repuesto = crud.get_repuesto(db, repuesto_id)
    if not repuesto:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Repuesto no encontrado"
        )
    return repuesto

@router.get("/repuestos/codigo/{codigo}", response_model=schemas.RepuestoResponse)
def get_repuesto_by_codigo(
    codigo: str,
    db: Session = Depends(get_db),
    current_user: schemas.UsuarioResponse = Depends(get_current_active_user)
):
    """Obtener repuesto por código"""
    repuesto = crud.get_repuesto_by_codigo(db, codigo)
    if not repuesto:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Repuesto no encontrado"
        )
    return repuesto

@router.post("/repuestos", response_model=schemas.RepuestoResponse, status_code=status.HTTP_201_CREATED)
def create_repuesto(
    repuesto_data: schemas.RepuestoCreate,
    db: Session = Depends(get_db),
    current_user: schemas.UsuarioResponse = Depends(require_admin_or_jefe)
):
    """Crear nuevo repuesto (Admin/Jefe)"""
    # Verificar que el código no existe
    existing = crud.get_repuesto_by_codigo(db, repuesto_data.codigo_repuesto)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Ya existe un repuesto con este código"
        )
    
    try:
        return crud.create_repuesto(db, repuesto_data)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Error al crear repuesto: {str(e)}"
        )

@router.put("/repuestos/{repuesto_id}", response_model=schemas.RepuestoResponse)
def update_repuesto(
    repuesto_id: int,
    repuesto_update: schemas.RepuestoUpdate,
    db: Session = Depends(get_db),
    current_user: schemas.UsuarioResponse = Depends(require_admin_or_jefe)
):
    """Actualizar repuesto (Admin/Jefe)"""
    repuesto = crud.update_repuesto(db, repuesto_id, repuesto_update)
    if not repuesto:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Repuesto no encontrado"
        )
    return repuesto

# =============================================
# GESTIÓN DE STOCK
# =============================================

@router.put("/repuestos/{repuesto_id}/stock")
def update_stock_repuesto(
    repuesto_id: int,
    stock_data: schemas.StockUpdate,
    db: Session = Depends(get_db),
    current_user: schemas.UsuarioResponse = Depends(require_admin_or_jefe)
):
    """Actualizar stock de repuesto manualmente"""
    repuesto = crud.get_repuesto(db, repuesto_id)
    if not repuesto:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Repuesto no encontrado"
        )
    
    # Determinar tipo de movimiento
    tipo_movimiento_id = 1 if stock_data.tipo_movimiento == "entrada" else 2
    nueva_cantidad = repuesto.stock_actual + stock_data.cantidad if stock_data.tipo_movimiento == "entrada" else repuesto.stock_actual - stock_data.cantidad
    
    if nueva_cantidad < 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Stock no puede ser negativo"
        )
    
    try:
        updated_repuesto = crud.actualizar_stock_repuesto(
            db, 
            repuesto_id, 
            nueva_cantidad, 
            tipo_movimiento_id, 
            current_user.id_empleado,
            stock_data.observaciones
        )
        return {"message": "Stock actualizado correctamente", "nuevo_stock": updated_repuesto.stock_actual}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Error al actualizar stock: {str(e)}"
        )

@router.get("/repuestos/stock-bajo", response_model=list[schemas.RepuestoResponse])
def get_stock_bajo(
    db: Session = Depends(get_db),
    current_user: schemas.UsuarioResponse = Depends(get_current_active_user)
):
    """Obtener repuestos con stock bajo el mínimo"""
    return crud.get_repuestos_stock_bajo(db)

# =============================================
# MOVIMIENTOS DE INVENTARIO
# =============================================

@router.get("/movimientos-inventario", response_model=list[schemas.MovimientoInventarioResponse])
def get_movimientos_inventario(
    repuesto_id: Optional[int] = Query(None, description="Filtrar por repuesto"),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    db: Session = Depends(get_db),
    current_user: schemas.UsuarioResponse = Depends(get_current_active_user)
):
    """Obtener historial de movimientos de inventario"""
    return crud.get_movimientos_inventario(db, repuesto_id=repuesto_id, skip=skip, limit=limit)

@router.get("/tipos-movimiento", response_model=list[schemas.TipoMovimientoInventarioResponse])
def get_tipos_movimiento(
    db: Session = Depends(get_db),
    current_user: schemas.UsuarioResponse = Depends(get_current_active_user)
):
    """Obtener tipos de movimiento de inventario"""
    return crud.get_tipos_movimiento(db)

@router.post("/movimientos-inventario", response_model=schemas.MovimientoInventarioResponse, status_code=status.HTTP_201_CREATED)
def create_movimiento_inventario(
    movimiento_data: schemas.MovimientoInventarioCreate,
    db: Session = Depends(get_db),
    current_user: schemas.UsuarioResponse = Depends(require_admin_or_jefe)
):
    """Crear movimiento de inventario manual (Admin/Jefe)"""
    try:
        return crud.create_movimiento_inventario(db, movimiento_data, current_user.id_empleado)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al crear movimiento: {str(e)}"
        )

# =============================================
# REPORTES DE INVENTARIO
# =============================================

@router.get("/inventario/resumen")
def get_resumen_inventario(
    db: Session = Depends(get_db),
    current_user: schemas.UsuarioResponse = Depends(get_current_active_user)
):
    """Obtener resumen del inventario"""
    total_repuestos = db.query(crud.models.Repuesto).filter(crud.models.Repuesto.activo == True).count()
    stock_bajo = len(crud.get_repuestos_stock_bajo(db))
    
    valor_total_inventario = db.query(
        crud.func.sum(crud.models.Repuesto.stock_actual * crud.models.Repuesto.precio_compra)
    ).filter(crud.models.Repuesto.activo == True).scalar() or 0
    
    return {
        "total_repuestos": total_repuestos,
        "repuestos_stock_bajo": stock_bajo,
        "valor_total_inventario": float(valor_total_inventario),
        "fecha_reporte": crud.datetime.now().isoformat()
    }