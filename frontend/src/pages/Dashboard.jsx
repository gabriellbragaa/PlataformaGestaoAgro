import { useCallback, useEffect, useState } from "react";
import {
    Users, Building2, Package, Handshake, Sprout, Beef, UserRound,
    BriefcaseBusiness, Warehouse, ShoppingBasket, RefreshCw, Printer,
    Download, ExternalLink, Copy, Newspaper, Landmark, ArrowRightLeft,
    FileText, MapPin,
} from "lucide-react";
import {
    ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip,
    CartesianGrid, PieChart, Pie, Cell, Legend,
} from "recharts";

import api from "../services/api";
import MapaCooperativas from "../components/MapaCooperativas";
import "./Dashboard.css";

// ============================================================
// UTILITÁRIOS
// ============================================================

const CORES = ["#166534", "#16a34a", "#65a30d", "#ca8a04", "#ea580c", "#0891b2", "#6366f1", "#9ca3af"];

const fmt = (n) => (n === null || n === undefined ? "—" : Number(n).toLocaleString("pt-BR"));
const brl = (n) =>
    Number(n || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

function baixarCSV(nome, colunas, linhas) {
    const esc = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const csv =
        "\ufeff" +
        [colunas.map(esc).join(";"), ...linhas.map((l) => l.map(esc).join(";"))].join("\r\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `${nome}-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
}

function Secao({ icone: Icone, titulo, descricao, acao, children }) {
    return (
        <div className="dashboard-section">
            <div className="section-title">
                <div className="section-heading">
                    <div className="section-heading-icon">
                        <Icone size={18} />
                    </div>
                    <div>
                        <h3>{titulo}</h3>
                        <p>{descricao}</p>
                    </div>
                </div>
                {acao}
            </div>
            {children}
        </div>
    );
}

function Vazio({ texto }) {
    return <p className="dx-muted">{texto}</p>;
}

// ============================================================
// PESSOAS POR COOPERATIVA
// ============================================================

function PessoasPorCooperativa({ linhas }) {
    if (!linhas.length) return <Vazio texto="Nenhuma cooperativa cadastrada." />;

    const grafico = linhas.slice(0, 10).map((l) => ({
        nome: l.nome?.length > 22 ? l.nome.slice(0, 21) + "…" : l.nome,
        Associados: l.associados,
        Produtores: l.produtores,
    }));

    return (
        <div className="dx-grid-2">
            <div className="dx-box">
                <h4>Associados e produtores (10 maiores)</h4>
                <ResponsiveContainer width="100%" height={Math.max(240, grafico.length * 42)}>
                    <BarChart data={grafico} layout="vertical" margin={{ left: 10, right: 16 }}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                        <XAxis type="number" allowDecimals={false} />
                        <YAxis type="category" dataKey="nome" width={150} tick={{ fontSize: 12 }} />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="Associados" fill={CORES[0]} radius={[0, 4, 4, 0]} />
                        <Bar dataKey="Produtores" fill={CORES[3]} radius={[0, 4, 4, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </div>

            <div className="dx-box">
                <h4>Detalhamento</h4>
                <div className="dx-table-wrap">
                    <table className="dx-table">
                        <thead>
                            <tr>
                                <th>Cooperativa</th>
                                <th>Cidade</th>
                                <th className="dx-num">Associados</th>
                                <th className="dx-num">Produtores</th>
                                <th className="dx-num">Recursos</th>
                            </tr>
                        </thead>
                        <tbody>
                            {linhas.map((l) => (
                                <tr key={l.id}>
                                    <td><strong>{l.nome}</strong></td>
                                    <td>{l.cidade || "—"}</td>
                                    <td className="dx-num">{fmt(l.associados)}</td>
                                    <td className="dx-num">{fmt(l.produtores)}</td>
                                    <td className="dx-num">{fmt(l.recursos)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <p className="dx-muted" style={{ marginTop: 8 }}>
                    Produtores = produtores com produtos registrados na cooperativa.
                </p>
            </div>
        </div>
    );
}

// ============================================================
// RECURSOS
// ============================================================

function Recursos({ status, tipo }) {
    if (!status.length) return <Vazio texto="Nenhum recurso cadastrado." />;

    const valorTotal = status.reduce((s, r) => s + (r.valor || 0), 0);
    const dispon = status.find((r) => r.status === "Disponível");

    return (
        <div className="dx-grid-2">
            <div className="dx-box">
                <h4>Recursos por status</h4>
                <ResponsiveContainer width="100%" height={240}>
                    <PieChart>
                        <Pie data={status} dataKey="quantidade" nameKey="status"
                            innerRadius={55} outerRadius={90} paddingAngle={2}>
                            {status.map((_, i) => <Cell key={i} fill={CORES[i % CORES.length]} />)}
                        </Pie>
                        <Tooltip />
                        <Legend />
                    </PieChart>
                </ResponsiveContainer>
            </div>

            <div className="dx-box">
                <h4>Valores e tipos</h4>
                <div className="dx-table-wrap">
                    <table className="dx-table">
                        <thead>
                            <tr>
                                <th>Status</th>
                                <th className="dx-num">Qtd.</th>
                                <th className="dx-num">Valor</th>
                            </tr>
                        </thead>
                        <tbody>
                            {status.map((r) => (
                                <tr key={r.status}>
                                    <td>{r.status}</td>
                                    <td className="dx-num">{fmt(r.quantidade)}</td>
                                    <td className="dx-num">{brl(r.valor)}</td>
                                </tr>
                            ))}
                            <tr>
                                <td><strong>Total</strong></td>
                                <td className="dx-num"><strong>{fmt(status.reduce((s, r) => s + r.quantidade, 0))}</strong></td>
                                <td className="dx-num"><strong>{brl(valorTotal)}</strong></td>
                            </tr>
                        </tbody>
                    </table>
                </div>
                {dispon && (
                    <p className="dx-muted" style={{ marginTop: 8 }}>
                        Disponíveis agora: {fmt(dispon.quantidade)} recursos, somando {brl(dispon.valor)}.
                    </p>
                )}
                <p className="dx-muted">
                    Por tipo: {tipo.map((t) => `${t.tipo} (${t.quantidade})`).join(" · ") || "—"}
                </p>
            </div>
        </div>
    );
}

// ============================================================
// PRODUTOS
// ============================================================

function Produtos({ linhas }) {
    if (!linhas.length) return <Vazio texto="Nenhum produto registrado." />;
    return (
        <div className="dx-box dx-table-wrap">
            <table className="dx-table">
                <thead>
                    <tr>
                        <th>Produto</th>
                        <th className="dx-num">Quantidade vendida</th>
                        <th>Unidade</th>
                        <th className="dx-num">Qualidade média</th>
                        <th className="dx-num">Registros</th>
                    </tr>
                </thead>
                <tbody>
                    {linhas.map((p, i) => (
                        <tr key={`${p.nome}-${p.unidade}-${i}`}>
                            <td><strong>{p.nome}</strong></td>
                            <td className="dx-num">{fmt(p.quantidade_vendida)}</td>
                            <td>{p.unidade}</td>
                            <td className="dx-num">{p.qualidade_media ?? "—"} / 5</td>
                            <td className="dx-num">{fmt(p.registros)}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
            <p className="dx-muted" style={{ marginTop: 8 }}>
                Os 10 produtos com maior volume vendido. Unidades diferentes não são somadas.
            </p>
        </div>
    );
}

// ============================================================
// EMPRESAS
// ============================================================

function Empresas({ linhas, resumo, total }) {
    if (!linhas.length) return <Vazio texto="Nenhuma empresa cadastrada." />;
    return (
        <div className="dx-grid-2">
            <div className="dx-box">
                <h4>Visão geral</h4>
                <p>Empresas cadastradas: <strong>{fmt(total)}</strong></p>
                <p>Com parceria ativa: <strong>{fmt(resumo?.com_parceria)}</strong></p>
                <p>Tempo médio de atuação:{" "}
                    <strong>{resumo?.tempo_medio != null ? `${resumo.tempo_medio} anos` : "—"}</strong>
                </p>
            </div>
            <div className="dx-box dx-table-wrap">
                <h4>Empresas com mais parcerias</h4>
                <table className="dx-table">
                    <thead>
                        <tr>
                            <th>Empresa</th>
                            <th className="dx-num">Atuação</th>
                            <th className="dx-num">Parcerias</th>
                        </tr>
                    </thead>
                    <tbody>
                        {linhas.map((e) => (
                            <tr key={e.id}>
                                <td><strong>{e.nome || "—"}</strong></td>
                                <td className="dx-num">{e.tempo_atuacao ? `${e.tempo_atuacao} anos` : "—"}</td>
                                <td className="dx-num">{fmt(e.parcerias)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

// ============================================================
// CONVERSOR DE MOEDAS (AwesomeAPI)
// ============================================================

const MOEDAS = ["BRL", "USD", "EUR", "GBP", "ARS", "CNY"];

function Conversor() {
    const [taxas, setTaxas] = useState(null); // BRL por 1 unidade da moeda
    const [atualizado, setAtualizado] = useState("");
    const [erro, setErro] = useState(false);
    const [valor, setValor] = useState("100");
    const [de, setDe] = useState("USD");
    const [para, setPara] = useState("BRL");

    const carregar = useCallback(async () => {
        try {
            setErro(false);
            const pares = MOEDAS.filter((m) => m !== "BRL").map((m) => `${m}-BRL`).join(",");
            const resp = await fetch(`https://economia.awesomeapi.com.br/json/last/${pares}`);
            if (!resp.ok) throw new Error("Falha na cotação");
            const dados = await resp.json();

            const mapa = { BRL: 1 };
            let ultima = "";
            Object.values(dados).forEach((c) => {
                mapa[c.code] = Number(c.bid);
                ultima = c.create_date;
            });
            setTaxas(mapa);
            setAtualizado(ultima);
        } catch {
            setErro(true);
        }
    }, []);

    useEffect(() => {
        carregar();
    }, [carregar]);

    const numero = Number(String(valor).replace(",", "."));
    const resultado =
        taxas && taxas[de] && taxas[para] && !Number.isNaN(numero)
            ? (numero * taxas[de]) / taxas[para]
            : null;

    return (
        <div className="dx-box">
            <div className="dx-conv">
                <input type="text" inputMode="decimal" value={valor}
                    onChange={(e) => setValor(e.target.value)} aria-label="Valor" />
                <select value={de} onChange={(e) => setDe(e.target.value)} aria-label="De">
                    {MOEDAS.map((m) => <option key={m}>{m}</option>)}
                </select>
                <button type="button" className="dx-btn" onClick={() => { setDe(para); setPara(de); }}>
                    <ArrowRightLeft size={16} /> Inverter
                </button>
                <select value={para} onChange={(e) => setPara(e.target.value)} aria-label="Para">
                    {MOEDAS.map((m) => <option key={m}>{m}</option>)}
                </select>
            </div>

            {erro && <p className="dx-muted">Não foi possível obter as cotações agora.{" "}
                <button type="button" className="dx-btn" onClick={carregar}>Tentar novamente</button></p>}

            {resultado !== null && (
                <div className="dx-result">
                    {resultado.toLocaleString("pt-BR", { maximumFractionDigits: 4 })} {para}
                </div>
            )}

            {taxas && (
                <p className="dx-muted" style={{ marginTop: 10 }}>
                    {MOEDAS.filter((m) => m !== "BRL")
                        .map((m) => `${m}: ${brl(taxas[m])}`)
                        .join(" · ")}
                    {atualizado && ` — cotação de ${atualizado}`}
                </p>
            )}
        </div>
    );
}

// ============================================================
// NOTÍCIAS REAIS
// ============================================================

const TEMAS = [
    ["agro", "Agricultura familiar"],
    ["cooperativismo", "Cooperativismo"],
    ["mercado", "Mercado e safra"],
    ["clima", "Clima"],
];

function Noticias() {
    const [tema, setTema] = useState("agro");
    const [itens, setItens] = useState([]);
    const [carregando, setCarregando] = useState(true);
    const [erro, setErro] = useState(null);

    useEffect(() => {
        let cancelado = false;
        setCarregando(true);
        setErro(null);
        api.get("/dashboard/noticias", { params: { tema, limite: 8 } })
            .then(({ data }) => !cancelado && setItens(data))
            .catch((e) => !cancelado && setErro(e.response?.data?.detail || "Não foi possível carregar as notícias."))
            .finally(() => !cancelado && setCarregando(false));
        return () => { cancelado = true; };
    }, [tema]);

    return (
        <div className="dx-box">
            <div className="dx-tabs">
                {TEMAS.map(([id, nome]) => (
                    <button key={id} type="button"
                        className={`dx-tab ${tema === id ? "on" : ""}`}
                        onClick={() => setTema(id)}>
                        {nome}
                    </button>
                ))}
            </div>

            {carregando && <p className="dx-muted">Carregando notícias…</p>}
            {erro && <p style={{ color: "#dc2626" }}>{erro}</p>}

            {!carregando && !erro && (
                <ul className="dx-news">
                    {itens.map((n) => (
                        <li key={n.link}>
                            <a href={n.link} target="_blank" rel="noopener noreferrer">{n.titulo}</a>
                            <div className="dx-muted">
                                {n.fonte}
                                {n.publicado_em && ` · ${new Date(n.publicado_em).toLocaleDateString("pt-BR")}`}
                            </div>
                        </li>
                    ))}
                    {itens.length === 0 && <Vazio texto="Nenhuma notícia encontrada." />}
                </ul>
            )}
            <p className="dx-muted" style={{ marginTop: 8 }}>Fonte: Google Notícias. Os títulos levam à matéria original.</p>
        </div>
    );
}

// ============================================================
// ÓRGÃOS PÚBLICOS
// Só site oficial. Confira telefone e e-mail nos canais de cada órgão
// e acrescente em "contato" se quiser exibi-los aqui.
// ============================================================

const ORGAOS = [
    { sigla: "IDACE", nome: "Instituto de Desenvolvimento Agrário do Ceará", area: "Assentamentos e regularização fundiária no Ceará", site: "https://www.idace.ce.gov.br" },
    { sigla: "SDA-CE", nome: "Secretaria do Desenvolvimento Agrário do Ceará", area: "Políticas para agricultura familiar no estado", site: "https://www.sda.ce.gov.br" },
    { sigla: "MDA", nome: "Ministério do Desenvolvimento Agrário e Agricultura Familiar", area: "Pronaf, PAA, assistência técnica e crédito", site: "https://www.gov.br/mda" },
    { sigla: "MAPA", nome: "Ministério da Agricultura e Pecuária", area: "Cooperativismo, defesa e fiscalização agropecuária", site: "https://www.gov.br/agricultura" },
    { sigla: "Conab", nome: "Companhia Nacional de Abastecimento", area: "Compras públicas da agricultura familiar e estoques", site: "https://www.conab.gov.br" },
    { sigla: "Embrapa", nome: "Empresa Brasileira de Pesquisa Agropecuária", area: "Pesquisa e tecnologia para o campo", site: "https://www.embrapa.br" },
    { sigla: "BNB", nome: "Banco do Nordeste", area: "Crédito rural e financiamento para o Nordeste", site: "https://www.bnb.gov.br" },
    { sigla: "Sebrae", nome: "Serviço Brasileiro de Apoio às Micro e Pequenas Empresas", area: "Capacitação e gestão para pequenos negócios", site: "https://www.sebrae.com.br" },
    { sigla: "OCB", nome: "Sistema OCB (cooperativismo)", area: "Representação e apoio às cooperativas", site: "https://www.somoscooperativismo.coop.br" },
    { sigla: "Fala.BR", nome: "Plataforma Integrada de Ouvidoria e Acesso à Informação", area: "Pedidos de informação, reclamações e sugestões a órgãos federais", site: "https://falabr.cgu.gov.br" },
];

function modelo(orgao, nomeCoop) {
    return `Prezados(as) do(a) ${orgao.sigla},

Sou representante de ${nomeCoop || "[nome da cooperativa]"}, cooperativa da agricultura familiar no Nordeste, e gostaria de obter informações sobre programas, linhas de apoio e orientações na área de: ${orgao.area.toLowerCase()}.

Podem indicar o canal adequado e os documentos necessários?

Atenciosamente,
[nome] — [telefone] — [e-mail]`;
}

function Orgaos({ cooperativa }) {
    const [copiado, setCopiado] = useState("");

    async function copiar(o) {
        try {
            await navigator.clipboard.writeText(modelo(o, cooperativa));
            setCopiado(o.sigla);
            setTimeout(() => setCopiado(""), 2000);
        } catch {
            alert("Não foi possível copiar. Selecione e copie o texto manualmente.");
        }
    }

    return (
        <div className="dx-grid-3">
            {ORGAOS.map((o) => (
                <div key={o.sigla} className="dx-box dx-org">
                    <strong>{o.sigla}</strong>
                    <span className="dx-muted">{o.nome}</span>
                    <span>{o.area}</span>
                    <div className="dx-btn-row">
                        <a className="dx-btn" href={o.site} target="_blank" rel="noopener noreferrer">
                            <ExternalLink size={15} /> Site oficial
                        </a>
                        <button type="button" className="dx-btn" onClick={() => copiar(o)}>
                            <Copy size={15} /> {copiado === o.sigla ? "Copiado!" : "Modelo de mensagem"}
                        </button>
                    </div>
                </div>
            ))}
        </div>
    );
}

// ============================================================
// RELATÓRIOS
// ============================================================

function Relatorios({ dados }) {
    const relatorios = [
        {
            nome: "pessoas-por-cooperativa",
            titulo: "Pessoas por cooperativa",
            colunas: ["Cooperativa", "Cidade", "Associados", "Produtores", "Recursos"],
            linhas: dados.pessoas_por_cooperativa.map((l) => [l.nome, l.cidade, l.associados, l.produtores, l.recursos]),
        },
        {
            nome: "recursos",
            titulo: "Recursos por status",
            colunas: ["Status", "Quantidade", "Valor (R$)"],
            linhas: dados.recursos_status.map((r) => [r.status, r.quantidade, r.valor]),
        },
        {
            nome: "produtos",
            titulo: "Produtos",
            colunas: ["Produto", "Quantidade vendida", "Unidade", "Qualidade média", "Registros"],
            linhas: dados.produtos.map((p) => [p.nome, p.quantidade_vendida, p.unidade, p.qualidade_media, p.registros]),
        },
        {
            nome: "empresas",
            titulo: "Empresas e parcerias",
            colunas: ["Empresa", "Tempo de atuação (anos)", "Parcerias"],
            linhas: dados.empresas.map((e) => [e.nome, e.tempo_atuacao, e.parcerias]),
        },
    ];

    return (
        <div className="dx-box">
            <p className="dx-muted">
                Relatórios gerados a partir dos dados atuais, em CSV (abre no Excel). Use Imprimir para salvar a página inteira em PDF.
            </p>
            <div className="dx-btn-row dx-noprint">
                {relatorios.map((r) => (
                    <button key={r.nome} type="button" className="dx-btn"
                        disabled={r.linhas.length === 0}
                        onClick={() => baixarCSV(r.nome, r.colunas, r.linhas)}>
                        <Download size={15} /> {r.titulo}
                    </button>
                ))}
                <button type="button" className="dx-btn" onClick={() => window.print()}>
                    <Printer size={15} /> Imprimir / PDF
                </button>
            </div>
        </div>
    );
}

// ============================================================
// PÁGINA
// ============================================================

function Dashboard() {
    const [dados, setDados] = useState(null);
    const [erro, setErro] = useState(null);
    const [carregando, setCarregando] = useState(true);

    const carregar = useCallback(async () => {
        try {
            setCarregando(true);
            setErro(null);
            const { data } = await api.get("/dashboard/resumo");
            setDados(data);
        } catch (e) {
            setErro(e.response?.data?.detail || "Não foi possível carregar os dados do dashboard.");
        } finally {
            setCarregando(false);
        }
    }, []);

    useEffect(() => {
        carregar();
    }, [carregar]);

    const t = dados?.totais || {};
    const cards = [
        { titulo: "Cooperativas", valor: t.cooperativas, icone: Warehouse, desc: "cadastradas" },
        { titulo: "Associados", valor: t.associados, icone: Users, desc: "somando as cooperativas" },
        { titulo: "Produtores", valor: t.produtores, icone: Sprout, desc: "agricultores e pecuaristas" },
        { titulo: "Empresas", valor: t.empresas, icone: Building2, desc: "cadastradas" },
        { titulo: "Parcerias", valor: t.parcerias, icone: Handshake, desc: "empresa × cooperativa" },
        { titulo: "Recursos", valor: t.recursos, icone: Package, desc: "cadastrados" },
        { titulo: "Produtos", valor: t.produtos, icone: ShoppingBasket, desc: "registrados" },
        { titulo: "Clientes", valor: t.clientes, icone: UserRound, desc: "compradores" },
    ];

    const resumoExtra = [
        { titulo: "Agricultores", valor: t.agricultores, icone: Sprout },
        { titulo: "Pecuaristas", valor: t.pecuaristas, icone: Beef },
        { titulo: "Funcionários", valor: t.funcionarios, icone: BriefcaseBusiness },
    ];

    return (
        <div className="dashboard">
            {/* CABEÇALHO */}
            <div className="dashboard-header">
                <div>
                    <h2>Dashboard</h2>
                    <p>Visão geral da plataforma AutoAgroNordeste</p>
                </div>
                <div className="dashboard-date dx-noprint">
                    <button type="button" className="dx-btn" onClick={carregar} disabled={carregando}>
                        <RefreshCw size={15} /> {carregando ? "Atualizando…" : "Atualizar"}
                    </button>
                </div>
            </div>

            {erro && <div className="dx-alert dx-error">{erro}</div>}

            {dados?.avisos?.length > 0 && (
                <div className="dx-alert">
                    Algumas consultas falharam e aparecem vazias: <strong>{dados.avisos.join(", ")}</strong>.
                    Confira os nomes das tabelas e colunas em <code>routers/dashboard.py</code>.
                </div>
            )}

            {/* CARDS */}
            <div className="dashboard-cards">
                {cards.map((c) => {
                    const Icon = c.icone;
                    return (
                        <div className="dashboard-card" key={c.titulo}>
                            <div className="dashboard-card-header">
                                <div className="dashboard-icon"><Icon size={21} /></div>
                            </div>
                            <div className="dashboard-value">{carregando ? "…" : fmt(c.valor)}</div>
                            <div className="dashboard-card-title">{c.titulo}</div>
                            <div className="dashboard-description">{c.desc}</div>
                        </div>
                    );
                })}
            </div>

            {/* RESUMO */}
            <div className="dashboard-section">
                <div className="section-title">
                    <div>
                        <h3>Resumo da plataforma</h3>
                        <p>Totais gerais</p>
                    </div>
                </div>
                <div className="statistics-grid">
                    {resumoExtra.map((i) => {
                        const Icon = i.icone;
                        return (
                            <div className="statistic-item" key={i.titulo}>
                                <div className="statistic-icon"><Icon size={19} /></div>
                                <div className="statistic-info">
                                    <span>{i.titulo}</span>
                                    <strong>{carregando ? "…" : fmt(i.valor)}</strong>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {dados && (
                <>
                    <Secao icone={Users} titulo="Pessoas por cooperativa"
                        descricao="Associados e produtores vinculados a cada cooperativa">
                        <PessoasPorCooperativa linhas={dados.pessoas_por_cooperativa} />
                    </Secao>

                    <Secao icone={MapPin} titulo="Mapa das cooperativas"
                        descricao="Localização das cooperativas cadastradas">
                        <MapaCooperativas />
                    </Secao>

                    <Secao icone={Package} titulo="Gerenciamento de recursos"
                        descricao="Situação e valor dos recursos cadastrados">
                        <Recursos status={dados.recursos_status} tipo={dados.recursos_tipo} />
                    </Secao>

                    <Secao icone={ShoppingBasket} titulo="Gerenciamento de produtos"
                        descricao="Volume vendido e qualidade por produto">
                        <Produtos linhas={dados.produtos} />
                    </Secao>

                    <Secao icone={Building2} titulo="Gerenciamento de empresas"
                        descricao="Empresas parceiras e parcerias com cooperativas">
                        <Empresas linhas={dados.empresas} resumo={dados.empresas_resumo} total={dados.empresas} />
                    </Secao>
                </>
            )}

            <Secao icone={ArrowRightLeft} titulo="Conversão de moedas"
                descricao="Cotações em tempo real para exportação e insumos importados">
                <Conversor />
            </Secao>

            <Secao icone={Newspaper} titulo="Notícias do setor"
                descricao="Manchetes recentes sobre agricultura, cooperativismo, mercado e clima">
                <Noticias />
            </Secao>

            <Secao icone={Landmark} titulo="Contato com órgãos públicos"
                descricao="Canais oficiais de apoio, crédito e regularização">
                <Orgaos cooperativa={dados?.pessoas_por_cooperativa?.[0]?.nome} />
            </Secao>

            {dados && (
                <Secao icone={FileText} titulo="Relatórios"
                    descricao={`Dados de ${new Date(dados.gerado_em).toLocaleString("pt-BR")}`}>
                    <Relatorios dados={dados} />
                </Secao>
            )}
        </div>
    );
}

export default Dashboard;