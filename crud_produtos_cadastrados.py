from fastapi import APIRouter, HTTPException
from typing import List

from db import get_connection

from models import (
    ProdutoCooperativaCreate,
    ProdutoCooperativaUpdate
)


router = APIRouter()


UNIDADES_VALIDAS = [
    "kg",
    "litros",
    "unidade"
]


# ============================================================
# LISTAR TODOS OS PRODUTOS
# ============================================================

@router.get("")
async def listar_produtos():

    conn = get_connection()
    cur = conn.cursor()

    try:

        cur.execute("""
            SELECT
                pc.id_produto,
                pc.id_cooperativa,
                c.nome AS cooperativa,
                pc.id_produtor,
                p.nome AS produtor,
                p.tipo,
                pc.nome AS nome_produto,
                pc.qualidade,
                pc.quantidade_vendida,
                pc.unidade

            FROM produto_cooperativa pc

            INNER JOIN cooperativa c
                ON c.id_cooperativa = pc.id_cooperativa

            INNER JOIN produtor p
                ON p.id_produtor = pc.id_produtor

            ORDER BY pc.id_produto;
        """)

        rows = cur.fetchall()

        produtos = []

        for row in rows:

            produtos.append({
                "id_produto": row[0],
                "id_cooperativa": row[1],
                "cooperativa": row[2],
                "id_produtor": row[3],
                "produtor": row[4],
                "tipo_produtor": row[5],
                "nome_produto": row[6],
                "qualidade": row[7],
                "quantidade_vendida": float(row[8]) if row[8] is not None else 0,
                "unidade": row[9]
            })

        return produtos

    except Exception as e:

        raise HTTPException(
            status_code=500,
            detail=f"Erro ao listar produtos: {str(e)}"
        )

    finally:

        cur.close()
        conn.close()


# ============================================================
# BUSCAR PRODUTO POR ID
# ============================================================

@router.get("/{id_produto}")
async def buscar_produto(id_produto: int):

    conn = get_connection()
    cur = conn.cursor()

    try:

        cur.execute("""
            SELECT
                pc.id_produto,
                pc.id_cooperativa,
                c.nome AS cooperativa,
                pc.id_produtor,
                p.nome AS produtor,
                p.tipo,
                pc.nome_produto,
                pc.qualidade,
                pc.quantidade_vendida,
                pc.unidade

            FROM produto_cooperativa pc

            INNER JOIN cooperativa c
                ON c.id_cooperativa = pc.id_cooperativa

            INNER JOIN produtor p
                ON p.id_produtor = pc.id_produtor

            WHERE pc.id_produto = %s;
        """, (id_produto,))

        row = cur.fetchone()

        if not row:

            raise HTTPException(
                status_code=404,
                detail="Produto não encontrado."
            )

        return {
            "id_produto": row[0],
            "id_cooperativa": row[1],
            "cooperativa": row[2],
            "id_produtor": row[3],
            "produtor": row[4],
            "tipo_produtor": row[5],
            "nome_produto": row[6],
            "qualidade": row[7],
            "quantidade_vendida": float(row[8]) if row[8] is not None else 0,
            "unidade": row[9]
        }

    except HTTPException:
        raise

    except Exception as e:

        raise HTTPException(
            status_code=500,
            detail=f"Erro ao buscar produto: {str(e)}"
        )

    finally:

        cur.close()
        conn.close()


# ============================================================
# LISTAR PRODUTOS DE UMA COOPERATIVA
# ============================================================

@router.get("/cooperativa/{id_cooperativa}")
async def listar_produtos_cooperativa(
    id_cooperativa: int
):

    conn = get_connection()
    cur = conn.cursor()

    try:

        # Verifica se a cooperativa existe

        cur.execute("""
            SELECT id_cooperativa
            FROM cooperativa
            WHERE id_cooperativa = %s;
        """, (id_cooperativa,))

        if not cur.fetchone():

            raise HTTPException(
                status_code=404,
                detail="Cooperativa não encontrada."
            )

        cur.execute("""
            SELECT
                pc.id_produto,
                pc.id_cooperativa,
                c.nome AS cooperativa,
                pc.id_produtor,
                p.nome AS produtor,
                p.tipo,
                pc.nome AS nome_produto,
                pc.qualidade,
                pc.quantidade_vendida,
                pc.unidade

            FROM produto_cooperativa pc

            INNER JOIN cooperativa c
                ON c.id_cooperativa = pc.id_cooperativa

            INNER JOIN produtor p
                ON p.id_produtor = pc.id_produtor

            WHERE pc.id_cooperativa = %s

            ORDER BY pc.id_produto;
        """, (id_cooperativa,))

        rows = cur.fetchall()

        produtos = []

        for row in rows:

            produtos.append({
                "id_produto": row[0],
                "id_cooperativa": row[1],
                "cooperativa": row[2],
                "id_produtor": row[3],
                "produtor": row[4],
                "tipo_produtor": row[5],
                "nome_produto": row[6],
                "qualidade": row[7],
                "quantidade_vendida": float(row[8]) if row[8] is not None else 0,
                "unidade": row[9]
            })

        return produtos

    except HTTPException:
        raise

    except Exception as e:

        raise HTTPException(
            status_code=500,
            detail=f"Erro ao listar produtos da cooperativa: {str(e)}"
        )

    finally:

        cur.close()
        conn.close()


# ============================================================
# CRIAR PRODUTO
# ============================================================

