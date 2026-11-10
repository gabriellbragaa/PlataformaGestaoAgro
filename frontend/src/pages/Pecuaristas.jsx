
import React, { useEffect, useState } from 'react';
import "./Pecuarista.css";

import {
    Plus,
    Search,
    Trash2,
    X,
    Truck,
    Activity,
    Database,
    RefreshCw
} from 'lucide-react';

import api, {
    pecuaristaAPI,
    produtorAPI
} from '../services/api';

// =====================================================
// CONSTANTES E ESTILOS
// =====================================================

const FORM_VAZIO = {
    id_produtor: '',
    nome: '',
    rg: '',
    endereco: '',
    cnpj: '',
    qualidade_produto: ''
};

const inputStyle = {
    width: '100%',
    padding: '0.7rem',
    marginTop: '5px',
    border: '1px solid #ddd',
    borderRadius: '6px',
    boxSizing: 'border-box'
};

const overlayStyle = {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000
};

const iconButtonStyle = {
    border: 'none',
    background: 'transparent',
    cursor: 'pointer'
};

// =====================================================
// FUNÇÕES AUXILIARES
// =====================================================

function extrairMensagem(error, padrao) {
    const detail = error?.response?.data?.detail;

    if (typeof detail === 'string') {
        return detail;
    }

    if (Array.isArray(detail)) {
        return detail
            .map((item) => {
                const campo = (item.loc || [])
                    .slice(1)
                    .join('.');

                return campo
                    ? `${campo}: ${item.msg}`
                    : item.msg;
            })
            .join('\n');
    }

    return padrao;
}

function mascararCNPJ(valor) {
    const digitos = String(valor)
        .replace(/\D/g, '')
        .slice(0, 14);

    return digitos
        .replace(/^(\d{2})(\d)/, '$1.$2')
        .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
        .replace(/\.(\d{3})(\d)/, '.$1/$2')
        .replace(/(\d{4})(\d)/, '$1-$2');
}

function extrairLista(data) {
    if (Array.isArray(data)) {
        return data;
    }

    if (Array.isArray(data?.dados)) {
        return data.dados;
    }

    if (Array.isArray(data?.items)) {
        return data.items;
    }

    if (Array.isArray(data?.transacoes)) {
        return data.transacoes;
    }

    if (Array.isArray(data?.resultados)) {
        return data.resultados;
    }

    if (Array.isArray(data?.data)) {
        return data.data;
    }

    return [];
}

function formatarValor(valor) {
    if (valor === null || valor === undefined || valor === '') {
        return '-';
    }

    if (typeof valor === 'object') {
        return JSON.stringify(valor);
    }

    return String(valor);
}

// =====================================================
// COMPONENTE PRINCIPAL
// =====================================================

