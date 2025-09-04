from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from decouple import config
from database import init_db
from routers import auth, clientes, servicios, inventario, tickets, facturas

# Crear la aplicación FastAPI
app = FastAPI(
    title=config('PROJECT_NAME', default='Sistema Taller Mecánico'),
    version=config('VERSION', default='1.0.0'),
    description="API REST para sistema de gestión de taller mecánico",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Configurar CORS
allowed_origins = config('ALLOWED_HOSTS', default='["http://localhost:3000"]')
if isinstance(allowed_origins, str):
    import json
    allowed_origins = json.loads(allowed_origins)

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["*"],
)

# Incluir todos los routers
app.include_router(auth.router, prefix="/api/v1/auth", tags=["autenticación"])
app.include_router(clientes.router, prefix="/api/v1", tags=["clientes"])
app.include_router(servicios.router, prefix="/api/v1", tags=["servicios"])
app.include_router(inventario.router, prefix="/api/v1", tags=["inventario"])
app.include_router(tickets.router, prefix="/api/v1", tags=["operaciones"])
app.include_router(facturas.router, prefix="/api/v1", tags=["facturación"])

# Evento de inicio de la aplicación
@app.on_event("startup")
async def startup_event():
    """Inicializar la base de datos al iniciar la aplicación"""
    init_db()

# Endpoint raíz
@app.get("/")
def read_root():
    return {
        "message": "Sistema Taller Mecánico API",
        "version": config('VERSION', default='1.0.0'),
        "docs": "/docs",
        "redoc": "/redoc"
    }

# Endpoint de salud
@app.get("/health")
def health_check():
    return {"status": "healthy", "service": "taller-api"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=config('DEBUG', default=False, cast=bool)
    )