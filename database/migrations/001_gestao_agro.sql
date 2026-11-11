-- Migração incremental da gestão agro.
-- Execute no banco PostgreSQL/Neon já utilizado pela aplicação.
-- As FKs apontam para as entidades existentes: produtor, cooperativa e cliente.

CREATE TABLE IF NOT EXISTS maquina (
    id_maquina BIGSERIAL PRIMARY KEY,
    nome VARCHAR(120) NOT NULL,
    tipo VARCHAR(80) NOT NULL,
    fabricante VARCHAR(100),
    modelo VARCHAR(100),
    ano INTEGER CHECK (ano IS NULL OR ano BETWEEN 1950 AND 2100),
    status VARCHAR(30) NOT NULL DEFAULT 'Disponível',
    horas_uso NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (horas_uso >= 0),
    ultima_manutencao DATE,
    proxima_manutencao DATE,
    id_produtor INTEGER NOT NULL REFERENCES produtor(id_produtor) ON UPDATE CASCADE ON DELETE RESTRICT,
    id_cooperativa INTEGER REFERENCES cooperativa(id_cooperativa) ON UPDATE CASCADE ON DELETE SET NULL,
    criado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_maquina_produtor ON maquina(id_produtor);
CREATE INDEX IF NOT EXISTS idx_maquina_cooperativa ON maquina(id_cooperativa);

CREATE TABLE IF NOT EXISTS recebimento (
    id_recebimento BIGSERIAL PRIMARY KEY,
    descricao VARCHAR(180) NOT NULL,
    valor NUMERIC(14,2) NOT NULL CHECK (valor > 0),
    data_emissao DATE NOT NULL DEFAULT CURRENT_DATE,
    data_vencimento DATE,
    data_recebimento DATE,
    status VARCHAR(24) NOT NULL DEFAULT 'Pendente',
    forma_pagamento VARCHAR(40),
    id_produtor INTEGER REFERENCES produtor(id_produtor) ON UPDATE CASCADE ON DELETE SET NULL,
    id_cooperativa INTEGER REFERENCES cooperativa(id_cooperativa) ON UPDATE CASCADE ON DELETE SET NULL,
    id_cliente INTEGER REFERENCES cliente(id_cliente) ON UPDATE CASCADE ON DELETE SET NULL,
    criado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT ck_recebimento_status CHECK (status IN ('Pendente','Recebido','Atrasado','Cancelado'))
);
CREATE INDEX IF NOT EXISTS idx_recebimento_data ON recebimento(data_emissao);
CREATE INDEX IF NOT EXISTS idx_recebimento_cooperativa ON recebimento(id_cooperativa);
CREATE INDEX IF NOT EXISTS idx_recebimento_produtor ON recebimento(id_produtor);

CREATE TABLE IF NOT EXISTS irrigacao (
    id_irrigacao BIGSERIAL PRIMARY KEY,
    nome_area VARCHAR(120) NOT NULL,
    cultura VARCHAR(100) NOT NULL,
    area_hectares NUMERIC(12,3) NOT NULL CHECK (area_hectares > 0),
    metodo VARCHAR(80) NOT NULL,
    consumo_agua_m3 NUMERIC(14,3) NOT NULL DEFAULT 0 CHECK (consumo_agua_m3 >= 0),
    frequencia VARCHAR(80),
    status VARCHAR(24) NOT NULL DEFAULT 'Ativa',
    data_inicio DATE,
    id_produtor INTEGER NOT NULL REFERENCES produtor(id_produtor) ON UPDATE CASCADE ON DELETE RESTRICT,
    id_cooperativa INTEGER REFERENCES cooperativa(id_cooperativa) ON UPDATE CASCADE ON DELETE SET NULL,
    criado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_irrigacao_produtor ON irrigacao(id_produtor);
CREATE INDEX IF NOT EXISTS idx_irrigacao_cooperativa ON irrigacao(id_cooperativa);

CREATE TABLE IF NOT EXISTS insumo (
    id_insumo BIGSERIAL PRIMARY KEY,
    nome VARCHAR(140) NOT NULL,
    categoria VARCHAR(80) NOT NULL,
    descricao TEXT,
    unidade VARCHAR(30) NOT NULL,
    quantidade_estoque NUMERIC(14,3) NOT NULL DEFAULT 0 CHECK (quantidade_estoque >= 0),
    estoque_minimo NUMERIC(14,3) NOT NULL DEFAULT 0 CHECK (estoque_minimo >= 0),
    custo_unitario NUMERIC(14,2) NOT NULL DEFAULT 0 CHECK (custo_unitario >= 0),
    fornecedor VARCHAR(140),
    id_cooperativa INTEGER REFERENCES cooperativa(id_cooperativa) ON UPDATE CASCADE ON DELETE SET NULL,
    criado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_insumo_cooperativa ON insumo(id_cooperativa);
CREATE INDEX IF NOT EXISTS idx_insumo_nome ON insumo(nome);
