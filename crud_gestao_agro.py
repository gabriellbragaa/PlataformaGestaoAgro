from datetime import date
from decimal import Decimal
from typing import Optional

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field

from db import get_connection

router = APIRouter()


class MaquinaIn(BaseModel):
    nome: str = Field(min_length=2, max_length=120)
    tipo: str = Field(min_length=2, max_length=80)
    fabricante: Optional[str] = None
    modelo: Optional[str] = None
    ano: Optional[int] = Field(default=None, ge=1950, le=2100)
    status: str = "Disponível"
    horas_uso: float = Field(default=0, ge=0)
    ultima_manutencao: Optional[date] = None
    proxima_manutencao: Optional[date] = None
    id_produtor: int
    id_cooperativa: Optional[int] = None


class RecebimentoIn(BaseModel):
    descricao: str = Field(min_length=2, max_length=180)
    valor: float = Field(gt=0)
    data_emissao: date
    data_vencimento: Optional[date] = None
    data_recebimento: Optional[date] = None
    status: str = "Pendente"
    forma_pagamento: Optional[str] = None
    id_produtor: Optional[int] = None
    id_cooperativa: Optional[int] = None
    id_cliente: Optional[int] = None


class IrrigacaoIn(BaseModel):
    nome_area: str = Field(min_length=2, max_length=120)
    cultura: str
    area_hectares: float = Field(gt=0)
    metodo: str
    consumo_agua_m3: float = Field(default=0, ge=0)
    frequencia: Optional[str] = None
    status: str = "Ativa"
    data_inicio: Optional[date] = None
    id_produtor: int
    id_cooperativa: Optional[int] = None


class InsumoIn(BaseModel):
    nome: str = Field(min_length=2, max_length=140)
    categoria: str
    descricao: Optional[str] = None
    unidade: str
    quantidade_estoque: float = Field(default=0, ge=0)
    estoque_minimo: float = Field(default=0, ge=0)
    custo_unitario: float = Field(default=0, ge=0)
    fornecedor: Optional[str] = None
    id_cooperativa: Optional[int] = None


def _dict_rows(cur):
    columns = [col[0] for col in cur.description]
    return [dict(zip(columns, row)) for row in cur.fetchall()]


def _one(cur):
    row = cur.fetchone()
    if row is None:
        return None
    return dict(zip([col[0] for col in cur.description], row))


def _run(sql, params=(), fetch="all"):
    conn = get_connection()
    cur = conn.cursor()
    try:
        cur.execute(sql, params)
        if fetch == "all":
            result = _dict_rows(cur) if cur.description else []
        elif fetch == "one":
            result = _one(cur) if cur.description else None
        else:
            result = None
        conn.commit()
        return result
    except Exception:
        conn.rollback()
        raise
    finally:
        cur.close()
        conn.close()


def _crud_routes(path, table, fields, schema, order_by):
    # Rotas registradas explicitamente abaixo; helpers centralizam validação e SQL.
    pass


def _listar(table, order_by):
    try:
        return _run(f"SELECT * FROM {table} ORDER BY {order_by}")
    except Exception as exc:
        raise HTTPException(500, f"Erro ao listar {table}: {exc}")


def _criar(table, payload, allowed):
    values = payload.model_dump(exclude_unset=True)
    cols = [c for c in values if c in allowed]
    if not cols:
        raise HTTPException(400, "Nenhum dado informado.")
    placeholders = ", ".join(["%s"] * len(cols))
    sql = f"INSERT INTO {table} ({', '.join(cols)}) VALUES ({placeholders}) RETURNING *"
    try:
        return _run(sql, tuple(values[c] for c in cols), "one")
    except Exception as exc:
        raise HTTPException(400, f"Não foi possível cadastrar: {exc}")


