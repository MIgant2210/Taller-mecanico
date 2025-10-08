# user_test.py
from sqlalchemy.orm import Session
from database import SessionLocal
from auth import create_user
import schemas

def create_test_user():
    # Crear sesión de base de datos
    db: Session = SessionLocal()

    try:
        # Definir datos del usuario de prueba
        user_data = schemas.UsuarioCreate(
            username="admin",
            password="admin",   # se encripta internamente en create_user
            id_empleado=1,         # Asegúrate que exista un empleado con este ID
            id_rol=1,              # Asegúrate que exista un rol válido con este ID
            activo=True
        )

        # Crear usuario usando la función de auth.py
        user = create_user(db, user_data)
        print(f"✅ Usuario de prueba creado: ID={user.id_usuario}, username={user.username}")

    except Exception as e:
        print(f"❌ Error al crear el usuario de prueba: {e}")

    finally:
        db.close()


if __name__ == "__main__":
    create_test_user()
