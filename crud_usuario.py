from fastapi import APIRouter, HTTPException
from passlib.context import CryptContext

from db import get_connection
from schemas import UsuarioCreate

router = APIRouter()

# Configuração para hash seguro de senha usando bcrypt
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def gerar_hash_senha(senha: str) -> str:
    """Gera o hash da senha fornecida pelo usuário."""
    return pwd_context.hash(senha)


# ============================================================
# CRIAR USUÁRIO
# ============================================================

@router.post("")
async def criar_usuario(usuario: UsuarioCreate):

    conn = get_connection()
    cur = conn.cursor()

    try:

        # ----------------------------------------------------
        # VERIFICA SE O CPF JÁ ESTÁ CADASTRADO
        # ----------------------------------------------------

        cur.execute(
            """
            SELECT id
            FROM usuario
            WHERE cpf = %s
            """,
            (usuario.cpf,)
        )

        if cur.fetchone():
            raise HTTPException(
                status_code=400,
                detail="Este CPF já está cadastrado."
            )

        # ----------------------------------------------------
        # GERA O HASH DA SENHA
        # ----------------------------------------------------

        senha_criptografada = gerar_hash_senha(usuario.senha)

        # ----------------------------------------------------
        # CADASTRA USUÁRIO
        # ----------------------------------------------------

        cur.execute(
            """
            INSERT INTO usuario
                (name, age, telefone, cpf, senha_hash)
            VALUES
                (%s, %s, %s, %s, %s)
            RETURNING id
            """,
            (
                usuario.nome,
                usuario.idade,
                usuario.telefone,
                usuario.cpf,
                senha_criptografada
            )
        )

        id_usuario = cur.fetchone()[0]

        conn.commit()

        # Nunca retorne a senha em texto puro ou hash nas respostas!
        return {
            "msg": "Usuário criado com sucesso",
            "id": id_usuario,
            "nome": usuario.nome,
            "idade": usuario.idade,
            "telefone": usuario.telefone,
            "cpf": usuario.cpf
        }

    except HTTPException:
        conn.rollback()
        raise

    except Exception as e:
        conn.rollback()

        raise HTTPException(
            status_code=400,
            detail=f"Erro ao criar usuário: {e}"
        )

    finally:
        cur.close()
        conn.close()


# ============================================================
# LISTAR USUÁRIOS
# ============================================================

@router.get("")
async def listar_usuarios():

    conn = get_connection()
    cur = conn.cursor()

    try:

        cur.execute(
            """
            SELECT
                id,
                name,
                age,
                telefone,
                cpf
            FROM usuario
            ORDER BY id
            """
        )

        usuarios = cur.fetchall()

        return [
            {
                "id": usuario[0],
                "nome": usuario[1],
                "idade": usuario[2],
                "telefone": usuario[3],
                "cpf": usuario[4]
            }
            for usuario in usuarios
        ]

    except Exception as e:

        raise HTTPException(
            status_code=500,
            detail=f"Erro ao listar usuários: {e}"
        )

    finally:
        cur.close()
        conn.close()


# ============================================================
# OBTER USUÁRIO
# ============================================================

@router.get("/{usuario_id}")
async def obter_usuario(usuario_id: int):

    conn = get_connection()
    cur = conn.cursor()

    try:

        cur.execute(
            """
            SELECT
                id,
                name,
                age,
                telefone,
                cpf
            FROM usuario
            WHERE id = %s
            """,
            (usuario_id,)
        )

        usuario = cur.fetchone()

        if not usuario:
            raise HTTPException(
                status_code=404,
                detail="Usuário não encontrado."
            )

        return {
            "id": usuario[0],
            "nome": usuario[1],
            "idade": usuario[2],
            "telefone": usuario[3],
            "cpf": usuario[4]
        }

    finally:
        cur.close()
        conn.close()


# ============================================================
# ATUALIZAR USUÁRIO
# ============================================================

@router.patch("/{usuario_id}")
async def atualizar_usuario(
    usuario_id: int,
    usuario: UsuarioCreate
):

    conn = get_connection()
    cur = conn.cursor()

    try:

        # ----------------------------------------------------
        # VERIFICA USUÁRIO
        # ----------------------------------------------------

        cur.execute(
            """
            SELECT id
            FROM usuario
            WHERE id = %s
            """,
            (usuario_id,)
        )

        if not cur.fetchone():
            raise HTTPException(
                status_code=404,
                detail="Usuário não encontrado."
            )

        # ----------------------------------------------------
        # VERIFICA CPF
        # ----------------------------------------------------

        cur.execute(
            """
            SELECT id
            FROM usuario
            WHERE cpf = %s
            AND id <> %s
            """,
            (
                usuario.cpf,
                usuario_id
            )
        )

        if cur.fetchone():
            raise HTTPException(
                status_code=400,
                detail="Este CPF já está cadastrado para outro usuário."
            )

        # ----------------------------------------------------
        # ATUALIZA USUÁRIO
        # ----------------------------------------------------

        senha_criptografada = gerar_hash_senha(usuario.senha)

        cur.execute(
            """
            UPDATE usuario
            SET
                name = %s,
                age = %s,
                telefone = %s,
                cpf = %s,
                senha_hash = %s
            WHERE id = %s
            """,
            (
                usuario.nome,
                usuario.idade,
                usuario.telefone,
                usuario.cpf,
                senha_criptografada,
                usuario_id
            )
        )

        conn.commit()

        return await obter_usuario(usuario_id)

    except HTTPException:
        conn.rollback()
        raise

    except Exception as e:

        conn.rollback()

        raise HTTPException(
            status_code=400,
            detail=f"Erro ao atualizar usuário: {e}"
        )

    finally:
        cur.close()
        conn.close()


# ============================================================
# DELETAR USUÁRIO
# ============================================================

@router.delete("/{usuario_id}")
async def deletar_usuario(usuario_id: int):

    conn = get_connection()
    cur = conn.cursor()

    try:

        cur.execute(
            """
            DELETE FROM usuario
            WHERE id = %s
            RETURNING id
            """,
            (usuario_id,)
        )

        usuario = cur.fetchone()

        if not usuario:
            raise HTTPException(
                status_code=404,
                detail="Usuário não encontrado."
            )

        conn.commit()

        return {
            "msg": "Usuário deletado com sucesso"
        }

    except HTTPException:
        conn.rollback()
        raise

    except Exception as e:

        conn.rollback()

        raise HTTPException(
            status_code=400,
            detail=f"Erro ao deletar usuário: {e}"
        )

    finally:
        cur.close()
        conn.close()