def _atualizar(table, id_col, item_id, payload, allowed):
    values = payload.model_dump(exclude_unset=True)
    values = {k: v for k, v in values.items() if k in allowed and v is not None}
    if not values:
        raise HTTPException(400, "Informe ao menos um campo para atualizar.")
    sets = ", ".join([f"{c} = %s" for c in values])
    sql = f"UPDATE {table} SET {sets}, atualizado_em = CURRENT_TIMESTAMP WHERE {id_col} = %s RETURNING *"
    try:
        row = _run(sql, tuple(values.values()) + (item_id,), "one")
        if not row:
            raise HTTPException(404, "Registro não encontrado.")
        return row
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(400, f"Erro ao atualizar: {exc}")


def _excluir(table, id_col, item_id):
    try:
        row = _run(f"DELETE FROM {table} WHERE {id_col} = %s RETURNING {id_col}", (item_id,), "one")
        if not row:
            raise HTTPException(404, "Registro não encontrado.")
        return {"mensagem": "Registro excluído.", id_col: row[id_col]}
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(400, f"Erro ao excluir: {exc}")


MAQUINA_FIELDS = {"nome", "tipo", "fabricante", "modelo", "ano", "status", "horas_uso", "ultima_manutencao", "proxima_manutencao", "id_produtor", "id_cooperativa"}
RECEBIMENTO_FIELDS = {"descricao", "valor", "data_emissao", "data_vencimento", "data_recebimento", "status", "forma_pagamento", "id_produtor", "id_cooperativa", "id_cliente"}
IRRIGACAO_FIELDS = {"nome_area", "cultura", "area_hectares", "metodo", "consumo_agua_m3", "frequencia", "status", "data_inicio", "id_produtor", "id_cooperativa"}
INSUMO_FIELDS = {"nome", "categoria", "descricao", "unidade", "quantidade_estoque", "estoque_minimo", "custo_unitario", "fornecedor", "id_cooperativa"}


@router.get("/maquinas", tags=["Máquinas"])
def listar_maquinas(id_produtor: Optional[int] = None, id_cooperativa: Optional[int] = None):
    filtros, params = [], []
    if id_produtor is not None:
        filtros.append("id_produtor = %s"); params.append(id_produtor)
    if id_cooperativa is not None:
        filtros.append("id_cooperativa = %s"); params.append(id_cooperativa)
    sql = "SELECT * FROM maquina" + (" WHERE " + " AND ".join(filtros) if filtros else "") + " ORDER BY id_maquina DESC"
    try: return _run(sql, tuple(params))
    except Exception as exc: raise HTTPException(500, f"Erro ao listar máquinas: {exc}")


@router.post("/maquinas", tags=["Máquinas"], status_code=201)
def criar_maquina(payload: MaquinaIn):
    return _criar("maquina", payload, MAQUINA_FIELDS)


@router.put("/maquinas/{item_id}", tags=["Máquinas"])
def atualizar_maquina(item_id: int, payload: MaquinaIn):
    return _atualizar("maquina", "id_maquina", item_id, payload, MAQUINA_FIELDS)


@router.delete("/maquinas/{item_id}", tags=["Máquinas"])
def excluir_maquina(item_id: int):
    return _excluir("maquina", "id_maquina", item_id)


@router.get("/recebimentos", tags=["Recebimentos"])
def listar_recebimentos(status: Optional[str] = None, id_produtor: Optional[int] = None, id_cooperativa: Optional[int] = None):
    filtros, params = [], []
    for col, val in (("status", status), ("id_produtor", id_produtor), ("id_cooperativa", id_cooperativa)):
        if val is not None: filtros.append(f"{col} = %s"); params.append(val)
    sql = "SELECT * FROM recebimento" + (" WHERE " + " AND ".join(filtros) if filtros else "") + " ORDER BY data_emissao DESC, id_recebimento DESC"
    try: return _run(sql, tuple(params))
    except Exception as exc: raise HTTPException(500, f"Erro ao listar recebimentos: {exc}")


