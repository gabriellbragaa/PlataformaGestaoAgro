
import React, { useEffect, useState } from "react";
import {
    Plus,
    Pencil,
    Trash2,
    X,
    BriefcaseBusiness,
    ShieldCheck,
    UserRound
} from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

function Funcionarios() {
    const [funcionarios, setFuncionarios] = useState([]);
    const [administradores, setAdministradores] = useState([]);

    const [loading, setLoading] = useState(true);
    const [erro, setErro] = useState(null);

    const [modalAberto, setModalAberto] = useState(false);
    const [modoEdicao, setModoEdicao] = useState(false);

    const [funcionarioSelecionado, setFuncionarioSelecionado] = useState(null);

    const [form, setForm] = useState({
        id_func: "",
        nome: "",
        rg: "",
        endereco: "",
        setor: "",
        id_admin: ""
    });

    // ============================================================
    // CARREGAR FUNCIONÁRIOS E ADMINISTRADORES
    // ============================================================

    useEffect(() => {
        carregarDados();
    }, []);

    async function carregarDados() {
        try {
            setLoading(true);
            setErro(null);

            const [funcRes, adminRes] = await Promise.all([
                fetch(`${API_URL}/funcionario`),
                fetch(`${API_URL}/Administradores`)
            ]);

            if (!funcRes.ok) {
                throw new Error("Erro ao carregar funcionários.");
            }

            const funcionariosData = await funcRes.json();

            let administradoresData = [];

            if (adminRes.ok) {
                administradoresData = await adminRes.json();
            }

            setFuncionarios(funcionariosData);
            setAdministradores(administradoresData);

        } catch (error) {
            console.error(error);
            setErro(error.message);
        } finally {
            setLoading(false);
        }
    }

    // ============================================================
    // FORMULÁRIO
    // ============================================================

    function abrirNovoFuncionario() {
        setModoEdicao(false);
        setFuncionarioSelecionado(null);

        setForm({
            id_func: "",
            nome: "",
            rg: "",
            endereco: "",
            setor: "",
            id_admin: ""
        });

        setModalAberto(true);
    }

    function abrirEdicao(funcionario) {
        setModoEdicao(true);
        setFuncionarioSelecionado(funcionario);

        setForm({
            id_func: funcionario.id_func,
            nome: funcionario.nome || "",
            rg: funcionario.rg || "",
            endereco: funcionario.endereco || "",
            setor: funcionario.setor || "",
            id_admin: funcionario.id_admin || ""
        });

        setModalAberto(true);
    }

    function fecharModal() {
        setModalAberto(false);
        setFuncionarioSelecionado(null);
    }

    function handleChange(e) {
        const { name, value } = e.target;

        setForm((prev) => ({
            ...prev,
            [name]: value
        }));
    }

    // ============================================================
    // CADASTRAR / ATUALIZAR
    // ============================================================

    async function salvarFuncionario(e) {
        e.preventDefault();

        try {
            const dados = {
                nome: form.nome,
                rg: form.rg || null,
                endereco: form.endereco || null,
                setor: form.setor || null,
                id_admin: form.id_admin
                    ? Number(form.id_admin)
                    : null
            };

            // ----------------------------------------------------
            // NOVO FUNCIONÁRIO
            // ----------------------------------------------------

            if (!modoEdicao) {
                if (!form.id_func) {
                    alert("Informe o ID do funcionário.");
                    return;
                }

                dados.id_func = Number(form.id_func);

                const response = await fetch(`${API_URL}/funcionario`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify(dados)
                });

                const result = await response.json();

                if (!response.ok) {
                    throw new Error(
                        result.detail || "Erro ao cadastrar funcionário."
                    );
                }

                alert("Funcionário cadastrado com sucesso!");
            }

            // ----------------------------------------------------
            // EDIÇÃO
            // ----------------------------------------------------

            else {
                const response = await fetch(
                    `${API_URL}/funcionario/${funcionarioSelecionado.id_func}`,
                    {
                        method: "PATCH",
                        headers: {
                            "Content-Type": "application/json"
                        },
                        body: JSON.stringify(dados)
                    }
                );

                const result = await response.json();

                if (!response.ok) {
                    throw new Error(
                        result.detail || "Erro ao atualizar funcionário."
                    );
                }

                alert("Funcionário atualizado com sucesso!");
            }

            fecharModal();
            carregarDados();

        } catch (error) {
            console.error(error);
            alert(error.message);
        }
    }

    // ============================================================
    // EXCLUIR
    // ============================================================

    async function excluirFuncionario(id) {
        const confirmar = window.confirm(
            "Tem certeza que deseja excluir este funcionário?"
        );

        if (!confirmar) {
            return;
        }

        try {
            const response = await fetch(
                `${API_URL}/funcionario/${id}`,
                {
                    method: "DELETE"
                }
            );

            const result = await response.json();

            if (!response.ok) {
                throw new Error(
                    result.detail || "Erro ao excluir funcionário."
                );
            }

            alert("Funcionário excluído com sucesso!");

            carregarDados();

        } catch (error) {
            console.error(error);
            alert(error.message);
        }
    }

    // ============================================================
    // VERIFICAR SE É ADMINISTRADOR
    // ============================================================

    function obterAdministrador(idAdmin) {
        if (!idAdmin) {
            return null;
        }

        return administradores.find(
            (admin) => admin.id_admin === idAdmin
        );
    }

    // ============================================================
    // LOADING
    // ============================================================

    if (loading) {
        return (
            <div>
                <div className="page-header">
                    <div>
                        <h2>Funcionários</h2>
                        <p>
                            Gestão dos associados que atuam na cooperativa
                        </p>
                    </div>
                </div>

                <div className="table-container">
                    <p style={{ padding: "20px" }}>
                        Carregando funcionários...
                    </p>
                </div>
            </div>
        );
    }

    // ============================================================
    // TELA
    // ============================================================

    return (
        <div>

            {/* ====================================================
                CABEÇALHO
            ==================================================== */}

            <div className="page-header">
                <div>
                    <h2>Funcionários</h2>

                    <p>
                        Gestão dos associados que atuam nas cooperativas
                    </p>
                </div>

                <button
                    className="btn-primary"
                    onClick={abrirNovoFuncionario}
                >
                    <Plus size={18} />
                    Novo Funcionário
                </button>
            </div>

            {/* ====================================================
                ERRO
            ==================================================== */}

            {erro && (
                <div
                    style={{
                        background: "#fee2e2",
                        color: "#991b1b",
                        padding: "12px 16px",
                        borderRadius: "8px",
                        marginBottom: "20px"
                    }}
                >
                    {erro}
                </div>
            )}

            {/* ====================================================
                RESUMO
            ==================================================== */}

            <div
                style={{
                    display: "grid",
                    gridTemplateColumns:
                        "repeat(auto-fit, minmax(200px, 1fr))",
                    gap: "16px",
                    marginBottom: "24px"
                }}
            >

                <div className="dashboard-card">
                    <UserRound size={25} />

                    <div>
                        <span>Funcionários</span>

                        <strong>
                            {funcionarios.length}
                        </strong>
                    </div>
                </div>

                <div className="dashboard-card">
                    <ShieldCheck size={25} />

                    <div>
                        <span>Administradores</span>

                        <strong>
                            {administradores.length}
                        </strong>
                    </div>
                </div>

            </div>

            {/* ====================================================
                TABELA
            ==================================================== */}

            <div className="table-container">

                <table className="custom-table">

                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Funcionário / Associado</th>
                            <th>RG</th>
                            <th>Endereço</th>
                            <th>Setor / Função</th>
                            <th>Administrador</th>
                            <th>Ações</th>
                        </tr>
                    </thead>

                    <tbody>

                        {funcionarios.length === 0 ? (

                            <tr>
                                <td
                                    colSpan="7"
                                    style={{
                                        textAlign: "center",
                                        padding: "30px"
                                    }}
                                >
                                    Nenhum funcionário cadastrado.
                                </td>
                            </tr>

                        ) : (

                            funcionarios.map((funcionario) => {

                                const admin = obterAdministrador(
                                    funcionario.id_admin
                                );

                                return (
                                    <tr key={funcionario.id_func}>

                                        <td>
                                            {funcionario.id_func}
                                        </td>

                                        <td
                                            style={{
                                                fontWeight: 600
                                            }}
                                        >
                                            <div
                                                style={{
                                                    display: "flex",
                                                    alignItems: "center",
                                                    gap: "8px"
                                                }}
                                            >
                                                <BriefcaseBusiness
                                                    size={18}
                                                />

                                                {funcionario.nome}
                                            </div>
                                        </td>

                                        <td>
                                            {funcionario.rg || "-"}
                                        </td>

                                        <td>
                                            {funcionario.endereco || "-"}
                                        </td>

                                        <td>
                                            {funcionario.setor || "-"}
                                        </td>

                                        <td>

                                            {admin ? (

                                                <span
                                                    className="badge badge-green"
                                                >
                                                    <ShieldCheck
                                                        size={14}
                                                    />

                                                    Administrador
                                                </span>

                                            ) : (

                                                <span
                                                    className="badge"
                                                >
                                                    Associado
                                                </span>

                                            )}

                                        </td>

                                        <td>

                                            <div
                                                style={{
                                                    display: "flex",
                                                    gap: "8px"
                                                }}
                                            >

                                                <button
                                                    className="btn-icon"
                                                    title="Editar"
                                                    onClick={() =>
                                                        abrirEdicao(
                                                            funcionario
                                                        )
                                                    }
                                                >
                                                    <Pencil size={17} />
                                                </button>

                                                <button
                                                    className="btn-icon"
                                                    title="Excluir"
                                                    onClick={() =>
                                                        excluirFuncionario(
                                                            funcionario.id_func
                                                        )
                                                    }
                                                >
                                                    <Trash2 size={17} />
                                                </button>

                                            </div>

                                        </td>

                                    </tr>
                                );
                            })

                        )}

                    </tbody>

                </table>

            </div>

            {/* ====================================================
                MODAL
            ==================================================== */}

            {modalAberto && (

                <div className="modal-overlay">

                    <div className="modal">

                        <div className="modal-header">

                            <div>
                                <h3>
                                    {modoEdicao
                                        ? "Editar Funcionário"
                                        : "Novo Funcionário"}
                                </h3>

                                <p>
                                    {modoEdicao
                                        ? "Atualize os dados do associado."
                                        : "Cadastre um associado como funcionário."}
                                </p>
                            </div>

                            <button
                                className="btn-icon"
                                onClick={fecharModal}
                            >
                                <X size={20} />
                            </button>

                        </div>

                        <form onSubmit={salvarFuncionario}>

                            {/* ID */}

                            {!modoEdicao && (

                                <div className="form-group">

                                    <label>
                                        ID do Funcionário
                                    </label>

                                    <input
                                        type="number"
                                        name="id_func"
                                        value={form.id_func}
                                        onChange={handleChange}
                                        placeholder="Digite o ID"
                                        required
                                    />

                                    <small>
                                        Informe o ID correspondente ao
                                        associado/funcionário.
                                    </small>

                                </div>

                            )}

                            {/* NOME */}

                            <div className="form-group">

                                <label>
                                    Nome
                                </label>

                                <input
                                    type="text"
                                    name="nome"
                                    value={form.nome}
                                    onChange={handleChange}
                                    placeholder="Nome completo"
                                    required
                                />

                            </div>

                            {/* RG */}

                            <div className="form-group">

                                <label>
                                    RG
                                </label>

                                <input
                                    type="text"
                                    name="rg"
                                    value={form.rg}
                                    onChange={handleChange}
                                    placeholder="Número do RG"
                                />

                            </div>

                            {/* ENDEREÇO */}

                            <div className="form-group">

                                <label>
                                    Endereço
                                </label>

                                <input
                                    type="text"
                                    name="endereco"
                                    value={form.endereco}
                                    onChange={handleChange}
                                    placeholder="Endereço"
                                />

                            </div>

                            {/* SETOR */}

                            <div className="form-group">

                                <label>
                                    Setor / Função
                                </label>

                                <input
                                    type="text"
                                    name="setor"
                                    value={form.setor}
                                    onChange={handleChange}
                                    placeholder="Ex.: Administração, Produção..."
                                />

                            </div>

                            {/* ADMINISTRADOR */}

                            <div className="form-group">

                                <label>
                                    Administrador responsável
                                </label>

                                <select
                                    name="id_admin"
                                    value={form.id_admin}
                                    onChange={handleChange}
                                >

                                    <option value="">
                                        Nenhum
                                    </option>

                                    {administradores.map((admin) => (

                                        <option
                                            key={admin.id_admin}
                                            value={admin.id_admin}
                                        >
                                            {admin.nome}
                                        </option>

                                    ))}

                                </select>

                                <small>
                                    Caso este funcionário também seja
                                    administrador, selecione o administrador
                                    correspondente.
                                </small>

                            </div>

                            {/* BOTÕES */}

                            <div
                                className="modal-actions"
                            >

                                <button
                                    type="button"
                                    className="btn-secondary"
                                    onClick={fecharModal}
                                >
                                    Cancelar
                                </button>

                                <button
                                    type="submit"
                                    className="btn-primary"
                                >
                                    {modoEdicao
                                        ? "Salvar alterações"
                                        : "Cadastrar funcionário"}
                                </button>

                            </div>

                        </form>

                    </div>

                </div>

            )}

        </div>
    );
}

export default Funcionarios;