@router.post("")
async def criar_produto(
    produto: ProdutoCooperativaCreate
):

    if produto.unidade not in UNIDADES_VALIDAS:

        raise HTTPException(
            status_code=400,
            detail=(
                "Unidade inválida. "
                "Use: kg, litros ou unidade."
            )
        )

    conn = get_connection()
    cur = conn.cursor()

    try:

        # --------------------------------------------
        # Verifica cooperativa
        # --------------------------------------------

        cur.execute("""
            SELECT id_cooperativa
            FROM cooperativa
            WHERE id_cooperativa = %s;
        """, (
            produto.id_cooperativa,
        ))

        if not cur.fetchone():

            raise HTTPException(
                status_code=404,
                detail="Cooperativa não encontrada."
            )

        # --------------------------------------------
        # Verifica produtor
        # --------------------------------------------

        cur.execute("""
            SELECT
                id_produtor,
                nome
            FROM produtor
            WHERE id_produtor = %s;
        """, (
            produto.id_produtor,
        ))

        produtor = cur.fetchone()

        if not produtor:

            raise HTTPException(
                status_code=404,
                detail="Produtor não encontrado."
            )

        # --------------------------------------------
        # Insere produto
        # --------------------------------------------

        cur.execute("""
            INSERT INTO produto_cooperativa (
                id_cooperativa,
                id_produtor,
                nome_produto,
                qualidade,
                quantidade_vendida,
                unidade
            )

            VALUES (
                %s,
                %s,
                %s,
                %s,
                %s,
                %s
            )

            RETURNING id_produto;
        """, (
            produto.id_cooperativa,
            produto.id_produtor,
            produto.nome_produto,
            produto.qualidade,
            float(produto.quantidade_vendida) if produto.quantidade_vendida is not None else 0,
            produto.unidade
        ))

        id_produto = cur.fetchone()[0]

        conn.commit()

        return {
            "msg": "Produto cadastrado com sucesso.",
            "id_produto": id_produto
        }

    except HTTPException:

        conn.rollback()
        raise

    except Exception as e:

        conn.rollback()

        raise HTTPException(
            status_code=400,
            detail=f"Erro ao cadastrar produto: {str(e)}"
        )

    finally:

        cur.close()
        conn.close()


# ============================================================
# ATUALIZAR PRODUTO
# ============================================================

@router.put("/{id_produto}")
async def atualizar_produto(
    id_produto: int,
    produto: ProdutoCooperativaUpdate
):

    conn = get_connection()
    cur = conn.cursor()

    try:

        # --------------------------------------------
        # Verifica produto
        # --------------------------------------------

        cur.execute("""
            SELECT id_produto
            FROM produto_cooperativa
            WHERE id_produto = %s;
        """, (
            id_produto,
        ))

        if not cur.fetchone():

            raise HTTPException(
                status_code=404,
                detail="Produto não encontrado."
            )

        # --------------------------------------------
        # Verifica unidade
        # --------------------------------------------

        if (
            produto.unidade is not None
            and produto.unidade not in UNIDADES_VALIDAS
        ):

            raise HTTPException(
                status_code=400,
                detail=(
                    "Unidade inválida. "
                    "Use: kg, litros ou unidade."
                )
            )

        # --------------------------------------------
        # Verifica produtor
        # --------------------------------------------

        if produto.id_produtor is not None:

            cur.execute("""
                SELECT id_produtor
                FROM produtor
                WHERE id_produtor = %s;
            """, (
                produto.id_produtor,
            ))

            if not cur.fetchone():

                raise HTTPException(
                    status_code=404,
                    detail="Produtor não encontrado."
                )

        # --------------------------------------------
        # Atualiza
        # --------------------------------------------

        cur.execute("""
            UPDATE produto_cooperativa

            SET
                id_produtor =
                    COALESCE(%s, id_produtor),

                nome_produto =
                    COALESCE(%s, nome_produto),

                qualidade =
                    COALESCE(%s, qualidade),

                quantidade_vendida =
                    COALESCE(
                        %s,
                        quantidade_vendida
                    ),

                unidade =
                    COALESCE(%s, unidade)

            WHERE id_produto = %s;
        """, (
            produto.id_produtor,
            produto.nome_produto,
            produto.qualidade,
            float(produto.quantidade_vendida) if produto.quantidade_vendida is not None else 0,
            produto.unidade,
            id_produto
        ))

        conn.commit()

        return {
            "msg": "Produto atualizado com sucesso."
        }

    except HTTPException:

        conn.rollback()
        raise

    except Exception as e:

        conn.rollback()

        raise HTTPException(
            status_code=400,
            detail=f"Erro ao atualizar produto: {str(e)}"
        )

    finally:

        cur.close()
        conn.close()


# ============================================================
# EXCLUIR PRODUTO
# ============================================================

@router.delete("/{id_produto}")
async def excluir_produto(
    id_produto: int
):

    conn = get_connection()
    cur = conn.cursor()

    try:

        cur.execute("""
            DELETE FROM produto_cooperativa

            WHERE id_produto = %s

            RETURNING id_produto;
        """, (
            id_produto,
        ))

        resultado = cur.fetchone()

        if not resultado:

            raise HTTPException(
                status_code=404,
                detail="Produto não encontrado."
            )

        conn.commit()

        return {
            "msg": "Produto excluído com sucesso."
        }

    except HTTPException:

        conn.rollback()
        raise

    except Exception as e:

        conn.rollback()

        raise HTTPException(
            status_code=500,
            detail=f"Erro ao excluir produto: {str(e)}"
        )

    finally:

        cur.close()
        conn.close()