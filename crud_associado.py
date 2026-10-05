from fastapi import APIRouter, HTTPException
from typing import List, Optional
from pydantic import BaseModel
from datetime import date

from db import get_connection


router = APIRouter()


# ============================================================
# MODELS
# ============================================================

class AssociadoCreate(BaseModel):
    id_produtor: int
    id_cooperativa: int
    data_associacao: Optional[date] = None
    status: Optional[str] = "Ativo"


class AssociadoUpdate(BaseModel):
    id_produtor: Optional[int] = None
    id_cooperativa: Optional[int] = None
    data_associacao: Optional[date] = None
    status: Optional[str] = None


# ============================================================
# CRIAR ASSOCIADO
# ============================================================

@router.post("")
async def criar_associado(associado: AssociadoCreate):

    conn = get_connection()
    cur = conn.cursor()

    try:

        # ----------------------------------------------------
        # VERIFICAR PRODUTOR
        # ----------------------------------------------------

        cur.execute(
            """
            SELECT id_produtor, nome, tipo
            FROM produtor
            WHERE id_produtor = %s
            """,
            (associado.id_produtor,)
        )

        produtor = cur.fetchone()

        if not produtor:
            raise HTTPException(
                status_code=404,
                detail="Produtor não encontrado."
            )

        # ----------------------------------------------------
        # VERIFICAR COOPERATIVA
        # ----------------------------------------------------

        cur.execute(
            """
            SELECT id_cooperativa, nome
            FROM cooperativa
            WHERE id_cooperativa = %s
            """,
            (associado.id_cooperativa,)
        )

        cooperativa = cur.fetchone()

        if not cooperativa:
            raise HTTPException(
                status_code=404,
                detail="Cooperativa não encontrada."
            )

        # ----------------------------------------------------
        # VERIFICAR SE JÁ EXISTE
        # ----------------------------------------------------

        cur.execute(
            """
            SELECT id_associado
            FROM associado
            WHERE id_produtor = %s
              AND id_cooperativa = %s
            """,
            (
                associado.id_produtor,
                associado.id_cooperativa
            )
        )

        existente = cur.fetchone()

        if existente:
            raise HTTPException(
                status_code=400,
                detail="Este produtor já está associado a esta cooperativa."
            )

        # ----------------------------------------------------
        # INSERIR
        # ----------------------------------------------------

        cur.execute(
            """
            INSERT INTO associado
                (
                    id_produtor,
                    id_cooperativa,
                    data_associacao,
                    status
                )
            VALUES
                (%s, %s, COALESCE(%s, CURRENT_DATE), %s)
            RETURNING id_associado
            """,
            (
                associado.id_produtor,
                associado.id_cooperativa,
                associado.data_associacao,
                associado.status
            )
        )

        id_associado = cur.fetchone()[0]

        conn.commit()

        return {
            "msg": "Associado criado com sucesso.",
            "id_associado": id_associado
        }

    except HTTPException:
        conn.rollback()
        raise

    except Exception as e:
        conn.rollback()

        raise HTTPException(
            status_code=400,
            detail=f"Erro ao criar associado: {e}"
        )

    finally:
        cur.close()
        conn.close()


# ============================================================
# LISTAR ASSOCIADOS
# ============================================================

@router.get("")
async def listar_associados():

    conn = get_connection()
    cur = conn.cursor()

    try:

        cur.execute(
            """
            SELECT
                a.id_associado,
                a.id_produtor,
                p.nome,
                p.tipo,
                a.id_cooperativa,
                c.nome AS cooperativa,
                a.data_associacao,
                a.status
            FROM associado a

            INNER JOIN produtor p
                ON p.id_produtor = a.id_produtor

            INNER JOIN cooperativa c
                ON c.id_cooperativa = a.id_cooperativa

            ORDER BY a.id_associado
            """
        )

        associados = cur.fetchall()

        return [
            {
                "id_associado": a[0],
                "id_produtor": a[1],
                "nome": a[2],
                "tipo": a[3],
                "id_cooperativa": a[4],
                "cooperativa": a[5],
                "data_associacao": a[6],
                "status": a[7]
            }
            for a in associados
        ]

    except Exception as e:

        raise HTTPException(
            status_code=500,
            detail=f"Erro ao listar associados: {e}"
        )

    finally:
        cur.close()
        conn.close()


