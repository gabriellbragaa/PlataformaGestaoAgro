import React, { useEffect, useState } from "react";
import {
    Plus,
    Trash2,
    X,
    Building,
    Search,
    MapPin,
    Users,
    Phone,
    Calendar,
    Upload,
    FileSpreadsheet
} from "lucide-react";

import { cooperativaAPI } from "../services/api";

function Cooperativas() {
    const [cooperativas, setCooperativas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [erro, setErro] = useState(null);

    const [modalAberto, setModalAberto] = useState(false);
    const [consultandoCNPJ, setConsultandoCNPJ] = useState(false);
    const [consultandoCEP, setConsultandoCEP] = useState(false);

    const [arquivo, setArquivo] = useState(null);
    const [importando, setImportando] = useState(false);
    const [resultadoImportacao, setResultadoImportacao] = useState(null);

    const [form, setForm] = useState({
        nome: "",
        cnpj: "",
        telefone: "",
        cep: "",
        endereco: "",
        bairro: "",
        cidade: "",
        estado: "",
        anos_servico: "",
        quantidade_associados: "",
        capacidade_producao: ""
    });

    useEffect(() => {
        carregarCooperativas();
    }, []);

    async function carregarCooperativas() {
        try {
            setLoading(true);
            setErro(null);

            const response = await cooperativaAPI.listar();
            setCooperativas(response.data);
        } catch (error) {
            console.error(error);
            setErro(
                error.response?.data?.detail || "Erro ao carregar cooperativas."
            );
        } finally {
            setLoading(false);
        }
    }

    function abrirModal() {
        setForm({
            nome: "",
            cnpj: "",
            telefone: "",
            cep: "",
            endereco: "",
            bairro: "",
            cidade: "",
            estado: "",
            anos_servico: "",
            quantidade_associados: "",
            capacidade_producao: ""
        });
        setModalAberto(true);
    }

    function fecharModal() {
        setModalAberto(false);
    }

    function handleChange(event) {
        const { name, value } = event.target;

        let valorFormatado = value;
        if (name === "cnpj") {
            valorFormatado = formatarCNPJ(value);
        } else if (name === "cep") {
            valorFormatado = formatarCEP(value);
        }

        setForm((prev) => ({
            ...prev,
            [name]: valorFormatado
        }));
    }

    function formatarCNPJ(valor) {
        const numeros = valor.replace(/\D/g, "").slice(0, 14);
        return numeros
            .replace(/^(\d{2})(\d)/, "$1.$2")
            .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
            .replace(/\.(\d{3})(\d)/, ".$1/$2")
            .replace(/(\d{4})(\d)/, "$1-$2");
    }

    function formatarCEP(valor) {
        const numeros = valor.replace(/\D/g, "").slice(0, 8);
        return numeros.replace(/^(\d{5})(\d)/, "$1-$2");
    }

    function calcularAnosServico(dataInicio) {
        if (!dataInicio) return "";

        const inicio = new Date(dataInicio);
        if (Number.isNaN(inicio.getTime())) return "";

        const hoje = new Date();
        let anos = hoje.getFullYear() - inicio.getFullYear();
        const mes = hoje.getMonth() - inicio.getMonth();

        if (mes < 0 || (mes === 0 && hoje.getDate() < inicio.getDate())) {
            anos--;
        }

        return Math.max(anos, 0);
    }

    async function consultarCNPJ() {
        const cnpj = form.cnpj.replace(/\D/g, "");

        if (cnpj.length !== 14) {
            alert("Digite um CNPJ válido com 14 números.");
            return;
        }

        try {
            setConsultandoCNPJ(true);

            const response = await fetch(
                `https://brasilapi.com.br/api/cnpj/v1/${cnpj}`
            );

            if (!response.ok) {
                throw new Error("CNPJ não encontrado.");
            }

            const dados = await response.json();

            setForm((prev) => ({
                ...prev,
                nome: dados.nome_fantasia || dados.razao_social || "",
                telefone: dados.ddd_telefone_1 || "",
                cep: dados.cep ? formatarCEP(String(dados.cep)) : "",
                endereco: dados.logradouro || "",
                bairro: dados.bairro || "",
                cidade: dados.municipio || "",
                estado: dados.uf || "",
                anos_servico: calcularAnosServico(dados.data_inicio_atividade)
            }));

            alert("Dados da empresa encontrados.");
        } catch (error) {
            console.error(error);
            alert("Não foi possível consultar este CNPJ.");
        } finally {
            setConsultandoCNPJ(false);
        }
    }

    async function consultarCEP() {
        const cep = form.cep.replace(/\D/g, "");

        if (cep.length !== 8) {
            alert("Digite um CEP válido com 8 números.");
            return;
        }

        try {
            setConsultandoCEP(true);

            const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);

            if (!response.ok) {
                throw new Error("Erro ao consultar CEP.");
            }

            const dados = await response.json();

            if (dados.erro) {
                alert("CEP não encontrado.");
                return;
            }

            setForm((prev) => ({
                ...prev,
                endereco: dados.logradouro || "",
                bairro: dados.bairro || "",
                cidade: dados.localidade || "",
                estado: dados.uf || ""
            }));
        } catch (error) {
            console.error(error);
            alert("Erro ao consultar CEP.");
        } finally {
            setConsultandoCEP(false);
        }
    }

    function selecionarArquivo(event) {
        const selecionado = event.target.files?.[0];
        setResultadoImportacao(null);

        if (!selecionado) {
            setArquivo(null);
            return;
        }

        const extensao = selecionado.name.split(".").pop().toLowerCase();

        if (!["xlsx", "xls", "csv"].includes(extensao)) {
            alert("Selecione um arquivo .xlsx, .xls ou .csv.");
            event.target.value = "";
            setArquivo(null);
            return;
        }

        setArquivo(selecionado);
    }

    async function importarExcel() {
        if (!arquivo) {
            alert("Selecione um arquivo Excel ou CSV.");
            return;
        }

        const formData = new FormData();
        formData.append("arquivo", arquivo);

        try {
            setImportando(true);
            setResultadoImportacao(null);

            const response = await cooperativaAPI.importar(formData);
            setResultadoImportacao(response.data);
            setArquivo(null);

            const input = document.getElementById("arquivo-cooperativas");
            if (input) {
                input.value = "";
            }

            await carregarCooperativas();
        } catch (error) {
            console.error("Erro na importação:", error);
            alert(
                error.response?.data?.detail || "Erro ao importar cooperativas."
            );
        } finally {
            setImportando(false);
        }
    }

    async function cadastrarCooperativa(event) {
        event.preventDefault();

        if (!form.nome.trim()) {
            alert("Informe o nome da cooperativa.");
            return;
        }

        if (!form.cnpj.trim()) {
            alert("Informe o CNPJ.");
            return;
        }

        try {
            const dados = {
                nome: form.nome.trim(),
                cnpj: form.cnpj.trim(),
                telefone: form.telefone.trim() || null,
                cep: form.cep.replace(/\D/g, "") || null,
                endereco: form.endereco.trim() || null,
                bairro: form.bairro.trim() || null,
                cidade: form.cidade.trim() || null,
                estado: form.estado.trim() || null,
                anos_servico: form.anos_servico ? Number(form.anos_servico) : null,
                quantidade_associados: form.quantidade_associados
                    ? Number(form.quantidade_associados)
                    : null,
                capacidade_producao: form.capacidade_producao
                    ? Number(form.capacidade_producao)
                    : null,
                parcerias: []
            };

            await cooperativaAPI.criar(dados);
            alert("Cooperativa cadastrada com sucesso!");
            fecharModal();
            await carregarCooperativas();
        } catch (error) {
            console.error(error);
            alert(
                error.response?.data?.detail || "Erro ao cadastrar cooperativa."
            );
        }
    }

    async function excluirCooperativa(id) {
        const confirmar = window.confirm(
            "Deseja realmente excluir esta cooperativa?"
        );

        if (!confirmar) return;

        try {
            await cooperativaAPI.excluir(id);
            alert("Cooperativa excluída com sucesso!");
            await carregarCooperativas();
        } catch (error) {
            console.error(error);
            alert(
                error.response?.data?.detail || "Erro ao excluir cooperativa."
            );
        }
    }

    return (
        <div>
            {/* Cabeçalho */}
            <div className="page-header">
                <div>
                    <h2>Cooperativas</h2>
                    <p>Cooperativas cadastradas no sistema</p>
                </div>

                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                        flexWrap: "wrap"
                    }}
                >
                    <label
                        htmlFor="arquivo-cooperativas"
                        className="btn-secondary"
                        style={{
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: "8px"
                        }}
                    >
                        <FileSpreadsheet size={18} />
                        {arquivo ? arquivo.name : "Selecionar Excel/CSV"}
                    </label>

                    <input
                        id="arquivo-cooperativas"
                        type="file"
                        accept=".xlsx,.xls,.csv"
                        onChange={selecionarArquivo}
                        disabled={importando}
                        style={{ display: "none" }}
                    />

                    <button
                        type="button"
                        className="btn-primary"
                        onClick={importarExcel}
                        disabled={!arquivo || importando}
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            opacity: !arquivo || importando ? 0.6 : 1
                        }}
                    >
                        <Upload size={18} />
                        {importando ? "Importando..." : "Importar"}
                    </button>

                    <button
                        type="button"
                        className="btn-primary"
                        onClick={abrirModal}
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px"
                        }}
                    >
                        <Plus size={18} />
                        Nova Cooperativa
                    </button>
                </div>
            </div>

            {/* Informações do arquivo selecionado */}
            {arquivo && (
                <div
                    className="table-container"
                    style={{ padding: "12px 16px", marginBottom: "16px" }}
                >
                    <p style={{ margin: 0 }}>
                        <FileSpreadsheet
                            size={17}
                            style={{
                                verticalAlign: "middle",
                                marginRight: "8px"
                            }}
                        />
                        <strong>Arquivo selecionado:</strong> {arquivo.name}
                    </p>
                    <p style={{ margin: "8px 0 0" }}>
                        Tamanho: {(arquivo.size / 1024).toFixed(2)} KB
                    </p>
                    <p style={{ margin: "8px 0 0" }}>
                        Colunas esperadas: NOME, TELEFONE, REGIÃO e CEP.
                    </p>
                </div>
            )}

            {/* Resultado da importação */}
            {resultadoImportacao && (
                <div
                    className="table-container"
                    style={{
                        padding: "16px",
                        marginBottom: "16px"
                    }}
                >
                    <h3 style={{ marginTop: 0 }}>Resultado da importação</h3>
                    <p>{resultadoImportacao.msg}</p>

                    <div
                        style={{
                            display: "flex",
                            gap: "24px",
                            flexWrap: "wrap"
                        }}
                    >
                        <p>
                            <strong>Total de linhas:</strong>{" "}
                            {resultadoImportacao.total_linhas}
                        </p>
                        <p>
                            <strong>Inseridos:</strong> {resultadoImportacao.inseridos}
                        </p>
                        <p>
                            <strong>Ignorados:</strong> {resultadoImportacao.ignorados}
                        </p>
                        <p>
                            <strong>Erros:</strong> {resultadoImportacao.erros}
                        </p>
                    </div>

                    {resultadoImportacao.detalhes_erros?.length > 0 && (
                        <details style={{ marginTop: "12px" }}>
                            <summary
                                style={{
                                    cursor: "pointer",
                                    fontWeight: 600
                                }}
                            >
                                Ver detalhes dos erros
                            </summary>

                            <div style={{ overflowX: "auto", marginTop: "8px" }}>
                                <table className="custom-table">
                                    <thead>
                                        <tr>
                                            <th>Linha</th>
                                            <th>Nome</th>
                                            <th>Erro</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {resultadoImportacao.detalhes_erros.map((item, index) => (
                                            <tr key={index}>
                                                <td>{item.linha}</td>
                                                <td>{item.nome}</td>
                                                <td>{item.erro}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </details>
                    )}
                </div>
            )}

            {/* Carregamento */}
            {loading && (
                <div className="table-container">
                    <p>Carregando cooperativas...</p>
                </div>
            )}

            {/* Erro ao carregar */}
            {erro && (
                <div className="table-container">
                    <p style={{ color: "red" }}>{erro}</p>
                    <button
                        type="button"
                        className="btn-secondary"
                        onClick={carregarCooperativas}
                    >
                        Tentar novamente
                    </button>
                </div>
            )}

            {/* Tabela de Cooperativas */}
            {!loading && !erro && (
                <div className="table-container">
                    <table className="custom-table">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>
                                    <Building size={16} style={{ marginRight: "5px" }} />
                                    Cooperativa
                                </th>
                                <th>CNPJ</th>
                                <th>Telefone</th>
                                <th>
                                    <MapPin size={16} style={{ marginRight: "5px" }} />
                                    Localização
                                </th>
                                <th>CEP</th>
                                <th>
                                    <Calendar size={16} style={{ marginRight: "5px" }} />
                                    Anos
                                </th>
                                <th>
                                    <Users size={16} style={{ marginRight: "5px" }} />
                                    Associados
                                </th>
                                <th>Capacidade</th>
                                <th>Ações</th>
                            </tr>
                        </thead>

                        <tbody>
                            {cooperativas.length === 0 ? (
                                <tr>
                                    <td
                                        colSpan="10"
                                        style={{
                                            textAlign: "center",
                                            padding: "30px"
                                        }}
                                    >
                                        Nenhuma cooperativa cadastrada.
                                    </td>
                                </tr>
                            ) : (
                                cooperativas.map((coop) => (
                                    <tr key={coop.id_cooperativa}>
                                        <td>{coop.id_cooperativa}</td>
                                        <td style={{ fontWeight: 600 }}>
                                            {coop.nome || `Cooperativa #${coop.id_cooperativa}`}
                                        </td>
                                        <td>{coop.cnpj || "Não informado"}</td>
                                        <td>
                                            <span
                                                style={{
                                                    display: "flex",
                                                    alignItems: "center",
                                                    gap: "5px"
                                                }}
                                            >
                                                <Phone size={14} />
                                                {coop.telefone || "Não informado"}
                                            </span>
                                        </td>
                                        <td>
                                            <span
                                                style={{
                                                    display: "flex",
                                                    alignItems: "center",
                                                    gap: "5px"
                                                }}
                                            >
                                                <MapPin size={14} />
                                                {coop.cidade
                                                    ? `${coop.cidade} - ${coop.estado || ""}`
                                                    : "Não informado"}
                                            </span>
                                        </td>
                                        <td>
                                            {coop.cep
                                                ? formatarCEP(String(coop.cep))
                                                : "Não informado"}
                                        </td>
                                        <td>{coop.anos_servico ?? 0} anos</td>
                                        <td>
                                            <span
                                                style={{
                                                    display: "flex",
                                                    alignItems: "center",
                                                    gap: "5px"
                                                }}
                                            >
                                                <Users size={14} />
                                                {coop.quantidade_associados ?? 0}
                                            </span>
                                        </td>
                                        <td>{coop.capacidade_producao ?? "Não informado"}</td>
                                        <td>
                                            <button
                                                type="button"
                                                className="btn-danger"
                                                onClick={() =>
                                                    excluirCooperativa(coop.id_cooperativa)
                                                }
                                                title="Excluir cooperativa"
                                                style={{
                                                    background: "none",
                                                    border: "none",
                                                    cursor: "pointer",
                                                    color: "#dc2626"
                                                }}
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Modal de Cadastro */}
            {modalAberto && (
                <div
                    className="modal-overlay"
                    style={{
                        position: "fixed",
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: "rgba(0, 0, 0, 0.5)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        zIndex: 1000
                    }}
                >
                    <div
                        className="modal-content"
                        style={{
                            backgroundColor: "#fff",
                            padding: "24px",
                            borderRadius: "8px",
                            maxWidth: "600px",
                            width: "100%",
                            maxHeight: "90vh",
                            overflowY: "auto"
                        }}
                    >
                        <div
                            style={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                marginBottom: "16px"
                            }}
                        >
                            <h3>Cadastrar Nova Cooperativa</h3>
                            <button
                                type="button"
                                onClick={fecharModal}
                                style={{
                                    background: "none",
                                    border: "none",
                                    cursor: "pointer"
                                }}
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={cadastrarCooperativa}>
                            <div style={{ display: "grid", gap: "12px" }}>
                                <div>
                                    <label>CNPJ:</label>
                                    <div style={{ display: "flex", gap: "8px" }}>
                                        <input
                                            type="text"
                                            name="cnpj"
                                            value={form.cnpj}
                                            onChange={handleChange}
                                            placeholder="00.000.000/0000-00"
                                            maxLength={18}
                                            required
                                            style={{ flex: 1 }}
                                        />
                                        <button
                                            type="button"
                                            className="btn-secondary"
                                            onClick={consultarCNPJ}
                                            disabled={consultandoCNPJ}
                                        >
                                            {consultandoCNPJ ? (
                                                "Consultando..."
                                            ) : (
                                                <Search size={16} />
                                            )}
                                        </button>
                                    </div>
                                </div>

                                <div>
                                    <label>Nome:</label>
                                    <input
                                        type="text"
                                        name="nome"
                                        value={form.nome}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>

                                <div>
                                    <label>Telefone:</label>
                                    <input
                                        type="text"
                                        name="telefone"
                                        value={form.telefone}
                                        onChange={handleChange}
                                    />
                                </div>

                                <div>
                                    <label>CEP:</label>
                                    <div style={{ display: "flex", gap: "8px" }}>
                                        <input
                                            type="text"
                                            name="cep"
                                            value={form.cep}
                                            onChange={handleChange}
                                            placeholder="00000-000"
                                            maxLength={9}
                                            style={{ flex: 1 }}
                                        />
                                        <button
                                            type="button"
                                            className="btn-secondary"
                                            onClick={consultarCEP}
                                            disabled={consultandoCEP}
                                        >
                                            {consultandoCEP ? (
                                                "Consultando..."
                                            ) : (
                                                <Search size={16} />
                                            )}
                                        </button>
                                    </div>
                                </div>

                                <div>
                                    <label>Endereço:</label>
                                    <input
                                        type="text"
                                        name="endereco"
                                        value={form.endereco}
                                        onChange={handleChange}
                                    />
                                </div>

                                <div
                                    style={{
                                        display: "grid",
                                        gridTemplateColumns: "1fr 1fr",
                                        gap: "8px"
                                    }}
                                >
                                    <div>
                                        <label>Bairro:</label>
                                        <input
                                            type="text"
                                            name="bairro"
                                            value={form.bairro}
                                            onChange={handleChange}
                                        />
                                    </div>
                                    <div>
                                        <label>Cidade:</label>
                                        <input
                                            type="text"
                                            name="cidade"
                                            value={form.cidade}
                                            onChange={handleChange}
                                        />
                                    </div>
                                </div>

                                <div
                                    style={{
                                        display: "grid",
                                        gridTemplateColumns: "1fr 1fr 1fr",
                                        gap: "8px"
                                    }}
                                >
                                    <div>
                                        <label>Estado (UF):</label>
                                        <input
                                            type="text"
                                            name="estado"
                                            value={form.estado}
                                            onChange={handleChange}
                                            maxLength={2}
                                        />
                                    </div>
                                    <div>
                                        <label>Anos Serviço:</label>
                                        <input
                                            type="number"
                                            name="anos_servico"
                                            value={form.anos_servico}
                                            onChange={handleChange}
                                        />
                                    </div>
                                    <div>
                                        <label>Associados:</label>
                                        <input
                                            type="number"
                                            name="quantidade_associados"
                                            value={form.quantidade_associados}
                                            onChange={handleChange}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label>Capacidade Produção:</label>
                                    <input
                                        type="number"
                                        name="capacidade_producao"
                                        value={form.capacidade_producao}
                                        onChange={handleChange}
                                    />
                                </div>

                                <div
                                    style={{
                                        display: "flex",
                                        justifyContent: "flex-end",
                                        gap: "8px",
                                        marginTop: "16px"
                                    }}
                                >
                                    <button
                                        type="button"
                                        className="btn-secondary"
                                        onClick={fecharModal}
                                    >
                                        Cancelar
                                    </button>
                                    <button type="submit" className="btn-primary">
                                        Salvar
                                    </button>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Cooperativas;