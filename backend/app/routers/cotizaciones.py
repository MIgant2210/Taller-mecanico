from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db
import schemas, crud
from typing import List

router = APIRouter(prefix="/cotizaciones", tags=["Cotizaciones"])

@router.post("/", response_model=schemas.CotizacionResponse)
def crear_cotizacion(
    cotizacion_data: schemas.CotizacionCreate,
    db: Session = Depends(get_db)
):
    return crud.create_cotizacion(db, cotizacion_data)

@router.get("/", response_model=List[schemas.CotizacionResponse])
def listar_cotizaciones(db: Session = Depends(get_db)):
    return crud.get_all_cotizaciones(db)

@router.get("/{id_cotizacion}", response_model=schemas.CotizacionResponse)
def get_cotizacion(id_cotizacion: int, db: Session = Depends(get_db)):
    return crud.get_cotizacion(db, id_cotizacion)

@router.put("/{id_cotizacion}", response_model=schemas.CotizacionResponse)
def update_cotizacion(
    id_cotizacion: int,
    cotizacion_data: schemas.CotizacionUpdate,
    db: Session = Depends(get_db)
):
    return crud.update_cotizacion(db, id_cotizacion, cotizacion_data)

@router.delete("/{id_cotizacion}", response_model=schemas.CotizacionResponse)
def delete_cotizacion(id_cotizacion: int, db: Session = Depends(get_db)):
    return crud.delete_cotizacion(db, id_cotizacion)
