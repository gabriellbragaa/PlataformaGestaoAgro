from pydantic import BaseModel
from typing import Optional
from datetime import date


# ============================================================
# PRODUTOR
# ============================================================

class ProdutorCreate(BaseModel):
    nome: str
    endereco: Optional[str] = None
    tipo: str


class Produtor(BaseModel):
    id_produtor: int
    nome: str
    endereco: Optional[str] = None
    tipo: str


class ProdutorUpdate(BaseModel):
    nome: Optional[str] = None
    endereco: Optional[str] = None
    tipo: Optional[str] = None


from pydantic import BaseModel
from typing import Optional
from datetime import date


class AgricultorCreate(BaseModel):
    id_produtor: int
    rg: str
    exp_mercado: int
    data_nascimento: date


class AgricultorUpdate(BaseModel):
    rg: Optional[str] = None
    exp_mercado: Optional[int] = None
    data_nascimento: Optional[date] = None


class Agricultor(BaseModel):
    id_produtor: int
    nome: str
    rg: str
    exp_mercado: int
    data_nascimento: date


# ============================================================
# PECUARISTA
# ============================================================

class Pecuarista(BaseModel):
    id_produtor: int
    nome: str
    rg: str
    endereco: Optional[str] = None
    cnpj: Optional[str] = None
    qualidade_produto: str


class PecuaristaUpdate(BaseModel):
    nome: Optional[str] = None
    rg: Optional[str] = None
    endereco: Optional[str] = None
    cnpj: Optional[str] = None
    qualidade_produto: Optional[str] = None


# ============================================================
# PARCERIA
# ============================================================

class Parceria(BaseModel):
    id_empresa: int
    id_cooperativa: int


class ParceriaUpdate(BaseModel):
    id_empresa: Optional[int] = None
    id_cooperativa: Optional[int] = None


# ============================================================
# FUNCIONÁRIO
# ============================================================
class Funcionario(BaseModel):
    id_func: Optional[int] = None
    id_associado: int
    endereco: Optional[str] = None
    setor: str


class FuncionarioUpdate(BaseModel):
    id_associado: Optional[int] = None
    endereco: Optional[str] = None
    setor: Optional[str] = None


# ============================================================
# RECURSO
# ============================================================

from pydantic import BaseModel, Field
from typing import Optional
from datetime import date, time, datetime


class Recurso(BaseModel):
    id_recurso: Optional[int] = None

    tipo_recurso: str
    categoria: str
    nome: str
    descricao: Optional[str] = None

    id_produtor: int
    id_cooperativa: Optional[int] = None

    quantidade: float
    unidade: str
    valor: float

    status: str = "Disponível"

    cidade: Optional[str] = None
    estado: Optional[str] = None
    endereco: Optional[str] = None

    ano: Optional[int] = None

    data_producao: Optional[date] = None
    horario_producao: Optional[time] = None

    qualidade: Optional[int] = Field(
        default=None,
        ge=1,
        le=5
    )

    data_venda: Optional[datetime] = None


class RecursoUpdate(BaseModel):

    tipo_recurso: Optional[str] = None
    categoria: Optional[str] = None
    nome: Optional[str] = None
    descricao: Optional[str] = None

    id_produtor: Optional[int] = None
    id_cooperativa: Optional[int] = None

    quantidade: Optional[float] = None
    unidade: Optional[str] = None
    valor: Optional[float] = None

    status: Optional[str] = None

    cidade: Optional[str] = None
    estado: Optional[str] = None
    endereco: Optional[str] = None

    ano: Optional[int] = None

    data_producao: Optional[date] = None
    horario_producao: Optional[time] = None

    qualidade: Optional[int] = Field(
        default=None,
        ge=1,
        le=5
    )

# ============================================================
# CLIENTE
# ============================================================

class Cliente(BaseModel):
    id_cliente: int
    nome: str
    cnpj: Optional[str] = None
    telefone: Optional[str] = None
    endereco: Optional[str] = None


class ClienteUpdate(BaseModel):
    nome: Optional[str] = None
    cnpj: Optional[str] = None
    telefone: Optional[str] = None
    endereco: Optional[str] = None


# ============================================================
# ADMINISTRADOR
# ============================================================

from pydantic import BaseModel
from typing import Optional


class Administrador(BaseModel):
    id_admin: Optional[int] = None
    nome: str
    rg: Optional[str] = None
    id_associado: int


class AdministradorUpdate(BaseModel):
    nome: Optional[str] = None
    rg: Optional[str] = None
    id_associado: Optional[int] = None

# ============================================================
# COOPERATIVA
# ============================================================

class CooperativaCompletaCreate(BaseModel):
    id_cooperativa: int
    telefone: Optional[str] = None
    capacidade_producao: Optional[int] = None


# ============================================================
# EMPRESA
# ============================================================

class Empresa(BaseModel):
    id_empresa: int
    cnpj: str
    nome_fantasia: Optional[str] = None
    tempo_atuacao: Optional[int] = None


class EmpresaUpdate(BaseModel):
    cnpj: Optional[str] = None
    nome_fantasia: Optional[str] = None
    tempo_atuacao: Optional[int] = None


from pydantic import BaseModel
from typing import Optional, List


class Parceria(BaseModel):
    id_empresa: int


class CooperativaCompletaCreate(BaseModel):
    nome: str
    cnpj: str
    telefone: Optional[str] = None
    cep: Optional[str] = None
    endereco: Optional[str] = None
    bairro: Optional[str] = None
    cidade: Optional[str] = None
    estado: Optional[str] = None
    anos_servico: Optional[int] = None
    quantidade_associados: Optional[int] = None
    capacidade_producao: Optional[int] = None
    parcerias: List[Parceria] = []

from pydantic import BaseModel, Field
from typing import Optional


class ProdutoCooperativaCreate(BaseModel):
    id_cooperativa: int
    id_produtor: int

    nome_produto: str = Field(
        min_length=1,
        max_length=150
    )

    qualidade: int = Field(
        ge=1,
        le=5
    )

    quantidade_vendida: float = Field(
        ge=0
    )

    unidade: str


class ProdutoCooperativaUpdate(BaseModel):
    id_produtor: Optional[int] = None

    nome_produto: Optional[str] = Field(
        default=None,
        min_length=1,
        max_length=150
    )

    qualidade: Optional[int] = Field(
        default=None,
        ge=1,
        le=5
    )

    quantidade_vendida: Optional[float] = Field(
        default=None,
        ge=0
    )

    unidade: Optional[str] = None

# ============================================================
# ASSOCIADO
# ============================================================

class AssociadoCreate(BaseModel):
    id_produtor: int
    id_cooperativa: int
    data_associacao: Optional[date] = None
    status: Optional[str] = "Ativo"


class AssociadoUpdate(BaseModel):
    id_produtor: Optional[int] = None
    id_cooperativa: Optional[int] = None
    data_associacao: Optional[date] = None
    status: Optional[str] = None