@router.post("/recebimentos", tags=["Recebimentos"], status_code=201)
def criar_recebimento(payload: RecebimentoIn):
    return _criar("recebimento", payload, RECEBIMENTO_FIELDS)


@router.put("/recebimentos/{item_id}", tags=["Recebimentos"])
def atualizar_recebimento(item_id: int, payload: RecebimentoIn):
    return _atualizar("recebimento", "id_recebimento", item_id, payload, RECEBIMENTO_FIELDS)


@router.delete("/recebimentos/{item_id}", tags=["Recebimentos"])
def excluir_recebimento(item_id: int):
    return _excluir("recebimento", "id_recebimento", item_id)


@router.patch("/recebimentos/{item_id}/confirmar", tags=["Recebimentos"])
def confirmar_recebimento(item_id: int, data_recebimento: date = Query(default_factory=date.today)):
    try:
        row = _run("UPDATE recebimento SET status = 'Recebido', data_recebimento = %s, atualizado_em = CURRENT_TIMESTAMP WHERE id_recebimento = %s RETURNING *", (data_recebimento, item_id), "one")
        if not row: raise HTTPException(404, "Recebimento não encontrado.")
        return row
    except HTTPException: raise
    except Exception as exc: raise HTTPException(400, f"Erro ao confirmar recebimento: {exc}")


@router.get("/irrigacao", tags=["Irrigação"])
def listar_irrigacao(id_produtor: Optional[int] = None, id_cooperativa: Optional[int] = None):
    filtros, params = [], []
    if id_produtor is not None: filtros.append("id_produtor = %s"); params.append(id_produtor)
    if id_cooperativa is not None: filtros.append("id_cooperativa = %s"); params.append(id_cooperativa)
    sql = "SELECT * FROM irrigacao" + (" WHERE " + " AND ".join(filtros) if filtros else "") + " ORDER BY id_irrigacao DESC"
    try: return _run(sql, tuple(params))
    except Exception as exc: raise HTTPException(500, f"Erro ao listar irrigação: {exc}")


@router.post("/irrigacao", tags=["Irrigação"], status_code=201)
def criar_irrigacao(payload: IrrigacaoIn):
    return _criar("irrigacao", payload, IRRIGACAO_FIELDS)


@router.put("/irrigacao/{item_id}", tags=["Irrigação"])
def atualizar_irrigacao(item_id: int, payload: IrrigacaoIn):
    return _atualizar("irrigacao", "id_irrigacao", item_id, payload, IRRIGACAO_FIELDS)


@router.delete("/irrigacao/{item_id}", tags=["Irrigação"])
def excluir_irrigacao(item_id: int):
    return _excluir("irrigacao", "id_irrigacao", item_id)


@router.get("/insumos", tags=["Insumos"])
def listar_insumos(id_cooperativa: Optional[int] = None, abaixo_minimo: bool = False):
    filtros, params = [], []
    if id_cooperativa is not None: filtros.append("id_cooperativa = %s"); params.append(id_cooperativa)
    if abaixo_minimo: filtros.append("quantidade_estoque <= estoque_minimo")
    sql = "SELECT * FROM insumo" + (" WHERE " + " AND ".join(filtros) if filtros else "") + " ORDER BY nome"
    try: return _run(sql, tuple(params))
    except Exception as exc: raise HTTPException(500, f"Erro ao listar insumos: {exc}")


@router.post("/insumos", tags=["Insumos"], status_code=201)
def criar_insumo(payload: InsumoIn):
    return _criar("insumo", payload, INSUMO_FIELDS)


@router.put("/insumos/{item_id}", tags=["Insumos"])
def atualizar_insumo(item_id: int, payload: InsumoIn):
    return _atualizar("insumo", "id_insumo", item_id, payload, INSUMO_FIELDS)


@router.delete("/insumos/{item_id}", tags=["Insumos"])
def excluir_insumo(item_id: int):
    return _excluir("insumo", "id_insumo", item_id)


