import time
import xml.etree.ElementTree as ET
from datetime import datetime, timezone
from email.utils import parsedate_to_datetime

import httpx
from fastapi import APIRouter, HTTPException

from db import get_connection

router = APIRouter()


# ============================================================
# AUXILIARES: cada consulta falha sem derrubar as outras
# ============================================================

def _rodar(conn, sqls):
    """Tenta cada SQL da lista e devolve as linhas da primeira que funcionar."""
    if isinstance(sqls, str):
        sqls = [sqls]
    for sql in sqls:
        try:
            with conn.cursor() as cur:
                cur.execute(sql)
                return cur.fetchall()
        except Exception:
            conn.rollback()
    return None


def _numero(conn, sqls):
    rows = _rodar(conn, sqls)
    if not rows:
        return None
    valor = rows[0][0]
    return float(valor) if hasattr(valor, "as_tuple") else valor


def _linhas(conn, sqls, campos):
    rows = _rodar(conn, sqls)
    if rows is None:
        return None
    return [
        {c: (float(v) if hasattr(v, "as_tuple") else v) for c, v in zip(campos, r)}
        for r in rows
    ]


# ============================================================
# MAPA
# ============================================================

@router.get("/cooperativas-mapa")
async def cooperativas_mapa():
    conn = get_connection()
    try:
        rows = _rodar(
            conn,
            """
            SELECT id_cooperativa, nome, endereco, bairro, cidade, estado
            FROM cooperativa
            WHERE cidade IS NOT NULL
            ORDER BY nome
            """,
        )
        if rows is None:
            raise HTTPException(status_code=500, detail="Erro ao listar cooperativas.")
        return [
            {"id": r[0], "nome": r[1], "endereco": r[2],
             "bairro": r[3], "cidade": r[4], "estado": r[5]}
            for r in rows
        ]
    finally:
        conn.close()


# ============================================================
# RESUMO COM DADOS REAIS
# ============================================================

@router.get("/resumo")
async def resumo():
    conn = get_connection()
    try:
        totais = {
            "cooperativas": _numero(conn, "SELECT COUNT(*) FROM cooperativa"),
            "associados": _numero(
                conn, "SELECT COALESCE(SUM(quantidade_associados),0) FROM cooperativa"
            ),
            "produtores": _numero(conn, "SELECT COUNT(*) FROM produtor"),
            "agricultores": _numero(
                conn, "SELECT COUNT(*) FROM produtor WHERE tipo = 'Agricultor'"
            ),
            "pecuaristas": _numero(
                conn, "SELECT COUNT(*) FROM produtor WHERE tipo = 'Pecuarista'"
            ),
            "empresas": _numero(conn, "SELECT COUNT(*) FROM empresa"),
            "parcerias": _numero(conn, "SELECT COUNT(*) FROM parceria"),
            "recursos": _numero(conn, "SELECT COUNT(*) FROM recurso"),
            "produtos": _numero(conn, "SELECT COUNT(*) FROM produto_cooperativa"),
            "clientes": _numero(conn, "SELECT COUNT(*) FROM cliente"),
            "funcionarios": _numero(
                conn,
                ["SELECT COUNT(*) FROM funcionario", "SELECT COUNT(*) FROM funcionarios"],
            ),
        }

        # Pessoas por cooperativa (só contagens, sem dados pessoais)
        pessoas = _linhas(
            conn,
            [
                """
                SELECT c.id_cooperativa, c.nome, c.cidade,
                       COALESCE(c.quantidade_associados, 0),
                       (SELECT COUNT(DISTINCT pc.id_produtor)
                          FROM produto_cooperativa pc
                         WHERE pc.id_cooperativa = c.id_cooperativa),
                       (SELECT COUNT(*) FROM recurso r
                         WHERE r.id_cooperativa = c.id_cooperativa)
                FROM cooperativa c
                ORDER BY 4 DESC, c.nome
                """,
                """
                SELECT c.id_cooperativa, c.nome, c.cidade,
                       COALESCE(c.quantidade_associados, 0),
                       (SELECT COUNT(DISTINCT pc.id_produtor)
                          FROM produto_cooperativa pc
                         WHERE pc.id_cooperativa = c.id_cooperativa),
                       0
                FROM cooperativa c
                ORDER BY 4 DESC, c.nome
                """,
            ],
            ["id", "nome", "cidade", "associados", "produtores", "recursos"],
        )

        # Recursos
        recursos_status = _linhas(
            conn,
            """
            SELECT COALESCE(status, 'Sem status'), COUNT(*), COALESCE(SUM(valor), 0)
            FROM recurso GROUP BY 1 ORDER BY 2 DESC
            """,
            ["status", "quantidade", "valor"],
        )
        recursos_tipo = _linhas(
            conn,
            """
            SELECT COALESCE(tipo_recurso, 'Outro'), COUNT(*)
            FROM recurso GROUP BY 1 ORDER BY 2 DESC
            """,
            ["tipo", "quantidade"],
        )

        # Produtos
        produtos = _linhas(
            conn,
            [
                """
                SELECT pc.nome, pc.unidade, COALESCE(SUM(pc.quantidade_vendida), 0),
                       ROUND(AVG(pc.qualidade)::numeric, 1), COUNT(*)
                FROM produto_cooperativa pc
                GROUP BY pc.nome, pc.unidade ORDER BY 3 DESC LIMIT 10
                """,
                """
                SELECT pc.nome_produto, pc.unidade, COALESCE(SUM(pc.quantidade_vendida), 0),
                       ROUND(AVG(pc.qualidade)::numeric, 1), COUNT(*)
                FROM produto_cooperativa pc
                GROUP BY pc.nome_produto, pc.unidade ORDER BY 3 DESC LIMIT 10
                """,
            ],
            ["nome", "unidade", "quantidade_vendida", "qualidade_media", "registros"],
        )

        # Empresas
        empresas = _linhas(
            conn,
            """
            SELECT e.id_empresa, e.nome_fantasia, e.tempo_atuacao,
                   COUNT(p.id_cooperativa)
            FROM empresa e
            LEFT JOIN parceria p ON p.id_empresa = e.id_empresa
            GROUP BY e.id_empresa, e.nome_fantasia, e.tempo_atuacao
            ORDER BY 4 DESC, e.nome_fantasia LIMIT 10
            """,
            ["id", "nome", "tempo_atuacao", "parcerias"],
        )
        empresas_resumo = {
            "com_parceria": _numero(
                conn, "SELECT COUNT(DISTINCT id_empresa) FROM parceria"
            ),
            "tempo_medio": _numero(
                conn, "SELECT ROUND(AVG(tempo_atuacao)::numeric, 1) FROM empresa"
            ),
        }

        secoes = {
            "pessoas_por_cooperativa": pessoas,
            "recursos_status": recursos_status,
            "recursos_tipo": recursos_tipo,
            "produtos": produtos,
            "empresas": empresas,
        }
        avisos = [k for k, v in secoes.items() if v is None]
        avisos += [f"total:{k}" for k, v in totais.items() if v is None]

        return {
            "gerado_em": datetime.now(timezone.utc).isoformat(),
            "totais": totais,
            "pessoas_por_cooperativa": pessoas or [],
            "recursos_status": recursos_status or [],
            "recursos_tipo": recursos_tipo or [],
            "produtos": produtos or [],
            "empresas": empresas or [],
            "empresas_resumo": empresas_resumo,
            "avisos": avisos,
        }
    finally:
        conn.close()


