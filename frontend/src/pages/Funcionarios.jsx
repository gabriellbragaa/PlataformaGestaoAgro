import React, { useEffect, useState } from "react";
import {
    Plus,
    Pencil,
    Trash2,
    X,
    UserRound,
    BriefcaseBusiness
} from "lucide-react";

import { funcionarioAPI, associadoAPI } from "../services/api";

function Funcionarios() {
    // ============================================================
    // ESTADOS
    // ============================================================

    const [funcionarios, setFuncionarios] = useState([]);
    const [associados, setAssociados] = useState([]);

    const [loading, setLoading] = useState(true);
    const [erro, setErro] = useState(null);

    const [modalAberto, setModalAberto] = useState(false);
    const [modoEdicao, setModoEdicao] = useState(false);

    const [funcionarioSelecionado, setFuncionarioSelecionado] = useState(null);

    const [form, setForm] = useState({
        id_associado: "",
        endereco: "",
        setor: ""
    });

    // ============================================================
    // CARREGAR DADOS
    // ============================================================

    useEffect(() => {
        carregarDados();
    }, []);

    const carregarDados = async () => {
        try {
            setLoading(true);
            setErro(null);

            // Carrega a lista de funcionários e a lista de associados em paralelo
            const [funcionariosRes, associadosRes] = await Promise.all([
                funcionarioAPI.listar(),
                associadoAPI.listar()
            ]);

            setFuncionarios(funcionariosRes.data || funcionariosRes || []);
            setAssociados(associadosRes.data || associadosRes || []);

        } catch (error) {
            console.error("Erro ao carregar dados:", error);
            setErro(
                error.response?.data?.detail ||
                error.message ||
                "Erro ao carregar dados do servidor."
            );
        } finally {
            setLoading(false);
        }
    };

    // ============================================================
    // CONTROLE DO MODAL
    // ============================================================

    const abrirNovo = () => {
        setModoEdicao(false);
        setFuncionarioSelecionado(null);
        setForm({
            id_associado: "",
            endereco: "",
            setor: ""
        });
        setErro(null);
        setModalAberto(true);
    };

    const abrirEdicao = (funcionario) => {
        setModoEdicao(true);
        setFuncionarioSelecionado(funcionario);
        setForm({
            id_associado: String(funcionario.id_associado),
            endereco: funcionario.endereco || "",
            setor: funcionario.setor || ""
        });
        setErro(null);
        setModalAberto(true);
    };

    const fecharModal = () => {
        setModalAberto(false);
        setModoEdicao(false);
        setFuncionarioSelecionado(null);
        setForm({
            id_associado: "",
            endereco: "",
            setor: ""
        });
        setErro(null);
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm((prev) => ({
            ...prev,
            [name]: value
        }));
    };

    // ============================================================
    // SALVAR (CRIAR / ATUALIZAR)
    // ============================================================

    const salvarFuncionario = async (e) => {
        e.preventDefault();
        setErro(null);

        if (!form.id_associado) {
            setErro("Selecione um associado.");
            return;
        }

        if (!form.setor.trim()) {
            setErro("Informe o setor do funcionário.");
            return;
        }

        try {
            if (modoEdicao) {
                // Modelo: FuncionarioUpdate
                const payloadAtualizacao = {
                    id_associado: Number(form.id_associado),
                    endereco: form.endereco.trim() || null,
                    setor: form.setor.trim()
                };

                await funcionarioAPI.atualizar(
                    funcionarioSelecionado.id_func,
                    payloadAtualizacao
                );
            } else {
                // Modelo: Funcionario
                const payloadCriacao = {
                    id_associado: Number(form.id_associado),
                    endereco: form.endereco.trim() || null,
                    setor: form.setor.trim()
                };

                await funcionarioAPI.criar(payloadCriacao);
            }

            fecharModal();
            await carregarDados();

        } catch (error) {
            console.error("Erro ao salvar funcionário:", error);
            setErro(
                error.response?.data?.detail ||
                error.message ||
                "Erro ao salvar funcionário."
            );
        }
    };

    // ============================================================
    // EXCLUIR
    // ============================================================

    const excluirFuncionario = async (id) => {
        const confirmar = window.confirm(
            "Tem certeza que deseja excluir este funcionário?"
        );

        if (!confirmar) return;

        try {
            setErro(null);
            await funcionarioAPI.excluir(id);
            await carregarDados();
        } catch (error) {
            console.error("Erro ao excluir funcionário:", error);
            setErro(
                error.response?.data?.detail ||
                error.message ||
                "Erro ao excluir funcionário."
            );
        }
    };

    // ============================================================
    // ASSOCIADOS DISPONÍVEIS
    // ============================================================

    const associadosDisponiveis = associados.filter((associado) => {
        const jaFuncionario = funcionarios.some(
            (funcionario) => Number(funcionario.id_associado) === Number(associado.id_associado)
        );

        // Se estiver editando, permite manter o associado atual do funcionário no dropdown
        if (
            modoEdicao &&
            funcionarioSelecionado &&
            Number(funcionarioSelecionado.id_associado) === Number(associado.id_associado)
        ) {
            return true;
        }

        return !jaFuncionario;
    });

    // ============================================================
    // COMPONENTE DE CARREGAMENTO
    // ============================================================

    if (loading) {
        return (
            <div className="p-6">
                <div className="flex items-center gap-3 mb-6">
                    <BriefcaseBusiness size={28} />
                    <h1 className="text-2xl font-bold">Funcionários</h1>
                </div>
                <p className="text-gray-500">Carregando dados da API...</p>
            </div>
        );
    }

    // ============================================================
    // INTERFACE
    // ============================================================

    return (
        <div className="p-6">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <div className="flex items-center gap-3">
                        <BriefcaseBusiness size={30} className="text-green-600" />
                        <h1 className="text-2xl font-bold">Funcionários</h1>
                    </div>
                    <p className="text-gray-500 mt-1">
                        Gerencie os associados vinculados como funcionários da cooperativa.
                    </p>
                </div>

                <button
                    onClick={abrirNovo}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                >
                    <Plus size={20} />
                    Novo funcionário
                </button>
            </div>

            {erro && !modalAberto && (
                <div className="mb-4 p-4 bg-red-100 border border-red-300 text-red-700 rounded-lg">
                    {erro}
                </div>
            )}

            <div className="bg-white rounded-xl shadow overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-100">
                            <tr>
                                <th className="px-6 py-4 text-left text-sm font-semibold">
                                    Funcionário (Produtor)
                                </th>
                                <th className="px-6 py-4 text-left text-sm font-semibold">
                                    Cooperativa
                                </th>
                                <th className="px-6 py-4 text-left text-sm font-semibold">
                                    Endereço
                                </th>
                                <th className="px-6 py-4 text-left text-sm font-semibold">
                                    Setor
                                </th>
                                <th className="px-6 py-4 text-left text-sm font-semibold">
                                    Administrador
                                </th>
                                <th className="px-6 py-4 text-center text-sm font-semibold">
                                    Ações
                                </th>
                            </tr>
                        </thead>

                        <tbody>
                            {funcionarios.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="px-6 py-10 text-center text-gray-500">
                                        Nenhum funcionário cadastrado.
                                    </td>
                                </tr>
                            ) : (
                                funcionarios.map((funcionario) => (
                                    <tr key={funcionario.id_func} className="border-t hover:bg-gray-50">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                                                    <UserRound size={20} className="text-green-600" />
                                                </div>
                                                <div>
                                                    <p className="font-medium">
                                                        {funcionario.nome || "Não informado"}
                                                    </p>
                                                    <p className="text-sm text-gray-500">
                                                        ID Associado: {funcionario.id_associado}
                                                    </p>
                                                </div>
                                            </div>
                                        </td>

                                        <td className="px-6 py-4">
                                            {funcionario.cooperativa || "Não informado"}
                                        </td>

                                        <td className="px-6 py-4">
                                            {funcionario.endereco || "Não informado"}
                                        </td>

                                        <td className="px-6 py-4">
                                            {funcionario.setor || "Não informado"}
                                        </td>

                                        <td className="px-6 py-4">
                                            {funcionario.administrador ? (
                                                <span className="px-3 py-1 text-xs rounded-full bg-blue-100 text-blue-700 font-medium">
                                                    Sim
                                                </span>
                                            ) : (
                                                <span className="px-3 py-1 text-xs rounded-full bg-gray-100 text-gray-600">
                                                    Não
                                                </span>
                                            )}
                                        </td>

                                        <td className="px-6 py-4">
                                            <div className="flex justify-center gap-2">
                                                <button
                                                    onClick={() => abrirEdicao(funcionario)}
                                                    className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition"
                                                    title="Editar"
                                                >
                                                    <Pencil size={18} />
                                                </button>
                                                <button
                                                    onClick={() => excluirFuncionario(funcionario.id_func)}
                                                    className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition"
                                                    title="Excluir"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* MODAL CADASTRAR / EDITAR */}
            {modalAberto && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-lg">
                        <div className="flex items-center justify-between p-6 border-b">
                            <div>
                                <h2 className="text-xl font-bold">
                                    {modoEdicao ? "Editar Funcionário" : "Novo Funcionário"}
                                </h2>
                                <p className="text-sm text-gray-500 mt-1">
                                    Vincule um associado para atuar no setor de trabalho.
                                </p>
                            </div>
                            <button onClick={fecharModal} className="p-2 hover:bg-gray-100 rounded-lg">
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={salvarFuncionario} className="p-6 space-y-5">
                            {erro && (
                                <div className="p-3 bg-red-100 border border-red-300 text-red-700 rounded-lg text-sm">
                                    {erro}
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-medium mb-2">
                                    Associado *
                                </label>
                                <select
                                    name="id_associado"
                                    value={form.id_associado}
                                    onChange={handleChange}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                                    required
                                >
                                    <option value="">Selecione um associado</option>
                                    {associadosDisponiveis.map((associado) => (
                                        <option key={associado.id_associado} value={associado.id_associado}>
                                            {associado.nome} — {associado.cooperativa || "Sem Cooperativa"} (ID: {associado.id_associado})
                                        </option>
                                    ))}
                                </select>

                                {associadosDisponiveis.length === 0 && (
                                    <p className="text-sm text-orange-600 mt-2">
                                        Não existem associados disponíveis para vínculo.
                                    </p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2">Endereço</label>
                                <input
                                    type="text"
                                    name="endereco"
                                    value={form.endereco}
                                    onChange={handleChange}
                                    placeholder="Endereço de trabalho ou contato"
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2">Setor *</label>
                                <input
                                    type="text"
                                    name="setor"
                                    value={form.setor}
                                    onChange={handleChange}
                                    placeholder="Ex.: Produção, Logística, Vendas..."
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                                    required
                                />
                            </div>

                            <div className="flex justify-end gap-3 pt-4 border-t">
                                <button
                                    type="button"
                                    onClick={fecharModal}
                                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                                >
                                    {modoEdicao ? "Salvar alterações" : "Cadastrar funcionário"}
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