@router.patch("/insumos/{item_id}/estoque", tags=["Insumos"])
def movimentar_estoque(item_id: int, quantidade: float = Query(gt=0), operacao: str = Query(pattern="^(entrada|saida)$")):
    sinal = 1 if operacao == "entrada" else -1
    try:
        row = _run("UPDATE insumo SET quantidade_estoque = quantidade_estoque + (%s * %s), atualizado_em = CURRENT_TIMESTAMP WHERE id_insumo = %s AND quantidade_estoque + (%s * %s) >= 0 RETURNING *", (sinal, quantidade, item_id, sinal, quantidade), "one")
        if not row:
            raise HTTPException(400, "Insumo inexistente ou estoque insuficiente para essa saída.")
        return row
    except HTTPException: raise
    except Exception as exc: raise HTTPException(400, f"Erro ao movimentar estoque: {exc}")


@router.get("/relatorios/resumo", tags=["Relatórios"])
def relatorio_resumo(id_cooperativa: Optional[int] = None, data_inicio: Optional[date] = None, data_fim: Optional[date] = None):
    filtros, params = [], []
    if id_cooperativa is not None: filtros.append("id_cooperativa = %s"); params.append(id_cooperativa)
    if data_inicio is not None: filtros.append("data_emissao >= %s"); params.append(data_inicio)
    if data_fim is not None: filtros.append("data_emissao <= %s"); params.append(data_fim)
    where = " WHERE " + " AND ".join(filtros) if filtros else ""
    try:
        recebimentos = _run("SELECT COUNT(*) AS quantidade, COALESCE(SUM(valor),0) AS total, COALESCE(SUM(valor) FILTER (WHERE status = 'Recebido'),0) AS recebido, COALESCE(SUM(valor) FILTER (WHERE status <> 'Recebido'),0) AS pendente FROM recebimento" + where, tuple(params), "one")
        maquinas = _run("SELECT COUNT(*) AS quantidade, COUNT(*) FILTER (WHERE status = 'Disponível') AS disponiveis FROM maquina" + (" WHERE id_cooperativa = %s" if id_cooperativa is not None else ""), ((id_cooperativa,) if id_cooperativa is not None else ()), "one")
        irrigacao = _run("SELECT COUNT(*) AS areas, COALESCE(SUM(area_hectares),0) AS hectares, COALESCE(SUM(consumo_agua_m3),0) AS agua_m3 FROM irrigacao" + (" WHERE id_cooperativa = %s" if id_cooperativa is not None else ""), ((id_cooperativa,) if id_cooperativa is not None else ()), "one")
        insumos = _run("SELECT COUNT(*) AS itens, COUNT(*) FILTER (WHERE quantidade_estoque <= estoque_minimo) AS abaixo_minimo FROM insumo" + (" WHERE id_cooperativa = %s" if id_cooperativa is not None else ""), ((id_cooperativa,) if id_cooperativa is not None else ()), "one")
        return {"recebimentos": recebimentos, "maquinas": maquinas, "irrigacao": irrigacao, "insumos": insumos}
    except Exception as exc:
        raise HTTPException(500, f"Erro ao gerar relatório: {exc}")


@router.get("/relatorios/recebimentos-por-mes", tags=["Relatórios"])
def recebimentos_por_mes(id_cooperativa: Optional[int] = None):
    sql = """SELECT DATE_TRUNC('month', data_emissao)::date AS mes,
                    COUNT(*) AS quantidade, COALESCE(SUM(valor),0) AS total,
                    COALESCE(SUM(valor) FILTER (WHERE status = 'Recebido'),0) AS recebido
             FROM recebimento"""
    params = ()
    if id_cooperativa is not None:
        sql += " WHERE id_cooperativa = %s"; params = (id_cooperativa,)
    sql += " GROUP BY 1 ORDER BY 1"
    try: return _run(sql, params)
    except Exception as exc: raise HTTPException(500, f"Erro ao gerar série mensal: {exc}")
