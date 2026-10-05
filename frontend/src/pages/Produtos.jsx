import React, { useEffect, useState } from "react";
import {
    Plus,
    Trash2,
    Pencil,
    X,
    Package,
    Star
} from "lucide-react";

import {
    produtoCooperativaAPI,
    cooperativaAPI,
    produtorAPI
} from "../services/api";

function Produtos() {
    const [produtos, setProdutos] = useState([]);
    const [cooperativas, setCooperativas] = useState([]);
    const [produtores, setProdutores] = useState([]);

    const [loading, setLoading] = useState(true);
    const [erro, setErro] = useState(null);

    const [modalAberto, setModalAberto] = useState(false);
    const [editando, setEditando] = useState(null);

    const [form, setForm] = useState({
        id_cooperativa: "",
        id_produtor: "",
        nome_produto: "",
        qualidade: 5,
        quantidade_vendida: "",
        unidade: "kg"
    });

    // =========================================================
    // CARREGAR DADOS
    // =========================================================

    useEffect(() => {
        carregarDados();
    }, []);

    async function carregarDados() {
        setLoading(true);
        setErro(null);

        // -----------------------------------------------------
        // PRODUTOS
        // -----------------------------------------------------

        try {
            const response = await produtoCooperativaAPI.listar();

            console.log(
                "Produtos recebidos do FastAPI:",
                response.data
            );

            setProdutos(
                Array.isArray(response.data)
                    ? response.data
                    : []
            );

        } catch (error) {
            console.error(
                "Erro ao carregar produtos:",
                error.response?.data || error
            );

            setProdutos([]);

            setErro(
                error.response?.data?.detail ||
                "Não foi possível carregar os produtos."
            );
        }

        // -----------------------------------------------------
        // COOPERATIVAS
        // -----------------------------------------------------

        try {
            const response = await cooperativaAPI.listar();

            console.log(
                "Cooperativas recebidas do FastAPI:",
                response.data
            );

            setCooperativas(
                Array.isArray(response.data)
                    ? response.data
                    : []
            );

        } catch (error) {
            console.error(
                "Erro ao carregar cooperativas:",
                error.response?.data || error
            );

            setCooperativas([]);

            setErro(
                (anterior) =>
                    anterior ||
                    error.response?.data?.detail ||
                    "Não foi possível carregar as cooperativas."
            );
        }

        // -----------------------------------------------------
        // PRODUTORES
        // -----------------------------------------------------

        try {
            const response = await produtorAPI.listar();

            console.log(
                "Produtores recebidos do FastAPI:",
                response.data
            );

            setProdutores(
                Array.isArray(response.data)
                    ? response.data
                    : []
            );

        } catch (error) {
            console.error(
                "Erro ao carregar produtores:",
                error.response?.data || error
            );

            setProdutores([]);

            setErro(
                (anterior) =>
                    anterior ||
                    error.response?.data?.detail ||
                    "Não foi possível carregar os produtores."
            );
        }

        setLoading(false);
    }

    // =========================================================
    // ALTERAR FORMULÁRIO
    // =========================================================

    function handleChange(event) {
        const { name, value } = event.target;

        setForm((anterior) => ({
            ...anterior,
            [name]: value
        }));
    }

    // =========================================================
    // NOVO PRODUTO
    // =========================================================

    function abrirNovoProduto() {
        setEditando(null);

        setForm({
            id_cooperativa: "",
            id_produtor: "",
            nome_produto: "",
            qualidade: 5,
            quantidade_vendida: "",
            unidade: "kg"
        });

        setModalAberto(true);
    }

    // =========================================================
    // EDITAR PRODUTO
    // =========================================================

    function editarProduto(produto) {
        setEditando(produto);

        setForm({
            id_cooperativa: produto.id_cooperativa,
            id_produtor: produto.id_produtor,
            nome_produto: produto.nome_produto || "",
            qualidade: produto.qualidade || 5,
            quantidade_vendida:
                produto.quantidade_vendida ?? "",
            unidade: produto.unidade || "kg"
        });

        setModalAberto(true);
    }

    // =========================================================
    // FECHAR MODAL
    // =========================================================

    function fecharModal() {
        setModalAberto(false);
        setEditando(null);
    }

    // =========================================================
    // SALVAR PRODUTO
    // =========================================================

    async function salvarProduto(event) {
        event.preventDefault();

        if (!form.id_cooperativa) {
            alert("Selecione uma cooperativa.");
            return;
        }

        if (!form.id_produtor) {
            alert("Selecione o produtor.");
            return;
        }

        if (!form.nome_produto.trim()) {
            alert("Informe o nome do produto.");
            return;
        }

        if (
            form.quantidade_vendida === "" ||
            Number(form.quantidade_vendida) < 0
        ) {
            alert("Informe uma quantidade válida.");
            return;
        }

        try {
            const dados = {
                id_cooperativa:
                    Number(form.id_cooperativa),

                id_produtor:
                    Number(form.id_produtor),

                nome_produto:
                    form.nome_produto.trim(),

                qualidade:
                    Number(form.qualidade),

                quantidade_vendida:
                    Number(form.quantidade_vendida),

                unidade:
                    form.unidade
            };

            console.log(
                "Enviando produto:",
                dados
            );

            // -------------------------------------------------
            // EDITAR
            // -------------------------------------------------

            if (editando) {
                await produtoCooperativaAPI.atualizar(
                    editando.id_produto,
                    {
                        id_produtor:
                            dados.id_produtor,

                        nome_produto:
                            dados.nome_produto,

                        qualidade:
                            dados.qualidade,

                        quantidade_vendida:
                            dados.quantidade_vendida,

                        unidade:
                            dados.unidade
                    }
                );

                alert(
                    "Produto atualizado com sucesso!"
                );

            }

            // -------------------------------------------------
            // CRIAR
            // -------------------------------------------------

            else {
                await produtoCooperativaAPI.criar(
                    dados
                );

                alert(
                    "Produto cadastrado com sucesso!"
                );
            }

            fecharModal();

            await carregarDados();

        } catch (error) {
            console.error(
                "Erro ao salvar produto:",
                error.response?.data || error
            );

            alert(
                error.response?.data?.detail ||
                "Erro ao salvar produto."
            );
        }
    }

    // =========================================================
    // EXCLUIR PRODUTO
    // =========================================================

    async function excluirProduto(id) {
        const confirmar = window.confirm(
            "Deseja realmente excluir este produto?"
        );

        if (!confirmar) {
            return;
        }

        try {
            await produtoCooperativaAPI.excluir(id);

            setProdutos((anterior) =>
                anterior.filter(
                    (produto) =>
                        produto.id_produto !== id
                )
            );

            alert(
                "Produto excluído com sucesso."
            );

        } catch (error) {
            console.error(
                "Erro ao excluir produto:",
                error.response?.data || error
            );

            alert(
                error.response?.data?.detail ||
                "Erro ao excluir produto."
            );
        }
    }

    // =========================================================
    // ESTRELAS
    // =========================================================

    function renderEstrelas(qualidade) {
        const valor = Number(qualidade) || 0;

        return (
            <div className="estrelas">
                {[1, 2, 3, 4, 5].map((numero) => (
                    <Star
                        key={numero}
                        size={17}
                        fill={
                            numero <= valor
                                ? "currentColor"
                                : "none"
                        }
                    />
                ))}
            </div>
        );
    }

    // =========================================================
    // LOADING
    // =========================================================

    if (loading) {
        return (
            <div className="pagina-produtos">
                <div className="loading">
                    Carregando produtos...
                </div>
            </div>
        );
    }

    // =========================================================
    // INTERFACE
    // =========================================================

    return (
        <div className="pagina-produtos">

            {/* CABEÇALHO */}

            <div className="pagina-header">

                <div>
                    <h1>
                        <Package size={30} />
                        Produtos
                    </h1>

                    <p>
                        Gerencie os produtos produzidos
                        pelas cooperativas.
                    </p>
                </div>

                <button
                    className="btn-primary"
                    onClick={abrirNovoProduto}
                >
                    <Plus size={18} />
                    Novo Produto
                </button>

            </div>

            {/* ERRO */}

            {erro && (
                <div className="alerta-erro">
                    {erro}
                </div>
            )}

            {/* TABELA */}

            <div className="card-tabela">

                {produtos.length === 0 ? (

                    <div className="estado-vazio">

                        <Package size={50} />

                        <h3>
                            Nenhum produto cadastrado
                        </h3>

                        <p>
                            Cadastre o primeiro produto
                            da cooperativa.
                        </p>

                        <button
                            className="btn-primary"
                            onClick={abrirNovoProduto}
                        >
                            <Plus size={18} />
                            Cadastrar produto
                        </button>

                    </div>

                ) : (

                    <div className="tabela-container">

                        <table>

                            <thead>

                                <tr>
                                    <th>ID</th>
                                    <th>Produto</th>
                                    <th>Cooperativa</th>
                                    <th>Produtor</th>
                                    <th>Tipo</th>
                                    <th>Qualidade</th>
                                    <th>Quantidade Vendida</th>
                                    <th>Unidade</th>
                                    <th>Ações</th>
                                </tr>

                            </thead>

                            <tbody>

                                {produtos.map(
                                    (produto) => (

                                        <tr
                                            key={
                                                produto.id_produto
                                            }
                                        >

                                            <td>
                                                #
                                                {
                                                    produto.id_produto
                                                }
                                            </td>

                                            <td>
                                                <div className="produto-nome">

                                                    <div className="produto-icone">
                                                        <Package
                                                            size={18}
                                                        />
                                                    </div>

                                                    <strong>
                                                        {
                                                            produto.nome_produto
                                                        }
                                                    </strong>

                                                </div>
                                            </td>

                                            <td>
                                                {
                                                    produto.cooperativa ||
                                                    "Não informado"
                                                }
                                            </td>

                                            <td>
                                                {
                                                    produto.produtor ||
                                                    "Não informado"
                                                }
                                            </td>

                                            <td>
                                                {
                                                    produto.tipo_produtor ||
                                                    "-"
                                                }
                                            </td>

                                            <td>
                                                {
                                                    renderEstrelas(
                                                        produto.qualidade
                                                    )
                                                }
                                            </td>

                                            <td>
                                                {Number(
                                                    produto.quantidade_vendida || 0
                                                ).toLocaleString(
                                                    "pt-BR"
                                                )}
                                            </td>

                                            <td>
                                                <span className="badge-unidade">
                                                    {
                                                        produto.unidade
                                                    }
                                                </span>
                                            </td>

                                            <td>

                                                <div className="acoes">

                                                    <button
                                                        className="btn-editar"
                                                        title="Editar"
                                                        onClick={() =>
                                                            editarProduto(
                                                                produto
                                                            )
                                                        }
                                                    >
                                                        <Pencil
                                                            size={17}
                                                        />
                                                    </button>

                                                    <button
                                                        className="btn-excluir"
                                                        title="Excluir"
                                                        onClick={() =>
                                                            excluirProduto(
                                                                produto.id_produto
                                                            )
                                                        }
                                                    >
                                                        <Trash2
                                                            size={17}
                                                        />
                                                    </button>

                                                </div>

                                            </td>

                                        </tr>

                                    )
                                )}

                            </tbody>

                        </table>

                    </div>

                )}

            </div>

            {/* =====================================================
                MODAL
            ====================================================== */}

            {modalAberto && (

                <div
                    className="modal-overlay"
                    onClick={fecharModal}
                >

                    <div
                        className="modal"
                        onClick={(event) =>
                            event.stopPropagation()
                        }
                    >

                        <div className="modal-header">

                            <div>

                                <h2>
                                    {editando
                                        ? "Editar Produto"
                                        : "Novo Produto"}
                                </h2>

                                <p>
                                    Informe os dados do
                                    produto.
                                </p>

                            </div>

                            <button
                                className="btn-fechar"
                                onClick={fecharModal}
                            >
                                <X size={22} />
                            </button>

                        </div>

                        {/* FORMULÁRIO */}

                        <form
                            onSubmit={salvarProduto}
                        >

                            {/* COOPERATIVA */}

                            <div className="form-group">

                                <label>
                                    Cooperativa *
                                </label>

                                <select
                                    name="id_cooperativa"
                                    value={
                                        form.id_cooperativa
                                    }
                                    onChange={
                                        handleChange
                                    }
                                    disabled={
                                        !!editando
                                    }
                                    required
                                >

                                    <option value="">
                                        Selecione a cooperativa
                                    </option>

                                    {cooperativas.length === 0 ? (

                                        <option
                                            value=""
                                            disabled
                                        >
                                            Nenhuma cooperativa encontrada
                                        </option>

                                    ) : (

                                        cooperativas.map(
                                            (cooperativa) => (

                                                <option
                                                    key={
                                                        cooperativa.id_cooperativa
                                                    }
                                                    value={
                                                        cooperativa.id_cooperativa
                                                    }
                                                >
                                                    {
                                                        cooperativa.nome ||
                                                        `Cooperativa #${cooperativa.id_cooperativa}`
                                                    }
                                                </option>

                                            )
                                        )

                                    )}

                                </select>

                            </div>

                            {/* PRODUTOR */}

                            <div className="form-group">

                                <label>
                                    Produtor *
                                </label>

                                <select
                                    name="id_produtor"
                                    value={
                                        form.id_produtor
                                    }
                                    onChange={
                                        handleChange
                                    }
                                    required
                                >

                                    <option value="">
                                        Selecione o produtor
                                    </option>

                                    {produtores.length === 0 ? (

                                        <option
                                            value=""
                                            disabled
                                        >
                                            Nenhum produtor encontrado
                                        </option>

                                    ) : (

                                        produtores.map(
                                            (produtor) => (

                                                <option
                                                    key={
                                                        produtor.id_produtor
                                                    }
                                                    value={
                                                        produtor.id_produtor
                                                    }
                                                >
                                                    {produtor.nome}
                                                    {" - "}
                                                    {produtor.tipo}
                                                </option>

                                            )
                                        )

                                    )}

                                </select>

                            </div>

                            {/* NOME PRODUTO */}

                            <div className="form-group">

                                <label>
                                    Nome do Produto *
                                </label>

                                <input
                                    type="text"
                                    name="nome_produto"
                                    value={
                                        form.nome_produto
                                    }
                                    onChange={
                                        handleChange
                                    }
                                    placeholder="Ex.: Leite, Milho, Feijão..."
                                    maxLength={150}
                                    required
                                />

                            </div>

                            {/* QUALIDADE */}

                            <div className="form-group">

                                <label>
                                    Qualidade *
                                </label>

                                <div className="seletor-estrelas">

                                    {[1, 2, 3, 4, 5].map(
                                        (numero) => (

                                            <button
                                                type="button"
                                                key={numero}
                                                onClick={() =>
                                                    setForm(
                                                        (
                                                            anterior
                                                        ) => ({
                                                            ...anterior,
                                                            qualidade:
                                                                numero
                                                        })
                                                    )
                                                }
                                                className={
                                                    numero <=
                                                        form.qualidade
                                                        ? "estrela ativa"
                                                        : "estrela"
                                                }
                                            >
                                                <Star
                                                    size={28}
                                                    fill={
                                                        numero <=
                                                            form.qualidade
                                                            ? "currentColor"
                                                            : "none"
                                                    }
                                                />
                                            </button>

                                        )
                                    )}

                                </div>

                                <small>
                                    {form.qualidade} de 5 estrelas
                                </small>

                            </div>

                            {/* QUANTIDADE + UNIDADE */}

                            <div className="form-row">

                                <div className="form-group">

                                    <label>
                                        Quantidade Vendida *
                                    </label>

                                    <input
                                        type="number"
                                        name="quantidade_vendida"
                                        value={
                                            form.quantidade_vendida
                                        }
                                        onChange={
                                            handleChange
                                        }
                                        placeholder="Ex.: 1500"
                                        min="0"
                                        step="0.01"
                                        required
                                    />

                                </div>

                                <div className="form-group">

                                    <label>
                                        Unidade *
                                    </label>

                                    <select
                                        name="unidade"
                                        value={
                                            form.unidade
                                        }
                                        onChange={
                                            handleChange
                                        }
                                        required
                                    >

                                        <option value="kg">
                                            Quilograma (kg)
                                        </option>

                                        <option value="litros">
                                            Litros
                                        </option>

                                        <option value="unidade">
                                            Unidade
                                        </option>

                                    </select>

                                </div>

                            </div>

                            {/* BOTÕES */}

                            <div className="modal-acoes">

                                <button
                                    type="button"
                                    className="btn-cancelar"
                                    onClick={
                                        fecharModal
                                    }
                                >
                                    Cancelar
                                </button>

                                <button
                                    type="submit"
                                    className="btn-primary"
                                >
                                    {editando
                                        ? "Salvar alterações"
                                        : "Cadastrar produto"}
                                </button>

                            </div>

                        </form>

                    </div>

                </div>

            )}

        </div>
    );
}

export default Produtos;