# ============================================================
# NOTÍCIAS REAIS (Google News RSS, com cache de 15 minutos)
# ============================================================

TEMAS = {
    "agro": "agricultura familiar Nordeste",
    "cooperativismo": "cooperativismo agrícola",
    "mercado": "preços agricultura Brasil safra",
    "clima": "seca chuvas Ceará agricultura",
}
TTL = 900
_cache = {}


def _data(texto):
    try:
        return parsedate_to_datetime(texto)
    except Exception:
        return datetime.fromtimestamp(0, tz=timezone.utc)


@router.get("/noticias")
async def noticias(tema: str = "agro", limite: int = 8):
    if tema not in TEMAS:
        raise HTTPException(status_code=400, detail="Tema inválido.")
    limite = max(1, min(limite, 15))

    agora = time.time()
    guardado = _cache.get(tema)
    if guardado and agora - guardado["t"] < TTL:
        return guardado["itens"][:limite]

    try:
        async with httpx.AsyncClient(timeout=10, follow_redirects=True) as http:
            resp = await http.get(
                "https://news.google.com/rss/search",
                params={
                    "q": f"{TEMAS[tema]} when:30d",
                    "hl": "pt-BR",
                    "gl": "BR",
                    "ceid": "BR:pt-419",
                },
                headers={"User-Agent": "Mozilla/5.0"},
            )
            resp.raise_for_status()

        itens = []
        for item in ET.fromstring(resp.content).iter("item"):
            titulo = (item.findtext("title") or "").strip()
            fonte_el = item.find("source")
            fonte = (fonte_el.text if fonte_el is not None else "") or ""
            if fonte and titulo.endswith(f" - {fonte}"):
                titulo = titulo[: -len(fonte) - 3]
            publicado = _data(item.findtext("pubDate") or "")
            itens.append(
                {
                    "titulo": titulo,
                    "link": (item.findtext("link") or "").strip(),
                    "fonte": fonte,
                    "publicado_em": publicado.isoformat(),
                    "_ts": publicado.timestamp(),
                }
            )

        itens.sort(key=lambda i: i["_ts"], reverse=True)
        for i in itens:
            i.pop("_ts")

        _cache[tema] = {"t": agora, "itens": itens}
        return itens[:limite]

    except Exception:
        if guardado:  # se a fonte falhar, devolve a última versão guardada
            return guardado["itens"][:limite]
        raise HTTPException(status_code=502, detail="Não foi possível obter as notícias.")