export default function Pecuaristas() {
    // -------------------------------------------------
    // ESTADOS DO CADASTRO LOCAL
    // -------------------------------------------------

    const [pecuaristas, setPecuaristas] = useState([]);
    const [produtores, setProdutores] = useState([]);

    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);
    const [erro, setErro] = useState(null);

    const [modalCadastro, setModalCadastro] = useState(false);
    const [salvando, setSalvando] = useState(false);
    const [form, setForm] = useState(FORM_VAZIO);

    // -------------------------------------------------
    // ESTADOS DA FERRAMENTA BOVTRACE
    // Independentes do cadastro local
    // -------------------------------------------------

    const [aba, setAba] = useState('cadastro');

    const [tipoConsulta, setTipoConsulta] = useState('transacoes');
    const [dadosBovTrace, setDadosBovTrace] = useState([]);
    const [loadingBovTrace, setLoadingBovTrace] = useState(false);
    const [erroBovTrace, setErroBovTrace] = useState(null);
    const [consultaRealizada, setConsultaRealizada] = useState(false);

    const [pagina, setPagina] = useState(1);

    // =====================================================
    // 1. CADASTRO: CARREGAR PRODUTORES E PECUARISTAS
    // =====================================================

    async function carregarDados() {
        try {
            setLoading(true);
            setErro(null);

            const [resPecuaristas, resProdutores] =
                await Promise.all([
                    pecuaristaAPI.listar(),
                    produtorAPI.listar()
                ]);

            setPecuaristas(
                Array.isArray(resPecuaristas.data)
                    ? resPecuaristas.data
                    : []
            );

            setProdutores(
                Array.isArray(resProdutores.data)
                    ? resProdutores.data
                    : []
            );
        } catch (error) {
            console.error('Erro ao carregar cadastro:', error);

            setErro(
                extrairMensagem(
                    error,
                    'Não foi possível carregar os dados do cadastro.'
                )
            );
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        carregarDados();
    }, []);

    // =====================================================
    // 1. CADASTRO: FORMULÁRIO
    // =====================================================

    function handleChange(event) {
        const { name, value } = event.target;

        setForm((anterior) => ({
            ...anterior,
            [name]:
                name === 'cnpj'
                    ? mascararCNPJ(value)
                    : value
        }));
    }

    function selecionarProdutor(event) {
        const id = event.target.value;

        const produtor = produtores.find(
            (item) =>
                Number(item.id_produtor) === Number(id)
        );

        setForm((anterior) => ({
            ...anterior,
            id_produtor: id,
            nome: produtor?.nome || ''
        }));
    }

    function abrirCadastro() {
        setForm(FORM_VAZIO);
        setModalCadastro(true);
    }

    function fecharCadastro() {
        if (salvando) return;

        setModalCadastro(false);
    }

    // =====================================================
    // 1. CADASTRO: CRIAR PECUARISTA
    // POST /pecuarista
    // =====================================================

    async function adicionarPecuarista(event) {
        event.preventDefault();

        if (salvando) return;

        if (!form.id_produtor) {
            alert('Selecione um produtor.');
            return;
        }

        if (!form.nome.trim() || !form.rg.trim()) {
            alert('Informe o nome e o RG do pecuarista.');
            return;
        }

        if (!form.qualidade_produto.trim()) {
            alert('Informe a qualidade do produto.');
            return;
        }

        const cnpj = form.cnpj.replace(/\D/g, '');

        if (cnpj && cnpj.length !== 14) {
            alert(
                'O CNPJ deve conter 14 dígitos ou ficar vazio.'
            );
            return;
        }

        const dados = {
            id_produtor: Number(form.id_produtor),
            nome: form.nome.trim(),
            rg: form.rg.trim(),
            endereco: form.endereco.trim() || null,
            cnpj: cnpj || null,
            qualidade_produto: form.qualidade_produto.trim()
        };

        try {
            setSalvando(true);

            await pecuaristaAPI.criar(dados);

            alert('Pecuarista cadastrado com sucesso!');

            setModalCadastro(false);
            setForm(FORM_VAZIO);

            await carregarDados();
        } catch (error) {
            console.error('Erro ao cadastrar pecuarista:', error);

            alert(
                extrairMensagem(
                    error,
                    'Não foi possível cadastrar o pecuarista.'
                )
            );
        } finally {
            setSalvando(false);
        }
    }

    // =====================================================
    // 1. CADASTRO: EXCLUIR PECUARISTA
    // DELETE /pecuarista/{id_produtor}
    // =====================================================

    async function excluirPecuarista(idProdutor) {
        const confirmar = window.confirm(
            'Deseja excluir os dados específicos deste pecuarista?'
        );

        if (!confirmar) return;

        try {
            await pecuaristaAPI.excluir(idProdutor);

            alert('Dados do pecuarista excluídos com sucesso!');

            await carregarDados();
        } catch (error) {
            console.error('Erro ao excluir pecuarista:', error);

            alert(
                extrairMensagem(
                    error,
                    'Não foi possível excluir o pecuarista.'
                )
            );
        }
    }

    // =====================================================
    // 2. BOVTRACE: CONSULTAR DADOS
    //
    // O cadastro não é enviado nem alterado aqui.
    // A chamada passa pelo backend do projeto para que
    // credenciais da Embrapa não fiquem no navegador.
    //
    // O backend precisa disponibilizar estas rotas:
    // GET /bovtrace/transacoes
    // GET /bovtrace/protocolos
    // GET /bovtrace/racas
    // =====================================================

    async function consultarBovTrace() {
        setLoadingBovTrace(true);
        setErroBovTrace(null);
        setDadosBovTrace([]);
        setConsultaRealizada(false);

        try {
            let resposta;

            if (tipoConsulta === 'transacoes') {
                resposta = await api.get(
                    '/bovtrace/transacoes',
                    {
                        params: { pagina }
                    }
                );
            } else if (tipoConsulta === 'protocolos') {
                resposta = await api.get(
                    '/bovtrace/protocolos'
                );
            } else if (tipoConsulta === 'racas') {
                resposta = await api.get(
                    '/bovtrace/racas'
                );
            } else {
                throw new Error('Tipo de consulta inválido.');
            }

            const lista = extrairLista(resposta.data);

            // Alguns endpoints podem devolver um único objeto
            // ou uma resposta sem lista.
            if (
                lista.length === 0 &&
                resposta.data &&
                typeof resposta.data === 'object' &&
                !Array.isArray(resposta.data) &&
                Object.keys(resposta.data).length > 0
            ) {
                setDadosBovTrace([resposta.data]);
            } else {
                setDadosBovTrace(lista);
            }

            setConsultaRealizada(true);
        } catch (error) {
            console.error('Erro na consulta BovTrace:', error);

            setErroBovTrace(
                extrairMensagem(
                    error,
                    'Não foi possível consultar a Embrapa BovTrace. ' +
                    'Verifique se as rotas estão implementadas no backend ' +
                    'e se a autenticação da API está configurada.'
                )
            );
        } finally {
            setLoadingBovTrace(false);
        }
    }

    function mudarTipoConsulta(event) {
        setTipoConsulta(event.target.value);
        setDadosBovTrace([]);
        setErroBovTrace(null);
        setConsultaRealizada(false);
        setPagina(1);
    }

    // =====================================================
    // FILTROS DO CADASTRO
    // =====================================================

    const produtoresDisponiveis = produtores.filter(
        (produtor) =>
            String(produtor.tipo || '').toLowerCase() === 'pecuarista' &&
            !pecuaristas.some(
                (item) =>
                    Number(item.id_produtor) ===
                    Number(produtor.id_produtor)
            )
    );

    const pecuaristasFiltrados = pecuaristas.filter(
        (pecuarista) => {
            const texto = search.toLowerCase();

            return [
                pecuarista.id_produtor,
                pecuarista.nome,
                pecuarista.rg,
                pecuarista.endereco,
                pecuarista.cnpj,
                pecuarista.qualidade_produto
            ].some((campo) =>
                String(campo ?? '')
                    .toLowerCase()
                    .includes(texto)
            );
        }
    );

    // =====================================================
    // INTERFACE
    // =====================================================

    return (
        <div className="pecuaristas-page">
            {/* CABEÇALHO */}
            <div className="page-header">
                <div>
                    <h2>Pecuaristas</h2>

                    <p>
                        Gerencie os pecuaristas e consulte informações
                        complementares sobre bovinos.
                    </p>
                </div>
            </div>

            {/* ABAS INDEPENDENTES */}
            <div
                style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '10px',
                    marginBottom: '1.5rem'
                }}
            >
                <button
                    type="button"
                    onClick={() => setAba('cadastro')}
                    className={
                        aba === 'cadastro'
                            ? 'btn-primary'
                            : ''
                    }
                    style={{
                        padding: '0.7rem 1rem',
                        borderRadius: '6px',
                        border: '1px solid #ddd',
                        cursor: 'pointer',
                        background:
                            aba === 'cadastro'
                                ? undefined
                                : '#fff',
                        color:
                            aba === 'cadastro'
                                ? undefined
                                : '#333'
                    }}
                >
                    <Database
                        size={17}
                        style={{
                            verticalAlign: 'middle',
                            marginRight: '6px'
                        }}
                    />
                    Cadastro de pecuaristas
                </button>

                <button
                    type="button"
                    onClick={() => setAba('bovtrace')}
                    className={
                        aba === 'bovtrace'
                            ? 'btn-primary'
                            : ''
                    }
                    style={{
                        padding: '0.7rem 1rem',
                        borderRadius: '6px',
                        border: '1px solid #ddd',
                        cursor: 'pointer',
                        background:
                            aba === 'bovtrace'
                                ? undefined
                                : '#fff',
                        color:
                            aba === 'bovtrace'
                                ? undefined
                                : '#333'
                    }}
                >
                    <Truck
                        size={17}
                        style={{
                            verticalAlign: 'middle',
                            marginRight: '6px'
                        }}
                    />
                    Informações BovTrace
                </button>
            </div>

            {/* =================================================
                ABA 1: CADASTRO LOCAL
            ================================================= */}
            {aba === 'cadastro' && (
                <section>
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            flexWrap: 'wrap',
                            gap: '12px',
                            marginBottom: '1.5rem'
                        }}
                    >
                        <div>
                            <h3>Cadastro de pecuaristas</h3>

                            <p>
                                Os dados são salvos no banco de dados
                                do AgroLinker, sem depender da Embrapa.
                            </p>
                        </div>

                        <button
                            type="button"
                            className="btn-primary"
                            onClick={abrirCadastro}
                        >
                            <Plus size={18} />
                            Adicionar pecuarista
                        </button>
                    </div>

                    {/* PESQUISA */}
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            marginBottom: '1.5rem'
                        }}
                    >
                        <Search size={20} />

                        <input
                            type="text"
                            placeholder="Buscar pecuarista..."
                            value={search}
                            onChange={(event) =>
                                setSearch(event.target.value)
                            }
                            style={{
                                padding: '0.6rem 1rem',
                                border: '1px solid #ccc',
                                borderRadius: '6px',
                                width: '300px',
                                maxWidth: '100%'
                            }}
                        />
                    </div>

                    {loading && (
                        <p>Carregando cadastro...</p>
                    )}

                    {erro && (
                        <div
                            style={{
                                padding: '1rem',
                                background: '#fee2e2',
                                color: '#991b1b',
                                borderRadius: '8px',
                                marginBottom: '1rem',
                                whiteSpace: 'pre-line'
                            }}
                        >
                            {erro}

                            <div style={{ marginTop: '10px' }}>
                                <button
                                    type="button"
                                    onClick={carregarDados}
                                >
                                    Tentar novamente
                                </button>
                            </div>
                        </div>
                    )}

                    {!loading && !erro && (
                        <div className="table-container">
                            <table className="custom-table">
                                <thead>
                                    <tr>
                                        <th>ID Produtor</th>
                                        <th>Nome</th>
                                        <th>RG</th>
                                        <th>Endereço</th>
                                        <th>CNPJ</th>
                                        <th>Qualidade</th>
                                        <th>Ações</th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {pecuaristasFiltrados.length > 0 ? (
                                        pecuaristasFiltrados.map(
                                            (pecuarista) => (
                                                <tr
                                                    key={
                                                        pecuarista.id_produtor
                                                    }
                                                >
                                                    <td>
                                                        {pecuarista.id_produtor}
                                                    </td>

                                                    <td>
                                                        {pecuarista.nome || '-'}
                                                    </td>

                                                    <td>
                                                        {pecuarista.rg || '-'}
                                                    </td>

                                                    <td>
                                                        {pecuarista.endereco || '-'}
                                                    </td>

                                                    <td>
                                                        {pecuarista.cnpj || '-'}
                                                    </td>

                                                    <td>
                                                        {pecuarista.qualidade_produto || '-'}
                                                    </td>

                                                    <td>
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                setAba('bovtrace')
                                                            }
                                                            style={{
                                                                ...iconButtonStyle,
                                                                color: '#15803d',
                                                                marginRight: '8px'
                                                            }}
                                                            title="Abrir informações BovTrace"
                                                            aria-label="Abrir BovTrace"
                                                        >
                                                            <Truck size={18} />
                                                        </button>

                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                excluirPecuarista(
                                                                    pecuarista.id_produtor
                                                                )
                                                            }
                                                            style={{
                                                                ...iconButtonStyle,
                                                                color: '#dc2626'
                                                            }}
                                                            title="Excluir cadastro"
                                                            aria-label="Excluir pecuarista"
                                                        >
                                                            <Trash2 size={18} />
                                                        </button>
                                                    </td>
                                                </tr>
                                            )
                                        )
                                    ) : (
                                        <tr>
                                            <td
                                                colSpan="7"
                                                style={{
                                                    textAlign: 'center',
                                                    padding: '2rem'
                                                }}
                                            >
                                                Nenhum pecuarista encontrado.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </section>
            )}

            {/* =================================================
                ABA 2: FERRAMENTAS BOVTRACE
            ================================================= */}
            {aba === 'bovtrace' && (
                <section>
                    <div
                        style={{
                            padding: '1.25rem',
                            border: '1px solid #e5e7eb',
                            borderRadius: '10px',
                            marginBottom: '1.5rem'
                        }}
                    >
                        <div
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '10px',
                                marginBottom: '10px'
                            }}
                        >
                            <Activity size={24} color="#15803d" />

                            <div>
                                <h3 style={{ margin: 0 }}>
                                    Embrapa BovTrace
                                </h3>

                                <small style={{ color: '#666' }}>
                                    Ferramenta complementar de consulta
                                </small>
                            </div>
                        </div>

                        <p>
                            Consulte os dados disponibilizados pela API
                            BovTrace sem alterar os cadastros do AgroLinker.
                        </p>

                        <p style={{ color: '#666', fontSize: '0.9rem' }}>
                            A documentação consultada descreve consultas
                            de transações, trânsitos, protocolos e raças.
                            Ela não confirma um endpoint de preços de mercado.
                        </p>
                    </div>

                    {/* SELETOR DE CONSULTA */}
                    <div
                        style={{
                            display: 'flex',
                            flexWrap: 'wrap',
                            gap: '12px',
                            alignItems: 'end',
                            marginBottom: '1.5rem'
                        }}
                    >
                        <div style={{ minWidth: '220px' }}>
                            <label htmlFor="tipoConsulta">
                                Tipo de informação
                            </label>

                            <select
                                id="tipoConsulta"
                                value={tipoConsulta}
                                onChange={mudarTipoConsulta}
                                style={{
                                    ...inputStyle,
                                    background: '#fff'
                                }}
                            >
                                <option value="transacoes">
                                    Transações / movimentações
                                </option>

                                <option value="protocolos">
                                    Protocolos disponíveis
                                </option>

                                <option value="racas">
                                    Raças de bovinos
                                </option>
                            </select>
                        </div>

                        {tipoConsulta === 'transacoes' && (
                            <div style={{ minWidth: '120px' }}>
                                <label htmlFor="pagina">
                                    Página
                                </label>

                                <input
                                    id="pagina"
                                    type="number"
                                    min="1"
                                    value={pagina}
                                    onChange={(event) =>
                                        setPagina(
                                            Math.max(
                                                1,
                                                Number(event.target.value) || 1
                                            )
                                        )
                                    }
                                    style={inputStyle}
                                />
                            </div>
                        )}

                        <button
                            type="button"
                            className="btn-primary"
                            onClick={consultarBovTrace}
                            disabled={loadingBovTrace}
                            style={{
                                padding: '0.75rem 1rem',
                                borderRadius: '6px',
                                opacity: loadingBovTrace ? 0.7 : 1
                            }}
                        >
                            {loadingBovTrace ? (
                                <>
                                    <RefreshCw
                                        size={17}
                                        style={{
                                            verticalAlign: 'middle',
                                            marginRight: '6px'
                                        }}
                                    />
                                    Consultando...
                                </>
                            ) : (
                                <>
                                    <Search
                                        size={17}
                                        style={{
                                            verticalAlign: 'middle',
                                            marginRight: '6px'
                                        }}
                                    />
                                    Consultar Embrapa
                                </>
                            )}
                        </button>
                    </div>

                    {/* ERRO BOVTRACE: NÃO AFETA O CADASTRO */}
                    {erroBovTrace && (
                        <div
                            style={{
                                padding: '1rem',
                                background: '#fee2e2',
                                color: '#991b1b',
                                borderRadius: '8px',
                                marginBottom: '1rem',
                                whiteSpace: 'pre-line'
                            }}
                        >
                            <strong>Falha na consulta BovTrace</strong>

                            <p>{erroBovTrace}</p>

                            <small>
                                Essa falha afeta somente a consulta externa,
                                não o cadastro de pecuaristas.
                            </small>
                        </div>
                    )}

                    {loadingBovTrace && (
                        <p>Carregando informações da Embrapa...</p>
                    )}

                    {/* RESULTADOS */}
                    {!loadingBovTrace &&
                        consultaRealizada &&
                        dadosBovTrace.length === 0 &&
                        !erroBovTrace && (
                            <div
                                style={{
                                    padding: '1.5rem',
                                    border: '1px solid #e5e7eb',
                                    borderRadius: '8px'
                                }}
                            >
                                Nenhum registro foi retornado nesta consulta.
                            </div>
                        )}

                    {!loadingBovTrace &&
                        dadosBovTrace.length > 0 && (
                            <div
                                style={{
                                    marginTop: '1rem'
                                }}
                            >
                                <h3>
                                    Resultados da consulta
                                </h3>

                                <p style={{ color: '#666' }}>
                                    Registros retornados: {dadosBovTrace.length}
                                </p>

                                <div className="table-container">
                                    <table className="custom-table">
                                        <thead>
                                            <tr>
                                                <th>Informação</th>
                                                <th>Valor retornado pela API</th>
                                            </tr>
                                        </thead>

                                        <tbody>
                                            {dadosBovTrace.map(
                                                (registro, index) => (
                                                    <React.Fragment
                                                        key={
                                                            registro.token ??
                                                            registro.codigo ??
                                                            index
                                                        }
                                                    >
                                                        {Object.entries(
                                                            registro
                                                        ).map(
                                                            ([campo, valor]) => (
                                                                <tr key={campo + index}>
                                                                    <td>
                                                                        {campo}
                                                                    </td>

                                                                    <td
                                                                        style={{
                                                                            overflowWrap: 'anywhere'
                                                                        }}
                                                                    >
                                                                        {formatarValor(
                                                                            valor
                                                                        )}
                                                                    </td>
                                                                </tr>
                                                            )
                                                        )}
                                                    </React.Fragment>
                                                )
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                    {!consultaRealizada &&
                        !loadingBovTrace &&
                        !erroBovTrace && (
                            <div
                                style={{
                                    padding: '1.5rem',
                                    background: '#f9fafb',
                                    borderRadius: '8px',
                                    color: '#555'
                                }}
                            >
                                Selecione o tipo de informação e clique
                                em "Consultar Embrapa" para visualizar
                                os resultados.
                            </div>
                        )}
                </section>
            )}

            {/* =================================================
                MODAL: CADASTRO LOCAL
            ================================================= */}
            {modalCadastro && (
                <div style={overlayStyle}>
                    <div
                        style={{
                            background: '#fff',
                            padding: '2rem',
                            borderRadius: '12px',
                            width: '90%',
                            maxWidth: '600px',
                            maxHeight: '90vh',
                            overflowY: 'auto'
                        }}
                    >
                        <div
                            style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                marginBottom: '1.5rem'
                            }}
                        >
                            <div>
                                <h2>Cadastro de Pecuarista</h2>

                                <p style={{ color: '#666' }}>
                                    Informe os dados locais do produtor.
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={fecharCadastro}
                                disabled={salvando}
                                style={iconButtonStyle}
                                aria-label="Fechar"
                            >
                                <X size={24} />
                            </button>
                        </div>

                        <form onSubmit={adicionarPecuarista}>
                            <div style={{ marginBottom: '1rem' }}>
                                <label htmlFor="id_produtor">
                                    Produtor
                                </label>

                                <select
                                    id="id_produtor"
                                    name="id_produtor"
                                    value={form.id_produtor}
                                    onChange={selecionarProdutor}
                                    required
                                    style={{
                                        ...inputStyle,
                                        background: '#fff'
                                    }}
                                >
                                    <option value="">
                                        {produtoresDisponiveis.length > 0
                                            ? 'Selecione um produtor'
                                            : 'Nenhum produtor disponível'}
                                    </option>

                                    {produtoresDisponiveis.map((produtor) => (
                                        <option
                                            key={produtor.id_produtor}
                                            value={produtor.id_produtor}
                                        >
                                            {produtor.nome} — ID{' '}
                                            {produtor.id_produtor}
                                        </option>
                                    ))}
                                </select>

                                {produtoresDisponiveis.length === 0 && (
                                    <small style={{ color: '#666' }}>
                                        Cadastre primeiro um produtor do tipo
                                        pecuarista na seção Produtores.
                                    </small>
                                )}
                            </div>

                            <div style={{ marginBottom: '1rem' }}>
                                <label htmlFor="nome">Nome</label>

                                <input
                                    id="nome"
                                    name="nome"
                                    value={form.nome}
                                    onChange={handleChange}
                                    required
                                    style={inputStyle}
                                    placeholder="Nome do pecuarista"
                                />
                            </div>

                            <div style={{ marginBottom: '1rem' }}>
                                <label htmlFor="rg">RG</label>

                                <input
                                    id="rg"
                                    name="rg"
                                    value={form.rg}
                                    onChange={handleChange}
                                    required
                                    style={inputStyle}
                                    placeholder="Digite o RG"
                                />
                            </div>

                            <div style={{ marginBottom: '1rem' }}>
                                <label htmlFor="endereco">
                                    Endereço
                                </label>

                                <input
                                    id="endereco"
                                    name="endereco"
                                    value={form.endereco}
                                    onChange={handleChange}
                                    style={inputStyle}
                                    placeholder="Digite o endereço"
                                />
                            </div>

                            <div style={{ marginBottom: '1rem' }}>
                                <label htmlFor="cnpj">
                                    CNPJ (opcional)
                                </label>

                                <input
                                    id="cnpj"
                                    name="cnpj"
                                    value={form.cnpj}
                                    onChange={handleChange}
                                    maxLength={18}
                                    inputMode="numeric"
                                    style={inputStyle}
                                    placeholder="00.000.000/0000-00"
                                />

                                <small style={{ color: '#666' }}>
                                    Este campo não é usado para salvar
                                    informações na Embrapa.
                                </small>
                            </div>

                            <div style={{ marginBottom: '1rem' }}>
                                <label htmlFor="qualidade_produto">
                                    Qualidade do Produto
                                </label>

                                <input
                                    id="qualidade_produto"
                                    name="qualidade_produto"
                                    value={form.qualidade_produto}
                                    onChange={handleChange}
                                    required
                                    style={inputStyle}
                                    placeholder="Ex.: Alta, Média ou Baixa"
                                />
                            </div>

                            <div
                                style={{
                                    display: 'flex',
                                    justifyContent: 'flex-end',
                                    gap: '10px',
                                    marginTop: '1.5rem'
                                }}
                            >
                                <button
                                    type="button"
                                    onClick={fecharCadastro}
                                    disabled={salvando}
                                    style={{
                                        padding: '0.7rem 1.2rem',
                                        border: '1px solid #ccc',
                                        background: '#fff',
                                        borderRadius: '6px'
                                    }}
                                >
                                    Cancelar
                                </button>

                                <button
                                    type="submit"
                                    className="btn-primary"
                                    disabled={
                                        salvando ||
                                        produtoresDisponiveis.length === 0
                                    }
                                >
                                    {salvando ? 'Salvando...' : 'Salvar'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
