
import os
import time
import base64

import httpx
from fastapi import APIRouter, HTTPException, Body, Query
from dotenv import load_dotenv

load_dotenv()

router = APIRouter(
    prefix="/bovtrace",
    tags=["BovTrace - Embrapa"],
)

BASE_URL = "https://api.cnptia.embrapa.br/bovtrace/v1"
TOKEN_URL = "https://api.cnptia.embrapa.br/token"
TIMEOUT = 30.0

CLIENT_ID = os.getenv("BOVTRACE_CLIENT_ID")
CLIENT_SECRET = os.getenv("BOVTRACE_CLIENT_SECRET")

_token = {
    "value": None,
    "expira": 0,
}


# ============================================================
# AUTENTICAÇÃO OAUTH2
# ============================================================

async def get_token():
    """Obtém e mantém em cache o token OAuth2."""

    if _token["value"] and time.time() < _token["expira"] - 60:
        return _token["value"]

    if not CLIENT_ID or not CLIENT_SECRET:
        raise HTTPException(
            status_code=503,
            detail="Credenciais BovTrace não configuradas no ambiente."
        )

    credenciais = f"{CLIENT_ID}:{CLIENT_SECRET}"
    basic = base64.b64encode(
        credenciais.encode("utf-8")
    ).decode("utf-8")

    try:
        async with httpx.AsyncClient(timeout=TIMEOUT) as client:
            resposta = await client.post(
                TOKEN_URL,
                headers={
                    "Authorization": f"Basic {basic}",
                    "Accept": "application/json",
                },
                data={
                    "grant_type": "client_credentials"
                },
            )

        if resposta.status_code != 200:
            raise HTTPException(
                status_code=502,
                detail={
                    "mensagem": "Falha na autenticação BovTrace.",
                    "status_embrapa": resposta.status_code,
                    "resposta": resposta.text[:1000],
                },
            )

        dados = resposta.json()
        access_token = dados.get("access_token")

        if not access_token:
            raise HTTPException(
                status_code=502,
                detail="A autenticação não retornou access_token."
            )

        _token["value"] = access_token
        _token["expira"] = (
            time.time() + int(dados.get("expires_in", 3600))
        )

        return access_token

    except HTTPException:
        raise

    except httpx.TimeoutException:
        raise HTTPException(
            status_code=504,
            detail="Tempo limite excedido na autenticação BovTrace."
        )

    except httpx.RequestError:
        raise HTTPException(
            status_code=502,
            detail="Não foi possível conectar ao serviço de autenticação."
        )


# ============================================================
# FUNÇÃO GENÉRICA PARA CONSULTAS GET
# ============================================================

async def consultar_embrapa(caminho: str, params: dict = None):
    token = await get_token()

    try:
        async with httpx.AsyncClient(timeout=TIMEOUT) as client:
            resposta = await client.get(
                f"{BASE_URL}/{caminho.lstrip('/')}",
                headers={
                    "Authorization": f"Bearer {token}",
                    "Accept": "application/json",
                },
                params=params,
            )

        if resposta.status_code == 204:
            return {"dados": []}

        if resposta.status_code >= 400:
            raise HTTPException(
                status_code=502,
                detail={
                    "mensagem": "Erro na consulta à API Embrapa BovTrace.",
                    "status_embrapa": resposta.status_code,
                    "resposta": resposta.text[:1000],
                },
            )

        try:
            return resposta.json()
        except ValueError:
            return {"resposta": resposta.text}

    except HTTPException:
        raise

    except httpx.TimeoutException:
        raise HTTPException(
            status_code=504,
            detail="Tempo limite excedido ao consultar a BovTrace."
        )

    except httpx.RequestError:
        raise HTTPException(
            status_code=502,
            detail="Não foi possível conectar à API BovTrace."
        )


# ============================================================
# TESTE DE CONEXÃO
# ============================================================

@router.get("/health")
async def health():
    return {
        "mensagem": "Backend BovTrace disponível.",
        "autenticacao_configurada": bool(CLIENT_ID and CLIENT_SECRET),
    }


# ============================================================
# LISTAR PROTOCOLOS
# ============================================================

@router.get("/protocolos")
async def listar_protocolos():
    return await consultar_embrapa("protocolos")


# ============================================================
# LISTAR RAÇAS
# ============================================================

@router.get("/racas")
async def listar_racas():
    return await consultar_embrapa("racas")


# ============================================================
# CONSULTAR TRANSAÇÕES / MOVIMENTAÇÕES
# ============================================================

@router.get("/transacoes")
async def listar_transacoes(
    pagina: int = Query(default=1, ge=1),
    data_inicio: str = Query(default=None),
    data_fim: str = Query(default=None),
):
    params = {
        "pagina": pagina
    }

    if data_inicio:
        params["data_inicio"] = data_inicio

    if data_fim:
        params["data_fim"] = data_fim

    return await consultar_embrapa(
        "transacoes",
        params=params
    )


# ============================================================
# REGISTRAR TRANSAÇÃO
# ============================================================

@router.post("/transacoes")
async def cadastrar_transacao(dados: dict = Body(...)):
    token = await get_token()

    try:
        async with httpx.AsyncClient(timeout=TIMEOUT) as client:
            resposta = await client.post(
                f"{BASE_URL}/transacoes",
                headers={
                    "Authorization": f"Bearer {token}",
                    "Accept": "application/json",
                    "Content-Type": "application/json",
                },
                json=dados,
            )

        if resposta.status_code >= 400:
            raise HTTPException(
                status_code=502,
                detail={
                    "mensagem": "A Embrapa não aceitou a transação.",
                    "status_embrapa": resposta.status_code,
                    "resposta": resposta.text[:1000],
                },
            )

        if resposta.status_code == 204:
            return {
                "mensagem": "Transação registrada com sucesso."
            }

        try:
            return resposta.json()
        except ValueError:
            return {"resposta": resposta.text}

    except HTTPException:
        raise

    except httpx.TimeoutException:
        raise HTTPException(
            status_code=504,
            detail="Tempo limite ao registrar a transação BovTrace."
        )

    except httpx.RequestError:
        raise HTTPException(
            status_code=502,
            detail="Não foi possível conectar à API BovTrace."
        )


# ============================================================
# CONSULTAR TRANSAÇÃO PELO TOKEN
# ============================================================

@router.get("/transacoes/{token_transacao}")
async def obter_transacao(token_transacao: str):
    return await consultar_embrapa(
        f"transacoes/{token_transacao}"
    )


# ============================================================
# CONSULTAR TRÂNSITO PELO CÓDIGO
# ============================================================

@router.get("/transitos/{codigo}")
async def obter_transito(codigo: str):
    return await consultar_embrapa(
        f"transitos/{codigo}"
    )
