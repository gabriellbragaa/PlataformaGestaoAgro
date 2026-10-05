from fastapi import APIRouter, HTTPException
from db import get_connection
from models import Cliente, ClienteUpdate
from typing import List

router = APIRouter()

@router.post("")
async def criar_cliente(cli: Cliente):
    conn = get_connection()
    cur = conn.cursor()
    try:
        cur.execute("""
            INSERT INTO Cliente (id_cliente, nome, cnpj, telefone, endereco)
            VALUES (%s, %s, %s, %s, %s)
        """, (cli.id_cliente, cli.nome, cli.cnpj, cli.telefone, cli.endereco))
        conn.commit()
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=400, detail=f"Erro ao criar cliente: {e}")
    finally:
        cur.close()
        conn.close()
    return {"msg": "Cliente criado com sucesso"}

@router.get("/Clientes", response_model=List[Cliente])
async def listar_clientes():
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("SELECT id_cliente, nome, cnpj, telefone, endereco FROM Cliente")
    clientes = cur.fetchall()
    cur.close()
    conn.close()
    return [
        Cliente(
            id_cliente=c[0],
            nome=c[1],
            cnpj=c[2],
            telefone=c[3],
            endereco=c[4]
        ) for c in clientes
    ]

@router.get("/{cliente_id}", response_model=Cliente)
async def obter_cliente(cliente_id: int):
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("SELECT id_cliente, nome, cnpj, telefone, endereco FROM Cliente WHERE id_cliente = %s", (cliente_id,))
    c = cur.fetchone()
    cur.close()
    conn.close()
    if not c:
        raise HTTPException(status_code=404, detail="Cliente não encontrado")
    return Cliente(
        id_cliente=c[0],
        nome=c[1],
        cnpj=c[2],
        telefone=c[3],
        endereco=c[4]
    )

@router.patch("/{cliente_id}", response_model=Cliente)
async def atualizar_cliente(cliente_id: int, cli: ClienteUpdate):
    conn = get_connection()
    cur = conn.cursor()
    try:
        campos, valores = [], []
        if cli.nome is not None:
            campos.append("nome = %s")
            valores.append(cli.nome)
        if cli.cnpj is not None:
            campos.append("cnpj = %s")
            valores.append(cli.cnpj)
        if cli.telefone is not None:
            campos.append("telefone = %s")
            valores.append(cli.telefone)
        if cli.endereco is not None:
            campos.append("endereco = %s")
            valores.append(cli.endereco)

        if not campos:
            raise HTTPException(status_code=400, detail="Nenhum campo fornecido para atualização")

        valores.append(cliente_id)
        query = f"UPDATE Cliente SET {', '.join(campos)} WHERE id_cliente = %s"
        cur.execute(query, valores)
        conn.commit()

        cur.execute("SELECT id_cliente, nome, cnpj, telefone, endereco FROM Cliente WHERE id_cliente = %s", (cliente_id,))
        c = cur.fetchone()

        return Cliente(
            id_cliente=c[0],
            nome=c[1],
            cnpj=c[2],
            telefone=c[3],
            endereco=c[4]
        )
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=400, detail=f"Erro ao atualizar cliente: {e}")
    finally:
        cur.close()
        conn.close()

@router.delete("/{cliente_id}")
async def deletar_cliente(cliente_id: int):
    conn = get_connection()
    cur = conn.cursor()
    try:
        cur.execute("DELETE FROM Cliente WHERE id_cliente = %s", (cliente_id,))
        if cur.rowcount == 0:
            raise HTTPException(status_code=404, detail="Cliente não encontrado")
        conn.commit()
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=400, detail=f"Erro ao deletar cliente: {e}")
    finally:
        cur.close()
        conn.close()
    return {"msg": "Cliente deletado com sucesso"}
