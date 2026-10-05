from fastapi import APIRouter, HTTPException
from typing import List

from db import get_connection

from models import (
    Recurso,
    RecursoUpdate
)

from datetime import datetime


router = APIRouter()


# ============================================================
# VALIDADORES
# ============================================================

TIPOS_VALIDOS = [
    "Ferramenta",
    "Produto"
]

UNIDADES_VALIDAS = [
    "unidade",
    "kg",
    "litro",
    "saca",
    "tonelada"
]

STATUS_VALIDOS = [
    "Disponível",
    "Reservado",
    "Vendido"
]


# ============================================================
# CRIAR RECURSO
# ============================================================

@router.post("/Recurso", response_model=Recurso)
async def criar_recurso(rec: Recurso):

    if rec.tipo_recurso not in TIPOS_VALIDOS:
        raise HTTPException(
            status_code=400,
            detail="Tipo de recurso inválido"
        )

    if rec.unidade not in UNIDADES_VALIDAS:
        raise HTTPException(
            status_code=400,
            detail="Unidade inválida"
        )

    conn = get_connection()
    cur = conn.cursor()

    try:

        # ----------------------------------------------------
        # Verificar produtor
        # ----------------------------------------------------

        cur.execute(
            """
            SELECT id_produtor
            FROM produtor
            WHERE id_produtor = %s
            """,
            (rec.id_produtor,)
        )

        if not cur.fetchone():
            raise HTTPException(
                status_code=404,
                detail="Produtor não encontrado"
            )

        # ----------------------------------------------------
        # Verificar cooperativa
        # ----------------------------------------------------

        if rec.id_cooperativa is not None:

            cur.execute(
                """
                SELECT id_cooperativa
                FROM cooperativa
                WHERE id_cooperativa = %s
                """,
                (rec.id_cooperativa,)
            )

            if not cur.fetchone():
                raise HTTPException(
                    status_code=404,
                    detail="Cooperativa não encontrada"
                )

        # ----------------------------------------------------
        # Inserir
        # ----------------------------------------------------

        cur.execute(
            """
            INSERT INTO recurso (
                tipo_recurso,
                categoria,
                nome,
                descricao,
                id_produtor,
                id_cooperativa,
                quantidade,
                unidade,
                valor,
                status,
                cidade,
                estado,
                endereco,
                ano,
                data_producao,
                horario_producao,
                qualidade
            )
            VALUES (
                %s, %s, %s, %s, %s, %s, %s,
                %s, %s, %s, %s, %s, %s, %s,
                %s, %s, %s
            )
            RETURNING id_recurso
            """,
            (
                rec.tipo_recurso,
                rec.categoria,
                rec.nome,
                rec.descricao,
                rec.id_produtor,
                rec.id_cooperativa,
                rec.quantidade,
                rec.unidade,
                rec.valor,
                rec.status,
                rec.cidade,
                rec.estado,
                rec.endereco,
                rec.ano,
                rec.data_producao,
                rec.horario_producao,
                rec.qualidade
            )
        )

        id_recurso = cur.fetchone()[0]

        conn.commit()

        cur.execute(
            """
            SELECT
                id_recurso,
                tipo_recurso,
                categoria,
                nome,
                descricao,
                id_produtor,
                id_cooperativa,
                quantidade,
                unidade,
                valor,
                status,
                cidade,
                estado,
                endereco,
                ano,
                data_producao,
                horario_producao,
                qualidade,
                data_venda
            FROM recurso
            WHERE id_recurso = %s
            """,
            (id_recurso,)
        )

        r = cur.fetchone()

        return Recurso(
            id_recurso=r[0],
            tipo_recurso=r[1],
            categoria=r[2],
            nome=r[3],
            descricao=r[4],
            id_produtor=r[5],
            id_cooperativa=r[6],
            quantidade=float(r[7]),
            unidade=r[8],
            valor=float(r[9]),
            status=r[10],
            cidade=r[11],
            estado=r[12],
            endereco=r[13],
            ano=r[14],
            data_producao=r[15],
            horario_producao=r[16],
            qualidade=r[17],
            data_venda=r[18]
        )

    except HTTPException:
        conn.rollback()
        raise

    except Exception as e:

        conn.rollback()

        raise HTTPException(
            status_code=400,
            detail=f"Erro ao criar recurso: {e}"
        )

    finally:

        cur.close()
        conn.close()


