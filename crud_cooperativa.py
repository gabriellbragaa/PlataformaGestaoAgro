from fastapi import UploadFile, File, APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import List, Optional
from db import get_connection

import pandas as pd
from io import BytesIO
import re
import unicodedata

router = APIRouter()


def normalizar_texto(texto: str) -> str:
    """Remove BOM, acentos, espaços extras e converte para maiúsculas."""
    if not texto:
        return ""
    texto = str(texto).replace("\ufeff", "")
    texto_norm = unicodedata.normalize("NFD", texto)
    sem_acento = "".join(
        c for c in texto_norm if unicodedata.category(c) != "Mn"
    )
    return " ".join(sem_acento.split()).upper()


def tratar_cep(valor):
    if valor is None or pd.isna(valor):
        return None

    try:
        if isinstance(valor, float):
            cep = str(int(valor))
        else:
            cep = str(valor).strip()
            if "E" in cep.upper():
                cep = str(int(float(cep.replace(",", "."))))

        cep = "".join(c for c in cep if c.isdigit())

        if not cep:
            return None

        return cep.zfill(8)
    except Exception:
        return None


def extrair_localizacao(regiao):
    if regiao is None or pd.isna(regiao):
        return None, None, None

    regiao = str(regiao).strip()

    if not regiao:
        return None, None, None

    # Separa por " - " e também por " - - " (campo vazio no meio)
    partes = [
        parte.strip()
        for parte in re.split(r"(?:\s+-)+\s+", regiao)
        if parte.strip().strip("-").strip()
    ]

    if len(partes) == 1:
        return partes[0], None, None

    if len(partes) == 2:
        return partes[0], None, partes[-1]

    cidade = partes[-1]
    bairro = partes[-2]
    endereco = " - ".join(partes[:-2])

    return endereco, bairro, cidade


def tratar_telefone(valor):
    if valor is None or pd.isna(valor):
        return None
    return str(valor).strip()


COLUNAS_OBRIGATORIAS = ["NOME", "TELEFONE", "REGIAO", "CEP"]


def ler_arquivo(conteudo: bytes, extensao: str):
    """Lê Excel/CSV sem cabeçalho, como texto, para detectar a linha certa."""
    if extensao == "xlsx":
        return pd.read_excel(
            BytesIO(conteudo), engine="openpyxl", dtype=str, header=None
        )

    if extensao == "xls":
        return pd.read_excel(
            BytesIO(conteudo), engine="xlrd", dtype=str, header=None
        )

    # CSV: detecta separador (, ou ;) e remove o BOM do Excel (utf-8-sig)
    for encoding in ("utf-8-sig", "latin1"):
        try:
            return pd.read_csv(
                BytesIO(conteudo),
                encoding=encoding,
                sep=None,
                engine="python",
                dtype=str,
                header=None,
            )
        except Exception:
            continue

    raise HTTPException(
        status_code=400, detail="Não foi possível ler o arquivo CSV."
    )


def localizar_cabecalho(df_bruto):
    """Procura nas primeiras 30 linhas a que contém todas as colunas."""
    for idx in range(min(len(df_bruto), 30)):
        valores = {
            normalizar_texto(v)
            for v in df_bruto.iloc[idx].tolist()
            if not pd.isna(v)
        }
        if all(c in valores for c in COLUNAS_OBRIGATORIAS):
            return idx

    primeiras = [
        [str(v) for v in df_bruto.iloc[i].tolist() if not pd.isna(v)]
        for i in range(min(len(df_bruto), 5))
    ]
    raise HTTPException(
        status_code=400,
        detail=(
            "Não encontrei a linha de cabeçalho com NOME, TELEFONE, REGIÃO "
            f"e CEP. Primeiras linhas lidas: {primeiras}"
        ),
    )


