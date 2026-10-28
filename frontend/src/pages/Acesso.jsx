
import React, { useState } from "react";
import { z } from "zod";
import {
    Sprout,
    ArrowLeft,
    Eye,
    EyeOff,
    LoaderCircle,
    CheckCircle2,
    AlertCircle,
} from "lucide-react";
import api from "../services/api";
import "./Acesso.css";

// ============================================================
// FUNÇÕES AUXILIARES
// ============================================================

const onlyDigits = (value) => value.replace(/\D/g, "");

function validCpf(cpf) {
    if (cpf.length !== 11 || /^(\d)\1+$/.test(cpf)) {
        return false;
    }

    for (const t of [9, 10]) {
        let sum = 0;

        for (let i = 0; i < t; i++) {
            sum += Number(cpf[i]) * (t + 1 - i);
        }

        if (((sum * 10) % 11) % 10 !== Number(cpf[t])) {
            return false;
        }
    }

    return true;
}

const signupSchema = z.object({
    nome: z.string().trim().min(2, "Informe seu nome."),
    idade: z
        .number()
        .int("Informe uma idade válida.")
        .min(0, "Idade inválida.")
        .max(120, "Idade inválida."),
    cpf: z.string().refine(validCpf, "CPF inválido."),
    telefone: z
        .string()
        .min(10, "Telefone inválido.")
        .max(11, "Telefone inválido."),
    senha: z
        .string()
        .min(8, "A senha deve ter ao menos 8 caracteres.")
        .max(72, "A senha deve ter no máximo 72 caracteres."),
});

const maskCpf = (value) =>
    onlyDigits(value)
        .slice(0, 11)
        .replace(/(\d{3})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d{1,2})$/, "$1-$2");

const maskTel = (value) => {
    const digits = onlyDigits(value).slice(0, 11);

    if (digits.length > 10) {
        return digits
            .replace(/(\d{2})(\d{5})(\d{0,4})/, "($1) $2-$3")
            .replace(/-$/, "");
    }

    if (digits.length > 6) {
        return digits
            .replace(/(\d{2})(\d{4})(\d{0,4})/, "($1) $2-$3")
            .replace(/-$/, "");
    }

    if (digits.length > 2) {
        return digits.replace(/(\d{2})(\d+)/, "($1) $2");
    }

    return digits;
};

// ============================================================
// COMPONENTE DE ACESSO
// ============================================================