# ============================================================
# LISTAR RECURSOS
# ============================================================

@router.get("/Recursos", response_model=List[Recurso])
async def listar_recursos():

    conn = get_connection()
    cur = conn.cursor()

    try:

        cur.execute(
            """
            SELECT
                id_recurso,
                tipo_recurso,
                categoria,
                nome,
                descricao,
                id_produtor,
                id_cooperativa,
                quantidade,
                unidade,
                valor,
                status,
                cidade,
                estado,
                endereco,
                ano,
                data_producao,
                horario_producao,
                qualidade,
                data_venda
            FROM recurso
            ORDER BY id_recurso DESC
            """
        )

        registros = cur.fetchall()

        return [
            Recurso(
                id_recurso=r[0],
                tipo_recurso=r[1],
                categoria=r[2],
                nome=r[3],
                descricao=r[4],
                id_produtor=r[5],
                id_cooperativa=r[6],
                quantidade=float(r[7]),
                unidade=r[8],
                valor=float(r[9]),
                status=r[10],
                cidade=r[11],
                estado=r[12],
                endereco=r[13],
                ano=r[14],
                data_producao=r[15],
                horario_producao=r[16],
                qualidade=r[17],
                data_venda=r[18]
            )
            for r in registros
        ]

    finally:

        cur.close()
        conn.close()


# ============================================================
# BUSCAR RECURSO
# ============================================================

@router.get("/Recurso/{recurso_id}", response_model=Recurso)
async def obter_recurso(recurso_id: int):

    conn = get_connection()
    cur = conn.cursor()

    try:

        cur.execute(
            """
            SELECT
                id_recurso,
                tipo_recurso,
                categoria,
                nome,
                descricao,
                id_produtor,
                id_cooperativa,
                quantidade,
                unidade,
                valor,
                status,
                cidade,
                estado,
                endereco,
                ano,
                data_producao,
                horario_producao,
                qualidade,
                data_venda
            FROM recurso
            WHERE id_recurso = %s
            """,
            (recurso_id,)
        )

        r = cur.fetchone()

        if not r:
            raise HTTPException(
                status_code=404,
                detail="Recurso não encontrado"
            )

        return Recurso(
            id_recurso=r[0],
            tipo_recurso=r[1],
            categoria=r[2],
            nome=r[3],
            descricao=r[4],
            id_produtor=r[5],
            id_cooperativa=r[6],
            quantidade=float(r[7]),
            unidade=r[8],
            valor=float(r[9]),
            status=r[10],
            cidade=r[11],
            estado=r[12],
            endereco=r[13],
            ano=r[14],
            data_producao=r[15],
            horario_producao=r[16],
            qualidade=r[17],
            data_venda=r[18]
        )

    finally:

        cur.close()
        conn.close()


# ============================================================
# EDITAR RECURSO
# ============================================================

