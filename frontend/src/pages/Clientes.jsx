
import React, { useEffect, useState } from 'react';
import {
    Plus,
    UserRound,
    Search,
    X,
    Save,
    RefreshCw
} from 'lucide-react';

import { clienteAPI } from '../services/api';

function Clientes() {
    const [clientes, setClientes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [salvando, setSalvando] = useState(false);
    const [erro, setErro] = useState(null);
    const [mensagem, setMensagem] = useState('');

    const [modalAberto, setModalAberto] = useState(false);

    const [busca, setBusca] = useState('');

    const [form, setForm] = useState({
        id_cliente: '',
        nome: '',
        cnpj: '',
        telefone: '',
        endereco: ''
    });

    // =========================================================
    // CARREGAR CLIENTES
    // =========================================================

    async function carregarClientes() {
        try {
            setLoading(true);
            setErro(null);

            const response = await clienteAPI.listar();

            setClientes(
                Array.isArray(response.data)
                    ? response.data
                    : []
            );

        } catch (error) {
            console.error('Erro ao carregar clientes:', error);

            setErro(
                error.response?.data?.detail ||
                'Não foi possível carregar os clientes.'
            );

            setClientes([]);

        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        carregarClientes();
    }, []);

    // =========================================================
    // ALTERAR FORMULÁRIO
    // =========================================================

    function handleChange(e) {
        const { name, value } = e.target;

        setForm((prev) => ({
            ...prev,
            [name]: value
        }));
    }

    // =========================================================
    // ABRIR MODAL
    // =========================================================

    function abrirCadastro() {
        setForm({
            id_cliente: '',
            nome: '',
            cnpj: '',
            telefone: '',
            endereco: ''
        });

        setErro(null);
        setMensagem('');
        setModalAberto(true);
    }

    // =========================================================
    // FECHAR MODAL
    // =========================================================

    function fecharModal() {
        if (salvando) return;

        setModalAberto(false);

        setForm({
            id_cliente: '',
            nome: '',
            cnpj: '',
            telefone: '',
            endereco: ''
        });
    }

    // =========================================================
    // CADASTRAR CLIENTE
    // =========================================================

    async function cadastrarCliente(e) {
        e.preventDefault();

        setErro(null);
        setMensagem('');

        if (!form.id_cliente) {
            setErro('Informe o ID do cliente.');
            return;
        }

        if (!form.nome.trim()) {
            setErro('Informe o nome ou razão social.');
            return;
        }

        try {
            setSalvando(true);

            await clienteAPI.criar({
                id_cliente: Number(form.id_cliente),
                nome: form.nome.trim(),
                cnpj: form.cnpj.trim() || null,
                telefone: form.telefone.trim() || null,
                endereco: form.endereco.trim() || null
            });

            setMensagem('Cliente cadastrado com sucesso!');

            // Atualiza a lista com os dados reais do banco
            await carregarClientes();

            setTimeout(() => {
                setModalAberto(false);

                setForm({
                    id_cliente: '',
                    nome: '',
                    cnpj: '',
                    telefone: '',
                    endereco: ''
                });

                setMensagem('');
            }, 800);

        } catch (error) {
            console.error('Erro ao cadastrar cliente:', error);

            setErro(
                error.response?.data?.detail ||
                'Não foi possível cadastrar o cliente.'
            );

        } finally {
            setSalvando(false);
        }
    }

    // =========================================================
    // BUSCA
    // =========================================================

    const clientesFiltrados = clientes.filter((cliente) => {
        const texto = busca.toLowerCase().trim();

        if (!texto) return true;

        return (
            String(cliente.id_cliente || '')
                .toLowerCase()
                .includes(texto) ||

            String(cliente.nome || '')
                .toLowerCase()
                .includes(texto) ||

            String(cliente.cnpj || '')
                .toLowerCase()
                .includes(texto) ||

            String(cliente.telefone || '')
                .toLowerCase()
                .includes(texto) ||

            String(cliente.endereco || '')
                .toLowerCase()
                .includes(texto)
        );
    });

    // =========================================================
    // RENDER
    // =========================================================

    return (
        <div>

            {/* ================================================= */}
            {/* CABEÇALHO */}
            {/* ================================================= */}

            <div className="page-header">

                <div>
                    <h2>Clientes</h2>

                    <p>
                        Gerencie os compradores cadastrados na plataforma
                    </p>
                </div>

                <div
                    style={{
                        display: 'flex',
                        gap: '10px'
                    }}
                >

                    <button
                        className="btn-secondary"
                        onClick={carregarClientes}
                        disabled={loading}
                        title="Atualizar lista"
                    >
                        <RefreshCw
                            size={18}
                            className={loading ? 'spin' : ''}
                        />
                    </button>

                    <button
                        className="btn-primary"
                        onClick={abrirCadastro}
                    >
                        <Plus size={18} />
                        Novo Cliente
                    </button>

                </div>

            </div>

            {/* ================================================= */}
            {/* BUSCA */}
            {/* ================================================= */}

            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    marginBottom: '20px'
                }}
            >

                <div
                    style={{
                        position: 'relative',
                        flex: 1
                    }}
                >

                    <Search
                        size={18}
                        style={{
                            position: 'absolute',
                            left: '12px',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            color: '#777'
                        }}
                    />

                    <input
                        type="text"
                        value={busca}
                        onChange={(e) => setBusca(e.target.value)}
                        placeholder="Buscar por nome, CNPJ, telefone ou endereço..."
                        style={{
                            width: '100%',
                            padding: '12px 12px 12px 40px',
                            border: '1px solid #ddd',
                            borderRadius: '8px',
                            outline: 'none'
                        }}
                    />

                </div>

            </div>

            {/* ================================================= */}
            {/* MENSAGEM DE ERRO */}
            {/* ================================================= */}

            {erro && !modalAberto && (
                <div
                    style={{
                        padding: '14px',
                        marginBottom: '20px',
                        borderRadius: '8px',
                        background: '#fee2e2',
                        color: '#991b1b'
                    }}
                >
                    {erro}
                </div>
            )}

            {/* ================================================= */}
            {/* TABELA */}
            {/* ================================================= */}

            <div className="table-container">

                <table className="custom-table">

                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Nome / Razão Social</th>
                            <th>CNPJ</th>
                            <th>Telefone</th>
                            <th>Endereço</th>
                        </tr>
                    </thead>

                    <tbody>

                        {loading ? (

                            <tr>
                                <td
                                    colSpan="5"
                                    style={{
                                        textAlign: 'center',
                                        padding: '30px'
                                    }}
                                >
                                    Carregando clientes...
                                </td>
                            </tr>

                        ) : clientesFiltrados.length === 0 ? (

                            <tr>
                                <td
                                    colSpan="5"
                                    style={{
                                        textAlign: 'center',
                                        padding: '30px'
                                    }}
                                >
                                    {busca
                                        ? 'Nenhum cliente encontrado.'
                                        : 'Nenhum cliente cadastrado.'
                                    }
                                </td>
                            </tr>

                        ) : (

                            clientesFiltrados.map((cliente) => (

                                <tr key={cliente.id_cliente}>

                                    <td>
                                        {cliente.id_cliente}
                                    </td>

                                    <td
                                        style={{
                                            fontWeight: 600
                                        }}
                                    >
                                        <div
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '8px'
                                            }}
                                        >
                                            <UserRound size={18} />

                                            {cliente.nome || '-'}
                                        </div>
                                    </td>

                                    <td>
                                        {cliente.cnpj || '-'}
                                    </td>

                                    <td>
                                        {cliente.telefone || '-'}
                                    </td>

                                    <td>
                                        {cliente.endereco || '-'}
                                    </td>

                                </tr>

                            ))

                        )}

                    </tbody>

                </table>

            </div>

            {/* ================================================= */}
            {/* TOTAL */}
            {/* ================================================= */}

            <div
                style={{
                    marginTop: '15px',
                    fontSize: '14px',
                    color: '#666'
                }}
            >
                Mostrando{' '}
                <strong>{clientesFiltrados.length}</strong>{' '}
                de{' '}
                <strong>{clientes.length}</strong>{' '}
                clientes cadastrados.
            </div>

            {/* ================================================= */}
            {/* MODAL NOVO CLIENTE */}
            {/* ================================================= */}

            {modalAberto && (

                <div
                    style={{
                        position: 'fixed',
                        inset: 0,
                        background: 'rgba(0, 0, 0, 0.5)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 1000,
                        padding: '20px'
                    }}
                    onClick={fecharModal}
                >

                    <div
                        style={{
                            background: '#fff',
                            width: '100%',
                            maxWidth: '600px',
                            borderRadius: '12px',
                            padding: '25px',
                            boxShadow: '0 10px 40px rgba(0,0,0,0.2)'
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >

                        {/* CABEÇALHO DO MODAL */}

                        <div
                            style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                marginBottom: '25px'
                            }}
                        >

                            <div>
                                <h3 style={{ margin: 0 }}>
                                    Novo Cliente
                                </h3>

                                <p
                                    style={{
                                        margin: '5px 0 0',
                                        color: '#777'
                                    }}
                                >
                                    Cadastre um novo comprador
                                </p>
                            </div>

                            <button
                                onClick={fecharModal}
                                style={{
                                    border: 'none',
                                    background: 'transparent',
                                    cursor: 'pointer'
                                }}
                            >
                                <X size={22} />
                            </button>

                        </div>

                        {/* FORMULÁRIO */}

                        <form onSubmit={cadastrarCliente}>

                            <div
                                style={{
                                    display: 'grid',
                                    gridTemplateColumns: '140px 1fr',
                                    gap: '15px',
                                    marginBottom: '15px'
                                }}
                            >

                                <div>
                                    <label>ID Cliente</label>

                                    <input
                                        type="number"
                                        name="id_cliente"
                                        value={form.id_cliente}
                                        onChange={handleChange}
                                        placeholder="Ex.: 1"
                                        required
                                        style={{
                                            width: '100%',
                                            padding: '10px',
                                            marginTop: '5px',
                                            border: '1px solid #ddd',
                                            borderRadius: '6px'
                                        }}
                                    />
                                </div>

                                <div>
                                    <label>Nome / Razão Social</label>

                                    <input
                                        type="text"
                                        name="nome"
                                        value={form.nome}
                                        onChange={handleChange}
                                        placeholder="Nome do cliente"
                                        required
                                        style={{
                                            width: '100%',
                                            padding: '10px',
                                            marginTop: '5px',
                                            border: '1px solid #ddd',
                                            borderRadius: '6px'
                                        }}
                                    />
                                </div>

                            </div>

                            <div
                                style={{
                                    display: 'grid',
                                    gridTemplateColumns: '1fr 1fr',
                                    gap: '15px',
                                    marginBottom: '15px'
                                }}
                            >

                                <div>
                                    <label>CNPJ</label>

                                    <input
                                        type="text"
                                        name="cnpj"
                                        value={form.cnpj}
                                        onChange={handleChange}
                                        placeholder="00.000.000/0000-00"
                                        style={{
                                            width: '100%',
                                            padding: '10px',
                                            marginTop: '5px',
                                            border: '1px solid #ddd',
                                            borderRadius: '6px'
                                        }}
                                    />
                                </div>

                                <div>
                                    <label>Telefone</label>

                                    <input
                                        type="text"
                                        name="telefone"
                                        value={form.telefone}
                                        onChange={handleChange}
                                        placeholder="(00) 00000-0000"
                                        style={{
                                            width: '100%',
                                            padding: '10px',
                                            marginTop: '5px',
                                            border: '1px solid #ddd',
                                            borderRadius: '6px'
                                        }}
                                    />
                                </div>

                            </div>

                            <div style={{ marginBottom: '15px' }}>

                                <label>Endereço</label>

                                <input
                                    type="text"
                                    name="endereco"
                                    value={form.endereco}
                                    onChange={handleChange}
                                    placeholder="Rua, número, bairro, cidade - UF"
                                    style={{
                                        width: '100%',
                                        padding: '10px',
                                        marginTop: '5px',
                                        border: '1px solid #ddd',
                                        borderRadius: '6px'
                                    }}
                                />

                            </div>

                            {/* ERRO */}

                            {erro && (
                                <div
                                    style={{
                                        padding: '12px',
                                        marginBottom: '15px',
                                        borderRadius: '6px',
                                        background: '#fee2e2',
                                        color: '#991b1b'
                                    }}
                                >
                                    {erro}
                                </div>
                            )}

                            {/* SUCESSO */}

                            {mensagem && (
                                <div
                                    style={{
                                        padding: '12px',
                                        marginBottom: '15px',
                                        borderRadius: '6px',
                                        background: '#dcfce7',
                                        color: '#166534'
                                    }}
                                >
                                    {mensagem}
                                </div>
                            )}

                            {/* BOTÕES */}

                            <div
                                style={{
                                    display: 'flex',
                                    justifyContent: 'flex-end',
                                    gap: '10px',
                                    marginTop: '25px'
                                }}
                            >

                                <button
                                    type="button"
                                    onClick={fecharModal}
                                    disabled={salvando}
                                    style={{
                                        padding: '10px 18px',
                                        border: '1px solid #ddd',
                                        borderRadius: '6px',
                                        background: '#fff',
                                        cursor: 'pointer'
                                    }}
                                >
                                    Cancelar
                                </button>

                                <button
                                    type="submit"
                                    className="btn-primary"
                                    disabled={salvando}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px'
                                    }}
                                >
                                    <Save size={18} />

                                    {salvando
                                        ? 'Salvando...'
                                        : 'Cadastrar Cliente'
                                    }
                                </button>

                            </div>

                        </form>

                    </div>

                </div>

            )}

        </div>
    );
}

export default Clientes;

