from fastapi import FastAPI, HTTPException, Depends
from fastapi.security import OAuth2PasswordBearer
from pydantic import BaseModel
from jose import JWTError, jwt
from passlib.context import CryptContext
from datetime import datetime, timedelta
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configuración de seguridad
SECRET_KEY = "taller-mecanico-secreto"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

fake_users_db = {
    "admin": {
        "username": "admin",
        "hashed_password": "$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW",  # bcrypt de "123456"
    }
}

class User(BaseModel):
    username: str

class UserInDB(User):
    hashed_password: str

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

@app.post("/token")
async def login(username: str, password: str):
    user_dict = fake_users_db.get(username)
    if not user_dict or not verify_password(password, user_dict["hashed_password"]):
        raise HTTPException(status_code=400, detail="Credenciales incorrectas")
    return {"access_token": username, "token_type": "bearer"}

@app.get("/")
async def home():
    return {"message": "¡Bienvenido al taller mecánico!"}

@app.get("/api/clientes")
async def get_clientes():
    return [
        {"id": 1, "nombre": "Juan Pérez", "telefono": "555-1234", "vehiculos": [1, 2]},
        {"id": 2, "nombre": "María Gómez", "telefono": "555-5678", "vehiculos": [3]}
    ]