@router.patch("/Recurso/{recurso_id}", response_model=Recurso)
async def atualizar_recurso(
    recurso_id: int,
    rec: RecursoUpdate
):

    conn = get_connection()
    cur = conn.cursor()

    try:

        cur.execute(
            """
            SELECT id_recurso
            FROM recurso
            WHERE id_recurso = %s
            """,
            (recurso_id,)
        )

        if not cur.fetchone():

            raise HTTPException(
                status_code=404,
                detail="Recurso não encontrado"
            )

        campos = []
        valores = []

        dados = rec.model_dump(exclude_unset=True)

        for campo, valor in dados.items():

            if campo in [
                "tipo_recurso",
                "categoria",
                "nome",
                "descricao",
                "id_produtor",
                "id_cooperativa",
                "quantidade",
                "unidade",
                "valor",
                "status",
                "cidade",
                "estado",
                "endereco",
                "ano",
                "data_producao",
                "horario_producao",
                "qualidade"
            ]:

                campos.append(f"{campo} = %s")
                valores.append(valor)

        if not campos:

            raise HTTPException(
                status_code=400,
                detail="Nenhum campo fornecido para atualização"
            )

        # ----------------------------------------------------
        # Validações
        # ----------------------------------------------------

        if rec.tipo_recurso is not None:

            if rec.tipo_recurso not in TIPOS_VALIDOS:

                raise HTTPException(
                    status_code=400,
                    detail="Tipo de recurso inválido"
                )

        if rec.unidade is not None:

            if rec.unidade not in UNIDADES_VALIDAS:

                raise HTTPException(
                    status_code=400,
                    detail="Unidade inválida"
                )

        if rec.status is not None:

            if rec.status not in STATUS_VALIDOS:

                raise HTTPException(
                    status_code=400,
                    detail="Status inválido"
                )

        valores.append(recurso_id)

        query = f"""
            UPDATE recurso
            SET {', '.join(campos)}
            WHERE id_recurso = %s
        """

        cur.execute(query, valores)

        conn.commit()

        # ----------------------------------------------------
        # Buscar atualizado
        # ----------------------------------------------------

        cur.execute(
            """
            SELECT
                id_recurso,
                tipo_recurso,
                categoria,
                nome,
                descricao,
                id_produtor,
                id_cooperativa,
                quantidade,
                unidade,
                valor,
                status,
                cidade,
                estado,
                endereco,
                ano,
                data_producao,
                horario_producao,
                qualidade,
                data_venda
            FROM recurso
            WHERE id_recurso = %s
            """,
            (recurso_id,)
        )

        r = cur.fetchone()

        return Recurso(
            id_recurso=r[0],
            tipo_recurso=r[1],
            categoria=r[2],
            nome=r[3],
            descricao=r[4],
            id_produtor=r[5],
            id_cooperativa=r[6],
            quantidade=float(r[7]),
            unidade=r[8],
            valor=float(r[9]),
            status=r[10],
            cidade=r[11],
            estado=r[12],
            endereco=r[13],
            ano=r[14],
            data_producao=r[15],
            horario_producao=r[16],
            qualidade=r[17],
            data_venda=r[18]
        )

    except HTTPException:

        conn.rollback()
        raise

    except Exception as e:

        conn.rollback()

        raise HTTPException(
            status_code=400,
            detail=f"Erro ao atualizar recurso: {e}"
        )

    finally:

        cur.close()
        conn.close()


# ============================================================
# MARCAR COMO VENDIDO
# ============================================================

@router.patch("/Recurso/{recurso_id}/vender")
async def vender_recurso(recurso_id: int):

    conn = get_connection()
    cur = conn.cursor()

    try:

        cur.execute(
            """
            SELECT status
            FROM recurso
            WHERE id_recurso = %s
            """,
            (recurso_id,)
        )

        recurso = cur.fetchone()

        if not recurso:

            raise HTTPException(
                status_code=404,
                detail="Recurso não encontrado"
            )

        if recurso[0] == "Vendido":

            raise HTTPException(
                status_code=400,
                detail="Este recurso já foi vendido"
            )

        cur.execute(
            """
            UPDATE recurso
            SET
                status = 'Vendido',
                data_venda = CURRENT_TIMESTAMP
            WHERE id_recurso = %s
            """,
            (recurso_id,)
        )

        conn.commit()

        return {
            "msg": "Recurso marcado como vendido",
            "id_recurso": recurso_id,
            "status": "Vendido"
        }

    except HTTPException:

        conn.rollback()
        raise

    except Exception as e:

        conn.rollback()

        raise HTTPException(
            status_code=400,
            detail=f"Erro ao registrar venda: {e}"
        )

    finally:

        cur.close()
        conn.close()


# ============================================================
# EXCLUIR
# ============================================================

@router.delete("/Recurso/{recurso_id}")
async def deletar_recurso(recurso_id: int):

    conn = get_connection()
    cur = conn.cursor()

    try:

        cur.execute(
            """
            SELECT id_recurso, status
            FROM recurso
            WHERE id_recurso = %s
            """,
            (recurso_id,)
        )

        recurso = cur.fetchone()

        if not recurso:

            raise HTTPException(
                status_code=404,
                detail="Recurso não encontrado"
            )

        # Não apaga um produto que já foi vendido.
        if recurso[1] == "Vendido":

            raise HTTPException(
                status_code=400,
                detail="Recursos vendidos não podem ser excluídos"
            )

        cur.execute(
            """
            DELETE FROM recurso
            WHERE id_recurso = %s
            """,
            (recurso_id,)
        )

        conn.commit()

        return {
            "msg": "Recurso excluído com sucesso"
        }

    except HTTPException:

        conn.rollback()
        raise

    except Exception as e:

        conn.rollback()

        raise HTTPException(
            status_code=400,
            detail=f"Erro ao excluir recurso: {e}"
        )

    finally:

        cur.close()
        conn.close()