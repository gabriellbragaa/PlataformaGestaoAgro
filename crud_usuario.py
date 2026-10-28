
from fastapi import APIRouter, HTTPException
from passlib.context import CryptContext

from db import get_connection
from schemas import UsuarioCreate, UsuarioLogin

router = APIRouter()

# ============================================================
# CONFIGURAÇÃO DE HASH DE SENHA
# ============================================================

pwd_context = CryptContext(
    schemes=["bcrypt"],
    deprecated="auto"
)


def gerar_hash_senha(senha: str) -> str:
    """Gera um hash seguro da senha usando bcrypt."""

    if not senha:
        raise HTTPException(
            status_code=400,
            detail="A senha não pode estar vazia."
        )

    if len(senha.encode("utf-8")) > 72:
        raise HTTPException(
            status_code=400,
            detail="A senha não pode ultrapassar 72 bytes."
        )

    return pwd_context.hash(senha)


# ============================================================
# CRIAR USUÁRIO
# POST /usuario
# ============================================================

@router.post("")
async def criar_usuario(usuario: UsuarioCreate):

    conn = None
    cur = None

    try:
        conn = get_connection()
        cur = conn.cursor()

        # Verifica se o CPF já está cadastrado
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

        # Gera o hash da senha
        senha_criptografada = gerar_hash_senha(usuario.senha)

        # Insere o usuário no banco
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

        return {
            "msg": "Usuário criado com sucesso.",
            "id": id_usuario,
            "nome": usuario.nome,
            "idade": usuario.idade,
            "telefone": usuario.telefone,
            "cpf": usuario.cpf
        }

    except HTTPException:
        if conn:
            conn.rollback()
        raise

    except Exception as e:
        if conn:
            conn.rollback()

        raise HTTPException(
            status_code=500,
            detail=f"Erro ao criar usuário: {e}"
        )

    finally:
        if cur:
            cur.close()
        if conn:
            conn.close()


# ============================================================
# LISTAR USUÁRIOS
# GET /usuario
# ============================================================

@router.get("")
async def listar_usuarios():

    conn = None
    cur = None

    try:
        conn = get_connection()
        cur = conn.cursor()

        cur.execute(
            """
            SELECT id, name, age, telefone, cpf
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
        if cur:
            cur.close()
        if conn:
            conn.close()


# ============================================================
# OBTER USUÁRIO POR ID
# GET /usuario/{usuario_id}
# ============================================================

@router.get("/{usuario_id}")
async def obter_usuario(usuario_id: int):

    conn = None
    cur = None

    try:
        conn = get_connection()
        cur = conn.cursor()

        cur.execute(
            """
            SELECT id, name, age, telefone, cpf
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

    except HTTPException:
        raise

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Erro ao consultar usuário: {e}"
        )

    finally:
        if cur:
            cur.close()
        if conn:
            conn.close()


# ============================================================
# ATUALIZAR USUÁRIO
# PATCH /usuario/{usuario_id}
# ============================================================

@router.patch("/{usuario_id}")
async def atualizar_usuario(
    usuario_id: int,
    usuario: UsuarioCreate
):

    conn = None
    cur = None

    try:
        conn = get_connection()
        cur = conn.cursor()

        # Verifica se o usuário existe
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

        # Verifica se o CPF pertence a outro usuário
        cur.execute(
            """
            SELECT id
            FROM usuario
            WHERE cpf = %s
              AND id <> %s
            """,
            (usuario.cpf, usuario_id)
        )

        if cur.fetchone():
            raise HTTPException(
                status_code=400,
                detail="Este CPF já está cadastrado para outro usuário."
            )

        # Gera novo hash para a senha atualizada
        senha_criptografada = gerar_hash_senha(usuario.senha)

        # Atualiza os dados
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

        return {
            "msg": "Usuário atualizado com sucesso.",
            "id": usuario_id,
            "nome": usuario.nome,
            "idade": usuario.idade,
            "telefone": usuario.telefone,
            "cpf": usuario.cpf
        }

    except HTTPException:
        if conn:
            conn.rollback()
        raise

    except Exception as e:
        if conn:
            conn.rollback()

        raise HTTPException(
            status_code=500,
            detail=f"Erro ao atualizar usuário: {e}"
        )

    finally:
        if cur:
            cur.close()
        if conn:
            conn.close()


# ============================================================
# DELETAR USUÁRIO
# DELETE /usuario/{usuario_id}
# ============================================================

@router.delete("/{usuario_id}")
async def deletar_usuario(usuario_id: int):

    conn = None
    cur = None

    try:
        conn = get_connection()
        cur = conn.cursor()

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
            "msg": "Usuário deletado com sucesso.",
            "id": usuario[0]
        }

    except HTTPException:
        if conn:
            conn.rollback()
        raise

    except Exception as e:
        if conn:
            conn.rollback()

        raise HTTPException(
            status_code=500,
            detail=f"Erro ao deletar usuário: {e}"
        )

    finally:
        if cur:
            cur.close()
        if conn:
            conn.close()

@router.post("/login")
async def login_usuario(dados: UsuarioLogin):

    conn = None
    cur = None

    try:
        # Normaliza o CPF removendo pontos, traços e espaços
        cpf = "".join(
            caractere
            for caractere in dados.cpf
            if caractere.isdigit()
        )

        if len(cpf) != 11:
            raise HTTPException(
                status_code=400,
                detail="CPF inválido."
            )

        conn = get_connection()
        cur = conn.cursor()

        # Busca o usuário pelo CPF
        cur.execute(
            """
            SELECT id, name, age, telefone, cpf, senha_hash
            FROM usuario
            WHERE cpf = %s
            """,
            (cpf,)
        )

        usuario = cur.fetchone()

        # Mensagem genérica para não revelar se o CPF existe
        if not usuario:
            raise HTTPException(
                status_code=401,
                detail="CPF ou senha incorretos."
            )

        senha_hash = usuario[5]

        # Confere a senha digitada com o hash salvo no banco
        if not senha_hash or not pwd_context.verify(
            dados.senha,
            senha_hash
        ):
            raise HTTPException(
                status_code=401,
                detail="CPF ou senha incorretos."
            )

        # Login validado
        return {
            "msg": "Login realizado com sucesso.",
            "usuario": {
                "id": usuario[0],
                "nome": usuario[1],
                "idade": usuario[2],
                "telefone": usuario[3],
                "cpf": usuario[4]
            }
        }

    except HTTPException:
        raise

    except Exception:
        raise HTTPException(
            status_code=500,
            detail="Erro interno ao realizar login."
        )

    finally:
        if cur:
            cur.close()
        if conn:
            conn.close()