@router.post("/importar")
async def importar_cooperativas(arquivo: UploadFile = File(...)):
    if not arquivo.filename:
        raise HTTPException(
            status_code=400, detail="Nenhum arquivo enviado."
        )

    extensao = arquivo.filename.lower().split(".")[-1]

    if extensao not in ["xlsx", "xls", "csv"]:
        raise HTTPException(
            status_code=400, detail="Envie um arquivo Excel ou CSV."
        )

    try:
        conteudo = await arquivo.read()

        df_bruto = ler_arquivo(conteudo, extensao)

        idx_cab = localizar_cabecalho(df_bruto)

        df = df_bruto.iloc[idx_cab + 1:].copy()
        df.columns = [
            "" if pd.isna(c) else str(c) for c in df_bruto.iloc[idx_cab]
        ]
        df = df.reset_index(drop=True)

        colunas_originais = {
            normalizar_texto(col): col for col in df.columns if col
        }

        col_nome = colunas_originais["NOME"]
        col_tel = colunas_originais["TELEFONE"]
        col_reg = colunas_originais["REGIAO"]
        col_cep = colunas_originais["CEP"]

        conn = get_connection()
        inseridos = 0
        ignorados = 0
        erros = []

        try:
            with conn.cursor() as cur:
                for indice, row in df.iterrows():
                    linha = idx_cab + indice + 2

                    try:
                        nome = row[col_nome]
                        if pd.isna(nome) or not str(nome).strip():
                            continue

                        nome = str(nome).strip()
                        telefone = tratar_telefone(row[col_tel])
                        endereco, bairro, cidade = extrair_localizacao(
                            row[col_reg]
                        )
                        cep = tratar_cep(row[col_cep])

                        # VERIFICAR DUPLICAÇÃO
                        cur.execute(
                            """
                            SELECT id_cooperativa
                            FROM cooperativa
                            WHERE LOWER(TRIM(nome)) = LOWER(TRIM(%s))
                        """,
                            (nome,),
                        )

                        if cur.fetchone():
                            ignorados += 1
                            continue

                        # INSERT
                        cur.execute(
                            """
                            INSERT INTO cooperativa (
                                nome, telefone, cep, endereco, bairro, cidade, estado
                            )
                            VALUES (%s, %s, %s, %s, %s, %s, %s)
                        """,
                            (
                                nome,
                                telefone,
                                cep,
                                endereco,
                                bairro,
                                cidade,
                                "CE",
                            ),
                        )

                        # Confirma linha a linha: se uma linha falhar, o
                        # rollback abaixo não derruba as anteriores nem
                        # deixa a transação abortada para as próximas.
                        conn.commit()
                        inseridos += 1

                    except Exception as erro:
                        conn.rollback()
                        erros.append(
                            {
                                "linha": linha,
                                "nome": str(row.get(col_nome, "")),
                                "erro": str(erro),
                            }
                        )

        finally:
            conn.close()

        return {
            "msg": "Importação concluída.",
            "total_linhas": len(df),
            "inseridos": inseridos,
            "ignorados": ignorados,
            "erros": len(erros),
            "detalhes_erros": erros,
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Erro ao processar arquivo: {str(e)}"
        )


class ParceriaCreate(BaseModel):
    id_empresa: int


class CooperativaCreate(BaseModel):
    nome: str
    cnpj: Optional[str] = None
    telefone: Optional[str] = None
    cep: Optional[str] = None
    endereco: Optional[str] = None
    bairro: Optional[str] = None
    cidade: Optional[str] = None
    estado: Optional[str] = None
    capacidade_producao: Optional[int] = None
    anos_servico: Optional[int] = None
    quantidade_associados: Optional[int] = None
    parcerias: List[ParceriaCreate] = Field(default_factory=list)


class ProdutoCreate(BaseModel):
    id_cooperativa: int
    nome: str
    qualidade: int = Field(ge=1, le=5)
    unidade: str
    quantidade_vendida: float
    id_produtor: int


@router.get("")
async def listar_cooperativas():
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            cur.execute("""
                SELECT
                    c.id_cooperativa, c.nome, c.cnpj, c.telefone, c.cep,
                    c.endereco, c.bairro, c.cidade, c.estado,
                    c.capacidade_producao, c.anos_servico, c.quantidade_associados,
                    COUNT(DISTINCT p.id_empresa) AS total_parcerias,
                    COUNT(DISTINCT pc.id_produto) AS total_produtos
                FROM cooperativa c
                LEFT JOIN parceria p ON p.id_cooperativa = c.id_cooperativa
                LEFT JOIN produto_cooperativa pc ON pc.id_cooperativa = c.id_cooperativa
                GROUP BY
                    c.id_cooperativa, c.nome, c.cnpj, c.telefone, c.cep,
                    c.endereco, c.bairro, c.cidade, c.estado,
                    c.capacidade_producao, c.anos_servico, c.quantidade_associados
                ORDER BY c.id_cooperativa
            """)
            rows = cur.fetchall()

            return [
                {
                    "id_cooperativa": row[0],
                    "nome": row[1],
                    "cnpj": row[2],
                    "telefone": row[3],
                    "cep": row[4],
                    "endereco": row[5],
                    "bairro": row[6],
                    "cidade": row[7],
                    "estado": row[8],
                    "capacidade_producao": row[9],
                    "anos_servico": row[10],
                    "quantidade_associados": row[11],
                    "total_parcerias": row[12],
                    "total_produtos": row[13],
                }
                for row in rows
            ]
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Erro ao listar cooperativas: {str(e)}"
        )
    finally:
        conn.close()


