
from fastapi import APIRouter, HTTPException
from typing import List

from db import get_connection
from models import Funcionario, FuncionarioUpdate


router = APIRouter()


# ============================================================
# CRIAR FUNCIONÁRIO
# ============================================================

@router.post("")
async def criar_funcionario(func: Funcionario):

    conn = get_connection()
    cur = conn.cursor()

    try:

        # ----------------------------------------------------
        # VERIFICA SE O ASSOCIADO EXISTE
        # ----------------------------------------------------

        cur.execute(
            """
            SELECT id_associado
            FROM associado
            WHERE id_associado = %s
            """,
            (func.id_associado,)
        )

        associado = cur.fetchone()

        if not associado:
            raise HTTPException(
                status_code=400,
                detail="Associado não encontrado."
            )

        # ----------------------------------------------------
        # VERIFICA SE O ASSOCIADO JÁ É FUNCIONÁRIO
        # ----------------------------------------------------

        cur.execute(
            """
            SELECT id_func
            FROM funcionario
            WHERE id_associado = %s
            """,
            (func.id_associado,)
        )

        if cur.fetchone():
            raise HTTPException(
                status_code=400,
                detail="Este associado já está cadastrado como funcionário."
            )

        # ----------------------------------------------------
        # CADASTRA FUNCIONÁRIO
        # ----------------------------------------------------

        cur.execute(
            """
            INSERT INTO funcionario
                (id_func, id_associado, endereco, setor)
            VALUES
                (%s, %s, %s, %s)
            RETURNING id_func
            """,
            (
                func.id_func,
                func.id_associado,
                func.endereco,
                func.setor
            )
        )

        id_func = cur.fetchone()[0]

        conn.commit()

        return {
            "msg": "Funcionário criado com sucesso",
            "id_func": id_func
        }

    except HTTPException:
        conn.rollback()
        raise

    except Exception as e:
        conn.rollback()

        raise HTTPException(
            status_code=400,
            detail=f"Erro ao criar funcionário: {e}"
        )

    finally:
        cur.close()
        conn.close()


# ============================================================
# LISTAR FUNCIONÁRIOS
# ============================================================

@router.get("")
async def listar_funcionarios():

    conn = get_connection()
    cur = conn.cursor()

    try:

        cur.execute(
            """
            SELECT
                f.id_func,
                f.id_associado,
                p.nome,
                f.endereco,
                f.setor,
                c.id_cooperativa,
                c.nome AS cooperativa,

                CASE
                    WHEN ad.id_admin IS NOT NULL
                    THEN true
                    ELSE false
                END AS administrador

            FROM funcionario f

            INNER JOIN associado a
                ON a.id_associado = f.id_associado

            INNER JOIN produtor p
                ON p.id_produtor = a.id_produtor

            INNER JOIN cooperativa c
                ON c.id_cooperativa = a.id_cooperativa

            LEFT JOIN administrador ad
                ON ad.id_associado = a.id_associado

            ORDER BY f.id_func
            """
        )

        funcionarios = cur.fetchall()

        return [
            {
                "id_func": f[0],
                "id_associado": f[1],
                "nome": f[2],
                "endereco": f[3],
                "setor": f[4],
                "id_cooperativa": f[5],
                "cooperativa": f[6],
                "administrador": f[7]
            }
            for f in funcionarios
        ]

    except Exception as e:

        raise HTTPException(
            status_code=500,
            detail=f"Erro ao listar funcionários: {e}"
        )

    finally:
        cur.close()
        conn.close()


# ============================================================
# OBTER FUNCIONÁRIO
# ============================================================

