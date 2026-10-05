from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from db import get_neon_connection

from crud import router as produtor_router
from crud_funcionario import router as funcionario_router
from crud_pecuarista import router as pecuarista_router
from crud_agricultor import router as agricultor_router
from crud_parceria import router as parceria_router
from crud_administrador import router as administrador_router
from crud_cliente import router as client_router
from crud_recurso import router as recurso_router
from crud_cooperativa import router as cooperativa_router
from crud_empresa import router as empresa_router

from crud_produtos_cadastrados import router as produto_cooperativa_router
from crud_associado import router as associado_router

app = FastAPI(
    title="AgroLinker API",
    description="API para gerenciamento de produtores, agricultores, parcerias e recursos na Agrolinker.",
    version="1.0.0",
)


# ============================================================
# CORS
# ============================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================================
# ROTA PRINCIPAL
# ============================================================

@app.get("/")
def read_root():
    return {
        "message": "API AgroLinker funcionando!"
    }


# ============================================================
# TESTE DE CONEXÃO COM NEON
# ============================================================

@app.get("/test-neon")
def test_neon():

    try:

        conn = get_neon_connection()
        cursor = conn.cursor()

        cursor.execute("SELECT version();")

        version = cursor.fetchone()

        cursor.close()
        conn.close()

        return {
            "status": "ok",
            "mensagem": "Conectado ao Neon!",
            "database": version[0]
        }

    except Exception as e:

        return {
            "status": "erro",
            "mensagem": str(e)
        }


# ============================================================
# ROUTERS
# ============================================================


app.include_router(
    produtor_router,
    prefix="/produtor",
    tags=["Produtor"]
)

app.include_router(
    funcionario_router,
    prefix="/funcionario",
    tags=["Funcionário"]
)

app.include_router(
    pecuarista_router,
    prefix="/pecuarista",
    tags=["Pecuarista"]
)

app.include_router(
    agricultor_router,
    prefix="/agricultor",
    tags=["Agricultor"]
)

app.include_router(
    parceria_router,
    prefix="/parceria",
    tags=["Parceria"]
)

app.include_router(
    administrador_router,
    prefix="/administrador",
    tags=["Administrador"]
)

app.include_router(
    client_router,
    prefix="/cliente",
    tags=["Cliente"]
)

app.include_router(
    recurso_router,
    prefix="/recurso",
    tags=["Recurso"]
)

app.include_router(
    cooperativa_router,
    prefix="/cooperativa",
    tags=["Cooperativa"]
)

app.include_router(
    empresa_router,
    prefix="/empresa",
    tags=["Empresa"]
)
app.include_router(
    produto_cooperativa_router,
    prefix="/produto-cooperativa",
    tags=["Produtos da Cooperativa"]
)
app.include_router(
    associado_router,
    prefix="/associado",
    tags=["Associado"]
)   