export default function Acesso({ onVoltar }) {
    const [mode, setMode] = useState("cadastro");

    const [nome, setNome] = useState("");
    const [idade, setIdade] = useState("");
    const [cpf, setCpf] = useState("");
    const [tel, setTel] = useState("");
    const [senha, setSenha] = useState("");

    const [mostrarSenha, setMostrarSenha] = useState(false);
    const [msg, setMsg] = useState(null);
    const [loading, setLoading] = useState(false);

    // Retorna à página inicial do aplicativo.
    function voltarInicio() {
        if (onVoltar) {
            onVoltar();
        } else {
            window.location.href = "/";
        }
    }

    // ==========================================================
    // CADASTRO E LOGIN
    // ==========================================================

    async function submit(event) {
        event.preventDefault();

        if (loading) return;

        setMsg(null);

        const c = onlyDigits(cpf);
        const telefone = onlyDigits(tel);

        // --------------------------------------------------------
        // VALIDAÇÃO DO CADASTRO
        // --------------------------------------------------------

        if (mode === "cadastro") {
            const result = signupSchema.safeParse({
                nome,
                idade: Number(idade),
                cpf: c,
                telefone,
                senha,
            });

            if (!result.success) {
                setMsg({
                    ok: false,
                    text: result.error.issues[0].message,
                });
                return;
            }
        } else {
            // ------------------------------------------------------
            // VALIDAÇÃO DO LOGIN
            // ------------------------------------------------------

            if (!validCpf(c)) {
                setMsg({
                    ok: false,
                    text: "Informe um CPF válido.",
                });
                return;
            }

            if (!senha) {
                setMsg({
                    ok: false,
                    text: "Informe sua senha.",
                });
                return;
            }
        }

        setLoading(true);

        try {
            // ======================================================
            // CADASTRO: POST /usuario
            // ======================================================

            if (mode === "cadastro") {
                const resposta = await api.post("/usuario", {
                    nome: nome.trim(),
                    idade: Number(idade),
                    telefone,
                    cpf: c,
                    senha,
                });

                setMsg({
                    ok: true,
                    text:
                        resposta.data?.msg ||
                        "Cadastro realizado com sucesso!",
                });

                setSenha("");
            } else {
                // ====================================================
                // LOGIN: POST /usuario/login
                // Esta rota precisa existir no FastAPI.
                // ====================================================

                const resposta = await api.post("/usuario/login", {
                    cpf: c,
                    senha,
                });

                setMsg({
                    ok: true,
                    text: resposta.data?.nome
                        ? `Bem-vindo(a), ${resposta.data.nome}!`
                        : resposta.data?.msg ||
                        "Login realizado com sucesso!",
                });

                // Aqui você pode encaminhar o usuário para o dashboard
                // quando a autenticação e a sessão estiverem configuradas.
            }
        } catch (error) {
            const detail = error.response?.data?.detail;

            let textoErro =
                typeof detail === "string"
                    ? detail
                    : "Não foi possível concluir a solicitação. Verifique os dados e tente novamente.";

            if (!error.response) {
                textoErro =
                    "Não foi possível conectar ao servidor. Verifique se a API FastAPI está funcionando.";
            }

            setMsg({
                ok: false,
                text: textoErro,
            });
        } finally {
            setLoading(false);
        }
    }

    // ==========================================================
    // INTERFACE
    // ==========================================================

    return (
        <main className="acesso-page">
            <div className="acesso-decoration acesso-decoration-one" />
            <div className="acesso-decoration acesso-decoration-two" />

            <section className="acesso-card">
                <button
                    type="button"
                    className="acesso-back"
                    onClick={voltarInicio}
                >
                    <ArrowLeft size={17} />
                    Voltar ao início
                </button>

                <button
                    type="button"
                    className="acesso-brand"
                    onClick={voltarInicio}
                    aria-label="AutoAgroNordeste - voltar ao início"
                >
                    <span className="acesso-brand-icon">
                        <Sprout size={26} />
                    </span>

                    <span>
                        AutoAgro<span>Nordeste</span>
                    </span>
                </button>

                <div className="acesso-heading">
                    <span className="acesso-eyebrow">
                        GESTÃO INTELIGENTE DO AGRO
                    </span>

                    <h1>
                        {mode === "cadastro"
                            ? "Faça parte dessa conexão."
                            : "Que bom ter você de volta."}
                    </h1>

                    <p>
                        {mode === "cadastro"
                            ? "Crie sua conta para acessar a plataforma AutoAgroNordeste."
                            : "Entre com seu CPF e senha para continuar."}
                    </p>
                </div>

                {/* Alternar entre cadastro e login */}

                <div className="acesso-tabs">
                    <button
                        type="button"
                        className={mode === "cadastro" ? "selected" : ""}
                        onClick={() => {
                            setMode("cadastro");
                            setMsg(null);
                        }}
                    >
                        Criar conta
                    </button>

                    <button
                        type="button"
                        className={mode === "entrar" ? "selected" : ""}
                        onClick={() => {
                            setMode("entrar");
                            setMsg(null);
                        }}
                    >
                        Entrar
                    </button>
                </div>

                <form className="acesso-form" onSubmit={submit}>
                    {/* Nome e idade: necessários no cadastro */}

                    {mode === "cadastro" && (
                        <>
                            <div className="acesso-field">
                                <label htmlFor="nome">Nome completo</label>

                                <input
                                    id="nome"
                                    type="text"
                                    autoComplete="name"
                                    placeholder="Seu nome completo"
                                    value={nome}
                                    onChange={(event) => {
                                        setNome(event.target.value);
                                        setMsg(null);
                                    }}
                                    required
                                />
                            </div>

                            <div className="acesso-field">
                                <label htmlFor="idade">Idade</label>

                                <input
                                    id="idade"
                                    type="number"
                                    inputMode="numeric"
                                    min="0"
                                    max="120"
                                    placeholder="Sua idade"
                                    value={idade}
                                    onChange={(event) => {
                                        setIdade(event.target.value);
                                        setMsg(null);
                                    }}
                                    required
                                />
                            </div>
                        </>
                    )}

                    {/* CPF */}

                    <div className="acesso-field">
                        <label htmlFor="cpf">CPF</label>

                        <input
                            id="cpf"
                            type="text"
                            inputMode="numeric"
                            autoComplete="username"
                            placeholder="000.000.000-00"
                            value={cpf}
                            onChange={(event) => {
                                setCpf(maskCpf(event.target.value));
                                setMsg(null);
                            }}
                            maxLength={14}
                            required
                        />
                    </div>

                    {/* Telefone: necessário apenas no cadastro */}

                    {mode === "cadastro" && (
                        <div className="acesso-field">
                            <label htmlFor="telefone">Telefone</label>

                            <input
                                id="telefone"
                                type="tel"
                                inputMode="tel"
                                autoComplete="tel"
                                placeholder="(00) 00000-0000"
                                value={tel}
                                onChange={(event) => {
                                    setTel(maskTel(event.target.value));
                                    setMsg(null);
                                }}
                                maxLength={15}
                                required
                            />
                        </div>
                    )}

                    {/* Senha */}

                    <div className="acesso-field">
                        <label htmlFor="senha">Senha</label>

                        <div className="acesso-password">
                            <input
                                id="senha"
                                type={mostrarSenha ? "text" : "password"}
                                autoComplete={
                                    mode === "cadastro"
                                        ? "new-password"
                                        : "current-password"
                                }
                                placeholder="Mínimo de 8 caracteres"
                                value={senha}
                                onChange={(event) => {
                                    setSenha(event.target.value);
                                    setMsg(null);
                                }}
                                maxLength={72}
                                required
                            />

                            <button
                                type="button"
                                className="acesso-toggle-password"
                                onClick={() =>
                                    setMostrarSenha((atual) => !atual)
                                }
                                aria-label={
                                    mostrarSenha
                                        ? "Ocultar senha"
                                        : "Mostrar senha"
                                }
                            >
                                {mostrarSenha ? (
                                    <EyeOff size={19} />
                                ) : (
                                    <Eye size={19} />
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Mensagens de sucesso e erro */}

                    {msg && (
                        <div
                            className={`acesso-message ${msg.ok ? "success" : "error"
                                }`}
                            role="status"
                        >
                            {msg.ok ? (
                                <CheckCircle2 size={19} />
                            ) : (
                                <AlertCircle size={19} />
                            )}

                            <span>{msg.text}</span>
                        </div>
                    )}

                    {/* Botão de envio */}

                    <button
                        className="acesso-submit"
                        type="submit"
                        disabled={loading}
                    >
                        {loading ? (
                            <>
                                <LoaderCircle
                                    className="acesso-spinner"
                                    size={19}
                                />
                                Processando...
                            </>
                        ) : mode === "cadastro" ? (
                            <>
                                Criar minha conta
                                <Sprout size={19} />
                            </>
                        ) : (
                            <>
                                Entrar na plataforma
                                <ArrowLeft
                                    className="acesso-arrow-login"
                                    size={19}
                                />
                            </>
                        )}
                    </button>
                </form>

                <div className="acesso-security">
                    <ShieldIcon />

                    <p>
                        Seus dados são utilizados para autenticação na
                        plataforma.
                    </p>
                </div>

                <footer className="acesso-footer">
                    © {new Date().getFullYear()} AutoAgroNordeste
                </footer>
            </section>
        </main>
    );
}

// ============================================================
// ÍCONE DE SEGURANÇA
// ============================================================

function ShieldIcon() {
    return (
        <span className="acesso-shield">
            <CheckCircle2 size={17} />
        </span>
    );
}