@router.get("/{funcionario_id}")
async def obter_funcionario(funcionario_id: int):

    conn = get_connection()
    cur = conn.cursor()

    try:

        cur.execute(
            """
            SELECT
                f.id_func,
                f.id_associado,
                p.nome,
                f.endereco,
                f.setor,
                c.id_cooperativa,
                c.nome AS cooperativa,

                CASE
                    WHEN ad.id_admin IS NOT NULL
                    THEN true
                    ELSE false
                END AS administrador

            FROM funcionario f

            INNER JOIN associado a
                ON a.id_associado = f.id_associado

            INNER JOIN produtor p
                ON p.id_produtor = a.id_produtor

            INNER JOIN cooperativa c
                ON c.id_cooperativa = a.id_cooperativa

            LEFT JOIN administrador ad
                ON ad.id_associado = a.id_associado

            WHERE f.id_func = %s
            """,
            (funcionario_id,)
        )

        funcionario = cur.fetchone()

        if not funcionario:
            raise HTTPException(
                status_code=404,
                detail="Funcionário não encontrado."
            )

        return {
            "id_func": funcionario[0],
            "id_associado": funcionario[1],
            "nome": funcionario[2],
            "endereco": funcionario[3],
            "setor": funcionario[4],
            "id_cooperativa": funcionario[5],
            "cooperativa": funcionario[6],
            "administrador": funcionario[7]
        }

    finally:
        cur.close()
        conn.close()


# ============================================================
# ATUALIZAR FUNCIONÁRIO
# ============================================================

@router.patch("/{funcionario_id}")
async def atualizar_funcionario(
    funcionario_id: int,
    func: FuncionarioUpdate
):

    conn = get_connection()
    cur = conn.cursor()

    try:

        # ----------------------------------------------------
        # VERIFICA FUNCIONÁRIO
        # ----------------------------------------------------

        cur.execute(
            """
            SELECT id_func
            FROM funcionario
            WHERE id_func = %s
            """,
            (funcionario_id,)
        )

        if not cur.fetchone():
            raise HTTPException(
                status_code=404,
                detail="Funcionário não encontrado."
            )

        campos = []
        valores = []

        # ----------------------------------------------------
        # ASSOCIADO
        # ----------------------------------------------------

        if func.id_associado is not None:

            cur.execute(
                """
                SELECT id_associado
                FROM associado
                WHERE id_associado = %s
                """,
                (func.id_associado,)
            )

            if not cur.fetchone():
                raise HTTPException(
                    status_code=400,
                    detail="Associado não encontrado."
                )

            campos.append("id_associado = %s")
            valores.append(func.id_associado)

        # ----------------------------------------------------
        # ENDEREÇO
        # ----------------------------------------------------

        if func.endereco is not None:

            campos.append("endereco = %s")
            valores.append(func.endereco)

        # ----------------------------------------------------
        # SETOR
        # ----------------------------------------------------

        if func.setor is not None:

            campos.append("setor = %s")
            valores.append(func.setor)

        if not campos:

            raise HTTPException(
                status_code=400,
                detail="Nenhum campo fornecido para atualização."
            )

        valores.append(funcionario_id)

        query = f"""
            UPDATE funcionario
            SET {', '.join(campos)}
            WHERE id_func = %s
        """

        cur.execute(query, valores)

        conn.commit()

        return await obter_funcionario(funcionario_id)

    except HTTPException:
        conn.rollback()
        raise

    except Exception as e:

        conn.rollback()

        raise HTTPException(
            status_code=400,
            detail=f"Erro ao atualizar funcionário: {e}"
        )

    finally:
        cur.close()
        conn.close()


# ============================================================
# DELETAR FUNCIONÁRIO
# ============================================================

@router.delete("/{funcionario_id}")
async def deletar_funcionario(funcionario_id: int):

    conn = get_connection()
    cur = conn.cursor()

    try:

        cur.execute(
            """
            DELETE FROM funcionario
            WHERE id_func = %s
            RETURNING id_func
            """,
            (funcionario_id,)
        )

        funcionario = cur.fetchone()

        if not funcionario:
            raise HTTPException(
                status_code=404,
                detail="Funcionário não encontrado."
            )

        conn.commit()

        return {
            "msg": "Funcionário deletado com sucesso"
        }

    except HTTPException:
        conn.rollback()
        raise

    except Exception as e:

        conn.rollback()

        raise HTTPException(
            status_code=400,
            detail=f"Erro ao deletar funcionário: {e}"
        )

    finally:
        cur.close()
        conn.close()

