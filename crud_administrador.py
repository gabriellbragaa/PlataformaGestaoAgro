from fastapi import APIRouter, HTTPException
from db import get_connection
from models import Administrador, AdministradorUpdate
from typing import List

router = APIRouter()


# ============================================================
# CRIAR ADMINISTRADOR
# ============================================================

@router.post("/Administrador")
async def criar_administrador(admin: Administrador):

    conn = get_connection()
    cur = conn.cursor()

    try:

        # Verifica se o associado existe
        cur.execute(
            """
            SELECT id_associado
            FROM associado
            WHERE id_associado = %s
            """,
            (admin.id_associado,)
        )

        associado = cur.fetchone()

        if not associado:
            raise HTTPException(
                status_code=400,
                detail="Associado não encontrado."
            )

        # Verifica se já é administrador
        cur.execute(
            """
            SELECT id_admin
            FROM administrador
            WHERE id_associado = %s
            """,
            (admin.id_associado,)
        )

        if cur.fetchone():
            raise HTTPException(
                status_code=400,
                detail="Este associado já é administrador."
            )

        cur.execute(
            """
            INSERT INTO administrador
                (nome, rg, id_associado)
            VALUES
                (%s, %s, %s)
            RETURNING id_admin
            """,
            (
                admin.nome,
                admin.rg,
                admin.id_associado
            )
        )

        id_admin = cur.fetchone()[0]

        conn.commit()

        return {
            "msg": "Administrador criado com sucesso",
            "id_admin": id_admin
        }

    except HTTPException:
        conn.rollback()
        raise

    except Exception as e:
        conn.rollback()

        raise HTTPException(
            status_code=400,
            detail=f"Erro ao criar administrador: {e}"
        )

    finally:
        cur.close()
        conn.close()


# ============================================================
# LISTAR ADMINISTRADORES
# ============================================================

@router.get(
    "/Administradores",
    response_model=List[Administrador]
)
async def listar_administradores():

    conn = get_connection()
    cur = conn.cursor()

    try:

        cur.execute(
            """
            SELECT
                id_admin,
                nome,
                rg,
                id_associado
            FROM administrador
            ORDER BY id_admin
            """
        )

        admins = cur.fetchall()

        return [
            Administrador(
                id_admin=a[0],
                nome=a[1],
                rg=a[2],
                id_associado=a[3]
            )
            for a in admins
        ]

    finally:
        cur.close()
        conn.close()


# ============================================================
# OBTER ADMINISTRADOR
# ============================================================

@router.get(
    "/Administrador/{admin_id}",
    response_model=Administrador
)
async def obter_administrador(admin_id: int):

    conn = get_connection()
    cur = conn.cursor()

    try:

        cur.execute(
            """
            SELECT
                id_admin,
                nome,
                rg,
                id_associado
            FROM administrador
            WHERE id_admin = %s
            """,
            (admin_id,)
        )

        admin = cur.fetchone()

        if not admin:
            raise HTTPException(
                status_code=404,
                detail="Administrador não encontrado"
            )

        return Administrador(
            id_admin=admin[0],
            nome=admin[1],
            rg=admin[2],
            id_associado=admin[3]
        )

    finally:
        cur.close()
        conn.close()


# ============================================================
# ATUALIZAR ADMINISTRADOR
# ============================================================

@router.patch(
    "/Administrador/{admin_id}",
    response_model=Administrador
)
async def atualizar_administrador(
    admin_id: int,
    admin: AdministradorUpdate
):

    conn = get_connection()
    cur = conn.cursor()

    try:

        # Verifica administrador
        cur.execute(
            """
            SELECT id_admin
            FROM administrador
            WHERE id_admin = %s
            """,
            (admin_id,)
        )

        if not cur.fetchone():
            raise HTTPException(
                status_code=404,
                detail="Administrador não encontrado"
            )

        campos = []
        valores = []

        if admin.nome is not None:
            campos.append("nome = %s")
            valores.append(admin.nome)

        if admin.rg is not None:
            campos.append("rg = %s")
            valores.append(admin.rg)

        if admin.id_associado is not None:

            # Verifica associado
            cur.execute(
                """
                SELECT id_associado
                FROM associado
                WHERE id_associado = %s
                """,
                (admin.id_associado,)
            )

            if not cur.fetchone():
                raise HTTPException(
                    status_code=400,
                    detail="Associado não encontrado."
                )

            campos.append("id_associado = %s")
            valores.append(admin.id_associado)

        if not campos:
            raise HTTPException(
                status_code=400,
                detail="Nenhum campo fornecido"
            )

        valores.append(admin_id)

        query = f"""
            UPDATE administrador
            SET {', '.join(campos)}
            WHERE id_admin = %s
        """

        cur.execute(query, valores)

        conn.commit()

        cur.execute(
            """
            SELECT
                id_admin,
                nome,
                rg,
                id_associado
            FROM administrador
            WHERE id_admin = %s
            """,
            (admin_id,)
        )

        a = cur.fetchone()

        return Administrador(
            id_admin=a[0],
            nome=a[1],
            rg=a[2],
            id_associado=a[3]
        )

    except HTTPException:
        conn.rollback()
        raise

    except Exception as e:
        conn.rollback()

        raise HTTPException(
            status_code=400,
            detail=f"Erro ao atualizar: {e}"
        )

    finally:
        cur.close()
        conn.close()


# ============================================================
# DELETAR ADMINISTRADOR
# ============================================================

@router.delete("/Administrador/{admin_id}")
async def deletar_administrador(admin_id: int):

    conn = get_connection()
    cur = conn.cursor()

    try:

        cur.execute(
            """
            DELETE FROM administrador
            WHERE id_admin = %s
            RETURNING id_admin
            """,
            (admin_id,)
        )

        deleted = cur.fetchone()

        if not deleted:
            raise HTTPException(
                status_code=404,
                detail="Administrador não encontrado"
            )

        conn.commit()

        return {
            "msg": "Administrador deletado com sucesso"
        }

    except HTTPException:
        conn.rollback()
        raise

    except Exception as e:
        conn.rollback()

        raise HTTPException(
            status_code=400,
            detail=f"Erro ao deletar administrador: {e}"
        )

    finally:
        cur.close()
        conn.close()