@router.post("")
async def criar_cooperativa(coop: CooperativaCreate):
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            cur.execute(
                """
                INSERT INTO cooperativa (
                    nome, cnpj, telefone, cep, endereco, bairro, cidade,
                    estado, capacidade_producao, anos_servico, quantidade_associados
                )
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                RETURNING id_cooperativa
            """,
                (
                    coop.nome,
                    coop.cnpj,
                    coop.telefone,
                    coop.cep,
                    coop.endereco,
                    coop.bairro,
                    coop.cidade,
                    coop.estado,
                    coop.capacidade_producao,
                    coop.anos_servico,
                    coop.quantidade_associados,
                ),
            )

            id_cooperativa = cur.fetchone()[0]

            for parceria in coop.parcerias:
                cur.execute(
                    """
                    INSERT INTO parceria (id_empresa, id_cooperativa)
                    VALUES (%s, %s)
                """,
                    (parceria.id_empresa, id_cooperativa),
                )

            conn.commit()

            return {
                "msg": "Cooperativa cadastrada com sucesso",
                "id_cooperativa": id_cooperativa,
            }
    except Exception as e:
        conn.rollback()
        raise HTTPException(
            status_code=400, detail=f"Erro ao cadastrar cooperativa: {str(e)}"
        )
    finally:
        conn.close()


@router.get("/produtos/{id_cooperativa}")
async def listar_produtos(id_cooperativa: int):
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT
                    pc.id_produto, pc.nome, pc.qualidade, pc.unidade,
                    pc.quantidade_vendida, p.id_produtor, p.nome
                FROM produto_cooperativa pc
                INNER JOIN produtor p ON p.id_produtor = pc.id_produtor
                WHERE pc.id_cooperativa = %s
                ORDER BY pc.id_produto
            """,
                (id_cooperativa,),
            )

            rows = cur.fetchall()

            return [
                {
                    "id_produto": row[0],
                    "nome": row[1],
                    "qualidade": row[2],
                    "unidade": row[3],
                    "quantidade_vendida": float(row[4]),
                    "id_produtor": row[5],
                    "produtor": row[6],
                }
                for row in rows
            ]
    finally:
        conn.close()


@router.post("/produtos")
async def criar_produto(produto: ProdutoCreate):
    if produto.unidade not in ["kg", "litro", "unidade"]:
        raise HTTPException(
            status_code=400, detail="Unidade deve ser kg, litro ou unidade."
        )

    conn = get_connection()
    try:
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT id_cooperativa FROM cooperativa WHERE id_cooperativa = %s
            """,
                (produto.id_cooperativa,),
            )

            if not cur.fetchone():
                raise HTTPException(
                    status_code=404, detail="Cooperativa não encontrada."
                )

            cur.execute(
                """
                SELECT id_produtor FROM produtor WHERE id_produtor = %s
            """,
                (produto.id_produtor,),
            )

            if not cur.fetchone():
                raise HTTPException(
                    status_code=404, detail="Produtor não encontrado."
                )

            cur.execute(
                """
                INSERT INTO produto_cooperativa (
                    id_cooperativa, nome, qualidade, unidade, quantidade_vendida, id_produtor
                )
                VALUES (%s, %s, %s, %s, %s, %s)
                RETURNING id_produto
            """,
                (
                    produto.id_cooperativa,
                    produto.nome,
                    produto.qualidade,
                    produto.unidade,
                    produto.quantidade_vendida,
                    produto.id_produtor,
                ),
            )

            id_produto = cur.fetchone()[0]
            conn.commit()

            return {
                "msg": "Produto cadastrado com sucesso",
                "id_produto": id_produto,
            }
    except HTTPException:
        conn.rollback()
        raise
    except Exception as e:
        conn.rollback()
        raise HTTPException(
            status_code=400, detail=f"Erro ao cadastrar produto: {str(e)}"
        )
    finally:
        conn.close()