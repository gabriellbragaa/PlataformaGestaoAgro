from fastapi import APIRouter, HTTPException
from typing import List, Optional
from db import get_connection
from models import Parceria, ParceriaUpdate

router = APIRouter()

@router.post("")
async def criar_parceria(par: Parceria):
    conn = get_connection()
    cur = conn.cursor()
    try:
        cur.execute(
            "INSERT INTO parceria (id_empresa, id_cooperativa) VALUES (%s, %s)",
            (par.id_empresa, par.id_cooperativa)
        )
        conn.commit()
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=400, detail=f"Erro ao criar parceria: {e}")
    finally:
        cur.close()
        conn.close()
    return {"msg": "Parceria criada com sucesso"}

@router.get("", response_model=List[Parceria])
async def listar_parcerias():
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("SELECT id_empresa, id_cooperativa FROM parceria")
    parcerias = cur.fetchall()
    cur.close()
    conn.close()
    return [
        Parceria(
            id_empresa=row[0],
            id_cooperativa=row[1]
        ) for row in parcerias
    ]

@router.get("/{id_empresa}/{id_cooperativa}", response_model=Parceria)
async def obter_parceria(id_empresa: int, id_cooperativa: int):
    conn = get_connection()
    cur = conn.cursor()
    cur.execute(
        "SELECT id_empresa, id_cooperativa FROM parceria WHERE id_empresa = %s AND id_cooperativa = %s",
        (id_empresa, id_cooperativa)
    )
    parceria = cur.fetchone()
    cur.close()
    conn.close()

    if not parceria:
        raise HTTPException(status_code=404, detail="Parceria não encontrada")

    return Parceria(
        id_empresa=parceria[0],
        id_cooperativa=parceria[1]
    )

@router.patch("/{id_empresa}/{id_cooperativa}", response_model=Parceria)
async def atualizar_parceria(id_empresa: int, id_cooperativa: int, par: ParceriaUpdate):
    conn = get_connection()
    cur = conn.cursor()

    try:
        cur.execute(
            "SELECT id_empresa, id_cooperativa FROM parceria WHERE id_empresa = %s AND id_cooperativa = %s",
            (id_empresa, id_cooperativa)
        )
        if not cur.fetchone():
            raise HTTPException(status_code=404, detail="Parceria não encontrada")

        fields = []
        values = []

        if par.id_empresa is not None:
            fields.append("id_empresa = %s")
            values.append(par.id_empresa)
        if par.id_cooperativa is not None:
            fields.append("id_cooperativa = %s")
            values.append(par.id_cooperativa)

        if not fields:
            raise HTTPException(status_code=400, detail="Nenhum campo fornecido para atualização")

        # Atualizando pelo par chave antiga
        values.append(id_empresa)
        values.append(id_cooperativa)
        query = f"UPDATE parceria SET {', '.join(fields)} WHERE id_empresa = %s AND id_cooperativa = %s"
        cur.execute(query, values)
        conn.commit()

        cur.execute(
            "SELECT id_empresa, id_cooperativa FROM parceria WHERE id_empresa = %s AND id_cooperativa = %s",
            (par.id_empresa if par.id_empresa is not None else id_empresa,
             par.id_cooperativa if par.id_cooperativa is not None else id_cooperativa)
        )
        updated = cur.fetchone()

        return Parceria(
            id_empresa=updated[0],
            id_cooperativa=updated[1]
        )

    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=400, detail=f"Erro ao atualizar parceria: {e}")
    finally:
        cur.close()
        conn.close()

@router.delete("/{id_empresa}/{id_cooperativa}")
async def deletar_parceria(id_empresa: int, id_cooperativa: int):
    conn = get_connection()
    cur = conn.cursor()
    try:
        cur.execute(
            "SELECT id_empresa, id_cooperativa FROM parceria WHERE id_empresa = %s AND id_cooperativa = %s",
            (id_empresa, id_cooperativa)
        )
        if not cur.fetchone():
            raise HTTPException(status_code=404, detail="Parceria não encontrada")

        cur.execute(
            "DELETE FROM parceria WHERE id_empresa = %s AND id_cooperativa = %s",
            (id_empresa, id_cooperativa)
        )
        conn.commit()
        return {"msg": "Parceria deletada com sucesso"}

    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=400, detail=f"Erro ao deletar parceria: {e}")
    finally:
        cur.close()
        conn.close()