# ============================================================
# BUSCAR ASSOCIADO
# ============================================================

@router.get("/{id_associado}")
async def obter_associado(id_associado: int):

    conn = get_connection()
    cur = conn.cursor()

    try:

        cur.execute(
            """
            SELECT
                a.id_associado,
                a.id_produtor,
                p.nome,
                p.tipo,
                a.id_cooperativa,
                c.nome AS cooperativa,
                a.data_associacao,
                a.status
            FROM associado a

            INNER JOIN produtor p
                ON p.id_produtor = a.id_produtor

            INNER JOIN cooperativa c
                ON c.id_cooperativa = a.id_cooperativa

            WHERE a.id_associado = %s
            """,
            (id_associado,)
        )

        associado = cur.fetchone()

        if not associado:
            raise HTTPException(
                status_code=404,
                detail="Associado não encontrado."
            )

        return {
            "id_associado": associado[0],
            "id_produtor": associado[1],
            "nome": associado[2],
            "tipo": associado[3],
            "id_cooperativa": associado[4],
            "cooperativa": associado[5],
            "data_associacao": associado[6],
            "status": associado[7]
        }

    finally:
        cur.close()
        conn.close()


# ============================================================
# ATUALIZAR ASSOCIADO
# ============================================================

@router.patch("/{id_associado}")
async def atualizar_associado(
    id_associado: int,
    associado: AssociadoUpdate
):

    conn = get_connection()
    cur = conn.cursor()

    try:

        cur.execute(
            """
            SELECT id_associado
            FROM associado
            WHERE id_associado = %s
            """,
            (id_associado,)
        )

        if not cur.fetchone():

            raise HTTPException(
                status_code=404,
                detail="Associado não encontrado."
            )

        campos = []
        valores = []

        if associado.id_produtor is not None:

            campos.append("id_produtor = %s")
            valores.append(associado.id_produtor)

        if associado.id_cooperativa is not None:

            campos.append("id_cooperativa = %s")
            valores.append(associado.id_cooperativa)

        if associado.data_associacao is not None:

            campos.append("data_associacao = %s")
            valores.append(associado.data_associacao)

        if associado.status is not None:

            campos.append("status = %s")
            valores.append(associado.status)

        if not campos:

            raise HTTPException(
                status_code=400,
                detail="Nenhum campo fornecido para atualização."
            )

        valores.append(id_associado)

        query = f"""
            UPDATE associado
            SET {', '.join(campos)}
            WHERE id_associado = %s
        """

        cur.execute(query, valores)

        conn.commit()

        return await obter_associado(id_associado)

    except HTTPException:
        conn.rollback()
        raise

    except Exception as e:

        conn.rollback()

        raise HTTPException(
            status_code=400,
            detail=f"Erro ao atualizar associado: {e}"
        )

    finally:
        cur.close()
        conn.close()


# ============================================================
# EXCLUIR ASSOCIADO
# ============================================================

@router.delete("/{id_associado}")
async def deletar_associado(id_associado: int):

    conn = get_connection()
    cur = conn.cursor()

    try:

        cur.execute(
            """
            DELETE FROM associado
            WHERE id_associado = %s
            RETURNING id_associado
            """,
            (id_associado,)
        )

        associado = cur.fetchone()

        if not associado:

            raise HTTPException(
                status_code=404,
                detail="Associado não encontrado."
            )

        conn.commit()

        return {
            "msg": "Associado excluído com sucesso."
        }

    except HTTPException:
        conn.rollback()
        raise

    except Exception as e:

        conn.rollback()

        raise HTTPException(
            status_code=400,
            detail=f"Erro ao excluir associado: {e}"
        )

    finally:
        cur.close()
        conn.close()