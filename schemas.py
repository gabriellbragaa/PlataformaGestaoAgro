from pydantic import BaseModel, Field, field_validator
from typing import List, Optional
from datetime import date

# -- USUARIO ---

class UsuarioCreate(BaseModel):
    nome: str
    idade: int
    telefone: str
    cpf: str
    senha: str

    senha: str = Field(..., min_length=4)

    @field_validator('senha')
    def validate_password_length(cls, v):
        if len(v.encode('utf-8')) > 72:
            raise ValueError('A senha é muito longa (máximo de 72 bytes).')
        return v

class UsuarioUpdate(BaseModel):
    nome: Optional[str] = None
    idade: Optional[int] = None
    telefone: Optional[str] = None
    cpf: Optional[str] = None
    senha: Optional[str] = None

    class Config:
        orm_mode = True

class UsuarioResponse(BaseModel):
    id: int
    nome: str
    idade: int
    telefone: str
    cpf: str
    senha: str

    class Config:
        from_attributes = True
    
# --- PRODUTOR ---

class ProdutorBase(BaseModel):
    nome: str
    endereco: str

class ProdutorCreate(ProdutorBase):
    pass

class Produtor(ProdutorBase):
    id_produtor: int

    class Config:
        orm_mode = True

# --- AGRICULTOR ---

class AgricultorCreate(BaseModel):
    nome: str
    endereco: str
    rg: str
    cpf: str
    exp_mercado: int
    data_nascimento: date
    telefone: str


# --- PRODUTO COOPERATIVA ---

class ProdutoCooperativaCreate(BaseModel):
    id_cooperativa: int
    nome: str
    tipo: str
    qualidade: str
    valor_mercado: float
    status_valor: str
    capacidade_producao: int

class ProdutoCooperativa(ProdutoCooperativaCreate):
    id_produto: int

    class Config:
        orm_mode = True


# --- PARCERIA ---

class ParceriaBase(BaseModel):
    id_empresa: int
    id_cooperativa: int

class ParceriaCreate(ParceriaBase):
    pass

class Parceria(ParceriaBase):
    id_parceria: Optional[int]

    class Config:
        orm_mode = True

# --- RESUMO PARCERIAS ---

class ResumoParcerias(BaseModel):
    empresa: str
    capacidade_producao: int
    total_parcerias: int
    produtores_relacionados: str

    class Config:
        orm_mode = True

# --- ANÁLISE RECURSOS ---

class AnaliseRecursos(BaseModel):
    id_recurso: int
    qualidade: str
    valor_mercado: float
    status_valor: str
    produtores_relacionados: int
    tipos_produtores: str

    class Config:
        orm_mode = True

# --- FUNCIONARIO ---

class FuncionarioBase(BaseModel):
    nome: str
    setor: str

class FuncionarioCreate(FuncionarioBase):
    pass

class Funcionario(FuncionarioBase):
    id_func: int

    class Config:
        orm_mode = True

# --- EMPRESA ---

class EmpresaBase(BaseModel):
    cnpj: str
    nome_fantasia: str
    tempo_atuacao: int

class EmpresaCreate(EmpresaBase):
    pass

class Empresa(EmpresaBase):
    id_empresa: int

    class Config:
        orm_mode = True
