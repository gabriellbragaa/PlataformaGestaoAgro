
import React, { useEffect, useState } from "react";
import {
    Plus,
    Pencil,
    Trash2,
    X,
    Package,
    Tractor,
    ShoppingCart,
    CheckCircle,
    MapPin,
    Calendar,
    Clock
} from "lucide-react";

import { recursoAPI, produtorAPI, cooperativaAPI } from "../services/api";

function Recurso() {

    // ============================================================
    // ESTADOS
    // ============================================================

    const [recursos, setRecursos] = useState([]);
    const [produtores, setProdutores] = useState([]);
    const [cooperativas, setCooperativas] = useState([]);

    const [modalAberto, setModalAberto] = useState(false);
    const [modoEdicao, setModoEdicao] = useState(false);

    const [recursoSelecionado, setRecursoSelecionado] = useState(null);

    const [loading, setLoading] = useState(true);
    const [erro, setErro] = useState("");
    const [sucesso, setSucesso] = useState("");

    const [form, setForm] = useState({
        tipo_recurso: "Produto",
        categoria: "",
        nome: "",
        descricao: "",

        id_produtor: "",
        id_cooperativa: "",

        quantidade: "",
        unidade: "kg",
        valor: "",

        status: "Disponível",

        cidade: "",
        estado: "CE",
        endereco: "",

        ano: "",

        data_producao: "",
        horario_producao: "",

        qualidade: ""
    });


    // ============================================================
    // CARREGAR DADOS
    // ============================================================

    useEffect(() => {
        carregarDados();
    }, []);


    const carregarDados = async () => {

        setLoading(true);
        setErro("");

        try {

            const [recursosResponse, produtoresResponse, cooperativasResponse] =
                await Promise.all([
                    recursoAPI.listar(),
                    produtorAPI.listar(),
                    cooperativaAPI.listar()
                ]);

            setRecursos(recursosResponse.data || []);
            setProdutores(produtoresResponse.data || []);
            setCooperativas(cooperativasResponse.data || []);

        } catch (error) {

            console.error(error);

            setErro(
                error.response?.data?.detail ||
                "Erro ao carregar os dados."
            );

        } finally {

            setLoading(false);

        }
    };


    // ============================================================
    // ALTERAR FORMULÁRIO
    // ============================================================

    const handleChange = (e) => {

        const { name, value } = e.target;

        setForm((prev) => ({
            ...prev,
            [name]: value
        }));
    };


    // ============================================================
    // ABRIR MODAL NOVO
    // ============================================================

    const abrirNovo = () => {

        setModoEdicao(false);
        setRecursoSelecionado(null);

        setForm({
            tipo_recurso: "Produto",
            categoria: "",
            nome: "",
            descricao: "",

            id_produtor: "",
            id_cooperativa: "",

            quantidade: "",
            unidade: "kg",
            valor: "",

            status: "Disponível",

            cidade: "",
            estado: "CE",
            endereco: "",

            ano: "",

            data_producao: "",
            horario_producao: "",

            qualidade: ""
        });

        setErro("");
        setSucesso("");
        setModalAberto(true);
    };


    // ============================================================
    // ABRIR MODAL EDIÇÃO
    // ============================================================

    const abrirEdicao = (recurso) => {

        setModoEdicao(true);
        setRecursoSelecionado(recurso);

        setForm({
            tipo_recurso: recurso.tipo_recurso || "Produto",
            categoria: recurso.categoria || "",
            nome: recurso.nome || "",
            descricao: recurso.descricao || "",

            id_produtor: recurso.id_produtor || "",
            id_cooperativa: recurso.id_cooperativa || "",

            quantidade: recurso.quantidade ?? "",
            unidade: recurso.unidade || "kg",
            valor: recurso.valor ?? "",

            status: recurso.status || "Disponível",

            cidade: recurso.cidade || "",
            estado: recurso.estado || "CE",
            endereco: recurso.endereco || "",

            ano: recurso.ano || "",

            data_producao:
                recurso.data_producao
                    ? recurso.data_producao.substring(0, 10)
                    : "",

            horario_producao:
                recurso.horario_producao
                    ? recurso.horario_producao.substring(0, 5)
                    : "",

            qualidade: recurso.qualidade || ""
        });

        setErro("");
        setSucesso("");
        setModalAberto(true);
    };


    // ============================================================
    // FECHAR MODAL
    // ============================================================

    const fecharModal = () => {

        setModalAberto(false);
        setRecursoSelecionado(null);
        setErro("");
    };


    // ============================================================
    // CADASTRAR / EDITAR
    // ============================================================

    const salvar = async (e) => {

        e.preventDefault();

        setErro("");
        setSucesso("");

        // --------------------------------------------------------
        // VALIDAÇÕES
        // --------------------------------------------------------

        if (!form.nome.trim()) {
            setErro("Informe o nome do recurso.");
            return;
        }

        if (!form.categoria.trim()) {
            setErro("Informe a categoria.");
            return;
        }

        if (!form.id_produtor) {
            setErro("Selecione o produtor responsável.");
            return;
        }

        if (!form.quantidade || Number(form.quantidade) <= 0) {
            setErro("Informe uma quantidade válida.");
            return;
        }

        if (!form.valor || Number(form.valor) < 0) {
            setErro("Informe um valor válido.");
            return;
        }

        // --------------------------------------------------------
        // MONTA OBJETO
        // --------------------------------------------------------

        const dados = {
            tipo_recurso: form.tipo_recurso,
            categoria: form.categoria,
            nome: form.nome,
            descricao: form.descricao || null,

            id_produtor: Number(form.id_produtor),

            id_cooperativa:
                form.id_cooperativa
                    ? Number(form.id_cooperativa)
                    : null,

            quantidade: Number(form.quantidade),

            unidade: form.unidade,

            valor: Number(form.valor),

            status: form.status,

            cidade: form.cidade || null,
            estado: form.estado || null,
            endereco: form.endereco || null,

            ano:
                form.tipo_recurso === "Ferramenta" && form.ano
                    ? Number(form.ano)
                    : null,

            data_producao:
                form.tipo_recurso === "Produto" &&
                    form.data_producao
                    ? form.data_producao
                    : null,

            horario_producao:
                form.tipo_recurso === "Produto" &&
                    form.horario_producao
                    ? form.horario_producao
                    : null,

            qualidade:
                form.qualidade
                    ? Number(form.qualidade)
                    : null
        };

        try {

            if (modoEdicao) {

                await recursoAPI.atualizar(
                    recursoSelecionado.id_recurso,
                    dados
                );

                setSucesso("Recurso atualizado com sucesso!");

            } else {

                await recursoAPI.criar(dados);

                setSucesso("Recurso cadastrado com sucesso!");
            }

            await carregarDados();

            setTimeout(() => {
                fecharModal();
            }, 700);

        } catch (error) {

            console.error(error);

            setErro(
                error.response?.data?.detail ||
                "Erro ao salvar recurso."
            );
        }
    };


    // ============================================================
    // MARCAR COMO VENDIDO
    // ============================================================

    const marcarComoVendido = async (recurso) => {

        const confirmar = window.confirm(
            `Deseja marcar "${recurso.nome}" como vendido?`
        );

        if (!confirmar) {
            return;
        }

        try {

            await recursoAPI.vender(recurso.id_recurso);

            setSucesso(
                `"${recurso.nome}" foi marcado como vendido.`
            );

            await carregarDados();

        } catch (error) {

            console.error(error);

            setErro(
                error.response?.data?.detail ||
                "Erro ao registrar venda."
            );
        }
    };


    // ============================================================
    // EXCLUIR
    // ============================================================

    const excluir = async (recurso) => {

        if (recurso.status === "Vendido") {

            setErro(
                "Recursos vendidos não podem ser excluídos."
            );

            return;
        }

        const confirmar = window.confirm(
            `Deseja realmente excluir "${recurso.nome}"?`
        );

        if (!confirmar) {
            return;
        }

        try {

            await recursoAPI.deletar(recurso.id_recurso);

            setSucesso("Recurso excluído com sucesso!");

            await carregarDados();

        } catch (error) {

            console.error(error);

            setErro(
                error.response?.data?.detail ||
                "Erro ao excluir recurso."
            );
        }
    };


    // ============================================================
    // FORMATAR VALOR
    // ============================================================

    const formatarValor = (valor) => {

        return Number(valor || 0).toLocaleString(
            "pt-BR",
            {
                style: "currency",
                currency: "BRL"
            }
        );
    };


    // ============================================================
    // NOME DO PRODUTOR
    // ============================================================

    const nomeProdutor = (id) => {

        const produtor = produtores.find(
            (p) =>
                Number(p.id_produtor) === Number(id)
        );

        return produtor?.nome || `Produtor #${id}`;
    };


    // ============================================================
    // NOME COOPERATIVA
    // ============================================================

    const nomeCooperativa = (id) => {

        if (!id) {
            return "Não informada";
        }

        const cooperativa = cooperativas.find(
            (c) =>
                Number(c.id_cooperativa) === Number(id)
        );

        return (
            cooperativa?.nome ||
            `Cooperativa #${id}`
        );
    };


    // ============================================================
    // RENDER
    // ============================================================

    return (
        <div className="p-6">

            {/* ====================================================
                CABEÇALHO
            ==================================================== */}

            <div className="flex justify-between items-center mb-6">

                <div>

                    <h1 className="text-2xl font-bold text-gray-800">
                        Recursos
                    </h1>

                    <p className="text-gray-500 mt-1">
                        Gerencie ferramentas, equipamentos e produtos
                        disponíveis para venda.
                    </p>

                </div>

                <button
                    onClick={abrirNovo}
                    className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition"
                >
                    <Plus size={20} />

                    Novo recurso
                </button>

            </div>


            {/* ====================================================
                MENSAGENS
            ==================================================== */}

            {erro && (

                <div className="mb-4 p-4 rounded-lg bg-red-100 text-red-700">
                    {erro}
                </div>

            )}

            {sucesso && (

                <div className="mb-4 p-4 rounded-lg bg-green-100 text-green-700">
                    {sucesso}
                </div>

            )}


            {/* ====================================================
                LOADING
            ==================================================== */}

            {loading ? (

                <div className="text-center py-10 text-gray-500">
                    Carregando recursos...
                </div>

            ) : recursos.length === 0 ? (

                <div className="bg-white rounded-xl shadow p-10 text-center">

                    <Package
                        size={50}
                        className="mx-auto text-gray-400 mb-3"
                    />

                    <h2 className="text-lg font-semibold text-gray-700">
                        Nenhum recurso cadastrado
                    </h2>

                    <p className="text-gray-500 mt-1">
                        Cadastre o primeiro recurso para começar.
                    </p>

                </div>

            ) : (

                /* =================================================
                   CARDS
                ================================================= */

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">

                    {recursos.map((recurso) => (

                        <div
                            key={recurso.id_recurso}
                            className="bg-white rounded-xl shadow border border-gray-100 overflow-hidden"
                        >

                            {/* ------------------------------------------------
                                TOPO
                            ------------------------------------------------ */}

                            <div className="p-5">

                                <div className="flex justify-between items-start">

                                    <div className="flex gap-3">

                                        <div className="bg-green-100 p-3 rounded-lg">

                                            {recurso.tipo_recurso === "Ferramenta" ? (
                                                <Tractor
                                                    className="text-green-700"
                                                    size={24}
                                                />
                                            ) : (
                                                <Package
                                                    className="text-green-700"
                                                    size={24}
                                                />
                                            )}

                                        </div>

                                        <div>

                                            <h2 className="font-bold text-gray-800">
                                                {recurso.nome}
                                            </h2>

                                            <p className="text-sm text-gray-500">
                                                {recurso.categoria}
                                            </p>

                                        </div>

                                    </div>


                                    {/* STATUS */}

                                    <span
                                        className={`text-xs px-2 py-1 rounded-full font-medium
                                            ${recurso.status === "Disponível"
                                                ? "bg-green-100 text-green-700"
                                                : recurso.status === "Vendido"
                                                    ? "bg-gray-200 text-gray-700"
                                                    : "bg-yellow-100 text-yellow-700"
                                            }
                                        `}
                                    >
                                        {recurso.status}
                                    </span>

                                </div>


                                {/* DESCRIÇÃO */}

                                {recurso.descricao && (

                                    <p className="text-sm text-gray-600 mt-4">
                                        {recurso.descricao}
                                    </p>

                                )}


                                {/* =================================================
                                    INFORMAÇÕES
                                ================================================= */}

                                <div className="mt-4 space-y-2 text-sm">

                                    <div className="flex justify-between">

                                        <span className="text-gray-500">
                                            Quantidade
                                        </span>

                                        <strong>
                                            {recurso.quantidade}{" "}
                                            {recurso.unidade}
                                        </strong>

                                    </div>


                                    <div className="flex justify-between">

                                        <span className="text-gray-500">
                                            Valor
                                        </span>

                                        <strong className="text-green-700">
                                            {formatarValor(recurso.valor)}
                                        </strong>

                                    </div>


                                    <div className="flex justify-between">

                                        <span className="text-gray-500">
                                            Produtor
                                        </span>

                                        <strong>
                                            {nomeProdutor(
                                                recurso.id_produtor
                                            )}
                                        </strong>

                                    </div>


                                    <div className="flex justify-between">

                                        <span className="text-gray-500">
                                            Cooperativa
                                        </span>

                                        <strong>
                                            {nomeCooperativa(
                                                recurso.id_cooperativa
                                            )}
                                        </strong>

                                    </div>

                                </div>


                                {/* =================================================
                                    FERRAMENTA
                                ================================================= */}

                                {recurso.tipo_recurso === "Ferramenta" &&
                                    recurso.ano && (

                                        <div className="flex items-center gap-2 text-sm text-gray-600 mt-3">

                                            <Calendar size={16} />

                                            Ano: {recurso.ano}

                                        </div>

                                    )}


                                {/* =================================================
                                    PRODUTO
                                ================================================= */}

                                {recurso.tipo_recurso === "Produto" && (

                                    <div className="mt-3 space-y-1 text-sm text-gray-600">

                                        {recurso.data_producao && (

                                            <div className="flex items-center gap-2">

                                                <Calendar size={15} />

                                                Produção:{" "}
                                                {new Date(
                                                    recurso.data_producao
                                                ).toLocaleDateString("pt-BR")}

                                            </div>

                                        )}

                                        {recurso.horario_producao && (

                                            <div className="flex items-center gap-2">

                                                <Clock size={15} />

                                                Horário:{" "}
                                                {String(
                                                    recurso.horario_producao
                                                ).substring(0, 5)}

                                            </div>

                                        )}

                                    </div>

                                )}


                                {/* =================================================
                                    LOCALIZAÇÃO
                                ================================================= */}

                                {(recurso.cidade || recurso.estado) && (

                                    <div className="flex items-center gap-2 mt-3 text-sm text-gray-600">

                                        <MapPin size={16} />

                                        {recurso.cidade || ""}

                                        {recurso.cidade &&
                                            recurso.estado
                                            ? " - "
                                            : ""}

                                        {recurso.estado || ""}

                                    </div>

                                )}

                            </div>


                            {/* =================================================
                                BOTÕES
                            ================================================= */}

                            <div className="border-t p-4 flex gap-2">

                                {recurso.status !== "Vendido" && (

                                    <>

                                        <button
                                            onClick={() =>
                                                abrirEdicao(recurso)
                                            }
                                            className="flex-1 flex justify-center items-center gap-2 border border-blue-500 text-blue-600 hover:bg-blue-50 py-2 rounded-lg"
                                        >

                                            <Pencil size={16} />

                                            Editar

                                        </button>


                                        <button
                                            onClick={() =>
                                                marcarComoVendido(recurso)
                                            }
                                            className="flex-1 flex justify-center items-center gap-2 bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg"
                                        >

                                            <ShoppingCart size={16} />

                                            Vender

                                        </button>

                                    </>

                                )}


                                {recurso.status === "Vendido" && (

                                    <div className="flex-1 flex justify-center items-center gap-2 bg-gray-100 text-gray-600 py-2 rounded-lg">

                                        <CheckCircle size={17} />

                                        Vendido

                                    </div>

                                )}


                                {recurso.status !== "Vendido" && (

                                    <button
                                        onClick={() =>
                                            excluir(recurso)
                                        }
                                        className="px-3 border border-red-500 text-red-600 hover:bg-red-50 rounded-lg"
                                        title="Excluir"
                                    >

                                        <Trash2 size={17} />

                                    </button>

                                )}

                            </div>

                        </div>

                    ))}

                </div>

            )}


            {/* ============================================================
                MODAL
            ============================================================ */}

            {modalAberto && (

                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">

                    <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">

                        {/* ----------------------------------------------------
                            HEADER
                        ---------------------------------------------------- */}

                        <div className="flex justify-between items-center p-6 border-b">

                            <div>

                                <h2 className="text-xl font-bold text-gray-800">

                                    {modoEdicao
                                        ? "Editar recurso"
                                        : "Novo recurso"}

                                </h2>

                                <p className="text-sm text-gray-500 mt-1">

                                    Cadastre informações do produto ou
                                    ferramenta.

                                </p>

                            </div>

                            <button
                                onClick={fecharModal}
                                className="text-gray-500 hover:text-gray-800"
                            >

                                <X size={24} />

                            </button>

                        </div>


                        {/* ----------------------------------------------------
                            FORM
                        ---------------------------------------------------- */}

                        <form
                            onSubmit={salvar}
                            className="p-6 space-y-5"
                        >

                            {erro && (

                                <div className="p-3 rounded-lg bg-red-100 text-red-700 text-sm">
                                    {erro}
                                </div>

                            )}


                            {/* =================================================
                                TIPO
                            ================================================= */}

                            <div>

                                <label className="block text-sm font-medium mb-2">
                                    Tipo do recurso *
                                </label>

                                <div className="grid grid-cols-2 gap-3">

                                    <button
                                        type="button"
                                        onClick={() =>
                                            setForm({
                                                ...form,
                                                tipo_recurso: "Produto",
                                                unidade: "kg",
                                                ano: ""
                                            })
                                        }
                                        className={`p-4 border rounded-lg flex items-center justify-center gap-2
                                            ${form.tipo_recurso === "Produto"
                                                ? "border-green-600 bg-green-50 text-green-700"
                                                : "border-gray-300"
                                            }
                                        `}
                                    >

                                        <Package size={20} />

                                        Produto

                                    </button>


                                    <button
                                        type="button"
                                        onClick={() =>
                                            setForm({
                                                ...form,
                                                tipo_recurso: "Ferramenta",
                                                unidade: "unidade",
                                                data_producao: "",
                                                horario_producao: ""
                                            })
                                        }
                                        className={`p-4 border rounded-lg flex items-center justify-center gap-2
                                            ${form.tipo_recurso === "Ferramenta"
                                                ? "border-green-600 bg-green-50 text-green-700"
                                                : "border-gray-300"
                                            }
                                        `}
                                    >

                                        <Tractor size={20} />

                                        Ferramenta

                                    </button>

                                </div>

                            </div>


                            {/* =================================================
                                NOME / CATEGORIA
                            ================================================= */}

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                                <div>

                                    <label className="block text-sm font-medium mb-1">
                                        Nome *
                                    </label>

                                    <input
                                        type="text"
                                        name="nome"
                                        value={form.nome}
                                        onChange={handleChange}
                                        placeholder={
                                            form.tipo_recurso === "Produto"
                                                ? "Ex.: Tomate Italiano"
                                                : "Ex.: Trator Massey Ferguson"
                                        }
                                        className="w-full border rounded-lg px-3 py-2"
                                        required
                                    />

                                </div>


                                <div>

                                    <label className="block text-sm font-medium mb-1">
                                        Categoria *
                                    </label>

                                    <select
                                        name="categoria"
                                        value={form.categoria}
                                        onChange={handleChange}
                                        className="w-full border rounded-lg px-3 py-2"
                                        required
                                    >

                                        <option value="">
                                            Selecione
                                        </option>

                                        {form.tipo_recurso === "Ferramenta" ? (
                                            <>
                                                <option value="Trator">
                                                    Trator
                                                </option>

                                                <option value="Carro">
                                                    Carro
                                                </option>

                                                <option value="Pá">
                                                    Pá
                                                </option>

                                                <option value="Enxada">
                                                    Enxada
                                                </option>

                                                <option value="Arado">
                                                    Arado
                                                </option>

                                                <option value="Colheitadeira">
                                                    Colheitadeira
                                                </option>

                                                <option value="Equipamento">
                                                    Equipamento
                                                </option>

                                                <option value="Outro">
                                                    Outro
                                                </option>
                                            </>
                                        ) : (
                                            <>
                                                <option value="Semente">
                                                    Semente
                                                </option>

                                                <option value="Fruta">
                                                    Fruta
                                                </option>

                                                <option value="Verdura">
                                                    Verdura
                                                </option>

                                                <option value="Legume">
                                                    Legume
                                                </option>

                                                <option value="Leite">
                                                    Leite
                                                </option>

                                                <option value="Carne">
                                                    Carne
                                                </option>

                                                <option value="Grãos">
                                                    Grãos
                                                </option>

                                                <option value="Outro">
                                                    Outro
                                                </option>
                                            </>
                                        )}

                                    </select>

                                </div>

                            </div>


                            {/* =================================================
                                DESCRIÇÃO
                            ================================================= */}

                            <div>

                                <label className="block text-sm font-medium mb-1">
                                    Descrição
                                </label>

                                <textarea
                                    name="descricao"
                                    value={form.descricao}
                                    onChange={handleChange}
                                    rows="3"
                                    placeholder="Descreva o recurso..."
                                    className="w-full border rounded-lg px-3 py-2"
                                />

                            </div>


                            {/* =================================================
                                PRODUTOR / COOPERATIVA
                            ================================================= */}

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                                <div>

                                    <label className="block text-sm font-medium mb-1">
                                        Produtor responsável *
                                    </label>

                                    <select
                                        name="id_produtor"
                                        value={form.id_produtor}
                                        onChange={handleChange}
                                        className="w-full border rounded-lg px-3 py-2"
                                        required
                                    >

                                        <option value="">
                                            Selecione o produtor
                                        </option>

                                        {produtores.map((produtor) => (

                                            <option
                                                key={produtor.id_produtor}
                                                value={produtor.id_produtor}
                                            >
                                                {produtor.nome}
                                            </option>

                                        ))}

                                    </select>

                                </div>


                                <div>

                                    <label className="block text-sm font-medium mb-1">
                                        Cooperativa responsável
                                    </label>

                                    <select
                                        name="id_cooperativa"
                                        value={form.id_cooperativa}
                                        onChange={handleChange}
                                        className="w-full border rounded-lg px-3 py-2"
                                    >

                                        <option value="">
                                            Selecione a cooperativa
                                        </option>

                                        {cooperativas.map((cooperativa) => (

                                            <option
                                                key={cooperativa.id_cooperativa}
                                                value={cooperativa.id_cooperativa}
                                            >
                                                {cooperativa.nome}
                                            </option>

                                        ))}

                                    </select>

                                </div>

                            </div>


                            {/* =================================================
                                QUANTIDADE / UNIDADE / VALOR
                            ================================================= */}

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

                                <div>

                                    <label className="block text-sm font-medium mb-1">
                                        Quantidade *
                                    </label>

                                    <input
                                        type="number"
                                        step="0.001"
                                        min="0"
                                        name="quantidade"
                                        value={form.quantidade}
                                        onChange={handleChange}
                                        className="w-full border rounded-lg px-3 py-2"
                                        required
                                    />

                                </div>


                                <div>

                                    <label className="block text-sm font-medium mb-1">
                                        Unidade *
                                    </label>

                                    <select
                                        name="unidade"
                                        value={form.unidade}
                                        onChange={handleChange}
                                        className="w-full border rounded-lg px-3 py-2"
                                    >

                                        <option value="kg">
                                            kg
                                        </option>

                                        <option value="litro">
                                            Litro
                                        </option>

                                        <option value="unidade">
                                            Unidade
                                        </option>

                                        <option value="saca">
                                            Saca
                                        </option>

                                        <option value="tonelada">
                                            Tonelada
                                        </option>

                                    </select>

                                </div>


                                <div>

                                    <label className="block text-sm font-medium mb-1">
                                        Valor (R$) *
                                    </label>

                                    <input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        name="valor"
                                        value={form.valor}
                                        onChange={handleChange}
                                        placeholder="0,00"
                                        className="w-full border rounded-lg px-3 py-2"
                                        required
                                    />

                                </div>

                            </div>


                            {/* =================================================
                                FERRAMENTA
                            ================================================= */}

                            {form.tipo_recurso === "Ferramenta" && (

                                <div>

                                    <label className="block text-sm font-medium mb-1">
                                        Ano de fabricação
                                    </label>

                                    <input
                                        type="number"
                                        name="ano"
                                        value={form.ano}
                                        onChange={handleChange}
                                        min="1900"
                                        max="2100"
                                        placeholder="Ex.: 2022"
                                        className="w-full border rounded-lg px-3 py-2"
                                    />

                                </div>

                            )}


                            {/* =================================================
                                PRODUTO
                            ================================================= */}

                            {form.tipo_recurso === "Produto" && (

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

                                    <div>

                                        <label className="block text-sm font-medium mb-1">
                                            Data de produção
                                        </label>

                                        <input
                                            type="date"
                                            name="data_producao"
                                            value={form.data_producao}
                                            onChange={handleChange}
                                            className="w-full border rounded-lg px-3 py-2"
                                        />

                                    </div>


                                    <div>

                                        <label className="block text-sm font-medium mb-1">
                                            Horário de produção
                                        </label>

                                        <input
                                            type="time"
                                            name="horario_producao"
                                            value={form.horario_producao}
                                            onChange={handleChange}
                                            className="w-full border rounded-lg px-3 py-2"
                                        />

                                    </div>


                                    <div>

                                        <label className="block text-sm font-medium mb-1">
                                            Qualidade
                                        </label>

                                        <select
                                            name="qualidade"
                                            value={form.qualidade}
                                            onChange={handleChange}
                                            className="w-full border rounded-lg px-3 py-2"
                                        >

                                            <option value="">
                                                Selecione
                                            </option>

                                            <option value="1">
                                                ★☆☆☆☆
                                            </option>

                                            <option value="2">
                                                ★★☆☆☆
                                            </option>

                                            <option value="3">
                                                ★★★☆☆
                                            </option>

                                            <option value="4">
                                                ★★★★☆
                                            </option>

                                            <option value="5">
                                                ★★★★★
                                            </option>

                                        </select>

                                    </div>

                                </div>

                            )}


                            {/* =================================================
                                LOCALIZAÇÃO
                            ================================================= */}

                            <div className="border-t pt-5">

                                <div className="flex items-center gap-2 mb-4">

                                    <MapPin
                                        size={20}
                                        className="text-green-600"
                                    />

                                    <h3 className="font-semibold">
                                        Localização
                                    </h3>

                                </div>


                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

                                    <div className="md:col-span-2">

                                        <label className="block text-sm font-medium mb-1">
                                            Endereço
                                        </label>

                                        <input
                                            type="text"
                                            name="endereco"
                                            value={form.endereco}
                                            onChange={handleChange}
                                            placeholder="Ex.: Zona Rural"
                                            className="w-full border rounded-lg px-3 py-2"
                                        />

                                    </div>


                                    <div>

                                        <label className="block text-sm font-medium mb-1">
                                            Cidade
                                        </label>

                                        <input
                                            type="text"
                                            name="cidade"
                                            value={form.cidade}
                                            onChange={handleChange}
                                            placeholder="Ex.: Quixadá"
                                            className="w-full border rounded-lg px-3 py-2"
                                        />

                                    </div>

                                </div>


                                <div className="mt-4">

                                    <label className="block text-sm font-medium mb-1">
                                        Estado
                                    </label>

                                    <select
                                        name="estado"
                                        value={form.estado}
                                        onChange={handleChange}
                                        className="w-full border rounded-lg px-3 py-2"
                                    >

                                        <option value="CE">
                                            Ceará - CE
                                        </option>

                                        <option value="PI">
                                            Piauí - PI
                                        </option>

                                        <option value="RN">
                                            Rio Grande do Norte - RN
                                        </option>

                                        <option value="PB">
                                            Paraíba - PB
                                        </option>

                                        <option value="PE">
                                            Pernambuco - PE
                                        </option>

                                        <option value="BA">
                                            Bahia - BA
                                        </option>

                                        <option value="MA">
                                            Maranhão - MA
                                        </option>

                                        <option value="AL">
                                            Alagoas - AL
                                        </option>

                                        <option value="SE">
                                            Sergipe - SE
                                        </option>

                                    </select>

                                </div>

                            </div>


                            {/* =================================================
                                BOTÕES
                            ================================================= */}

                            <div className="flex justify-end gap-3 pt-4 border-t">

                                <button
                                    type="button"
                                    onClick={fecharModal}
                                    className="px-5 py-2 border rounded-lg hover:bg-gray-50"
                                >
                                    Cancelar
                                </button>

                                <button
                                    type="submit"
                                    className="px-5 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg"
                                >

                                    {modoEdicao
                                        ? "Salvar alterações"
                                        : "Cadastrar recurso"}

                                </button>

                            </div>

                        </form>

                    </div>

                </div>

            )}

        </div>
    );
}

export default Recurso;

