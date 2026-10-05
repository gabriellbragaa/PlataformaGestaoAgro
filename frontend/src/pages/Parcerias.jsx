
import React, { useEffect, useState } from "react";
import {
    Plus,
    Trash2,
    X,
    Handshake,
    Building2,
    Users,
    RefreshCw
} from "lucide-react";

import axios from "axios";

const API_URL =
    import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

function Parcerias() {

    const [parcerias, setParcerias] = useState([]);
    const [empresas, setEmpresas] = useState([]);
    const [cooperativas, setCooperativas] = useState([]);

    const [loading, setLoading] = useState(true);
    const [erro, setErro] = useState(null);

    const [modalAberto, setModalAberto] = useState(false);

    const [form, setForm] = useState({
        id_empresa: "",
        id_cooperativa: ""
    });

    // ============================================================
    // CARREGAR DADOS
    // ============================================================

    const carregarDados = async () => {
        try {
            setLoading(true);
            setErro(null);

            const [
                parceriasResponse,
                empresasResponse,
                cooperativasResponse
            ] = await Promise.all([
                axios.get(`${API_URL}/parceria`),
                axios.get(`${API_URL}/empresa`),
                axios.get(`${API_URL}/cooperativa`)
            ]);

            console.log("PARCERIAS:", parceriasResponse.data);
            console.log("EMPRESAS:", empresasResponse.data);
            console.log("COOPERATIVAS:", cooperativasResponse.data);

            setParcerias(parceriasResponse.data);
            setEmpresas(empresasResponse.data);
            setCooperativas(cooperativasResponse.data);

        } catch (error) {
            console.error("Erro ao carregar dados:", error);

            if (error.response) {
                console.error("Status:", error.response.status);
                console.error("URL:", error.config?.url);
                console.error("Resposta:", error.response.data);
            }

            setErro(
                error.response?.data?.detail ||
                `Erro ${error.response?.status || ""} ao carregar dados.`
            );

        } finally {
            setLoading(false);
        }
    };


    // ============================================================
    // ENCONTRAR EMPRESA
    // ============================================================

    const encontrarEmpresa = (id) => {

        return empresas.find(
            empresa =>
                empresa.id_empresa === id ||
                empresa.id === id
        );
    };


    // ============================================================
    // ENCONTRAR COOPERATIVA
    // ============================================================

    const encontrarCooperativa = (id) => {

        return cooperativas.find(
            cooperativa =>
                cooperativa.id_cooperativa === id ||
                cooperativa.id === id
        );
    };


    // ============================================================
    // PEGAR NOME DA EMPRESA
    // ============================================================

    const nomeEmpresa = (id) => {

        const empresa = encontrarEmpresa(id);

        if (!empresa) {
            return `Empresa #${id}`;
        }

        return (
            empresa.nome_empresa ||
            empresa.nome ||
            empresa.razao_social ||
            `Empresa #${id}`
        );
    };


    // ============================================================
    // PEGAR NOME DA COOPERATIVA
    // ============================================================

    const nomeCooperativa = (id) => {

        const cooperativa = encontrarCooperativa(id);

        if (!cooperativa) {
            return `Cooperativa #${id}`;
        }

        return (
            cooperativa.nome_cooperativa ||
            cooperativa.nome ||
            `Cooperativa #${id}`
        );
    };


    // ============================================================
    // FORM
    // ============================================================

    const handleChange = (e) => {

        setForm({
            ...form,
            [e.target.name]: e.target.value
        });
    };


    // ============================================================
    // CRIAR PARCERIA
    // ============================================================

    const criarParceria = async (e) => {

        e.preventDefault();

        if (!form.id_empresa || !form.id_cooperativa) {

            alert("Selecione uma empresa e uma cooperativa.");

            return;
        }

        try {

            await axios.post(
                `${API_URL}/parceria`,
                {
                    id_empresa: Number(form.id_empresa),
                    id_cooperativa: Number(form.id_cooperativa)
                }
            );

            alert("Solicitação de parceria criada com sucesso!");

            setForm({
                id_empresa: "",
                id_cooperativa: ""
            });

            setModalAberto(false);

            carregarDados();

        } catch (error) {

            console.error(error);

            alert(
                error.response?.data?.detail ||
                "Erro ao criar parceria."
            );
        }
    };


    // ============================================================
    // DELETAR PARCERIA
    // ============================================================

    const deletarParceria = async (
        id_empresa,
        id_cooperativa
    ) => {

        const confirmar = window.confirm(
            "Tem certeza que deseja excluir esta parceria?"
        );

        if (!confirmar) {
            return;
        }

        try {

            await axios.delete(
                `${API_URL}/Parceria/${id_empresa}/${id_cooperativa}`
            );

            alert("Parceria excluída com sucesso!");

            carregarDados();

        } catch (error) {

            console.error(error);

            alert(
                error.response?.data?.detail ||
                "Erro ao excluir parceria."
            );
        }
    };


    // ============================================================
    // LOADING
    // ============================================================

    if (loading) {

        return (
            <div className="p-8">

                <div className="flex items-center gap-3">

                    <RefreshCw
                        className="animate-spin"
                        size={22}
                    />

                    <span>
                        Carregando parcerias...
                    </span>

                </div>

            </div>
        );
    }


    // ============================================================
    // TELA
    // ============================================================

    return (

        <div className="p-8 bg-gray-50 min-h-screen">

            {/* =====================================================
                CABEÇALHO
            ====================================================== */}

            <div className="flex justify-between items-center mb-8">

                <div>

                    <div className="flex items-center gap-3">

                        <Handshake
                            size={32}
                            className="text-green-600"
                        />

                        <h1 className="text-3xl font-bold text-gray-800">
                            Parcerias
                        </h1>

                    </div>

                    <p className="text-gray-500 mt-2">
                        Gerencie as solicitações e relações entre
                        empresas e cooperativas.
                    </p>

                </div>


                <div className="flex gap-3">

                    <button
                        onClick={carregarDados}
                        className="
                            flex
                            items-center
                            gap-2
                            px-4
                            py-2
                            border
                            border-gray-300
                            rounded-lg
                            bg-white
                            hover:bg-gray-100
                        "
                    >

                        <RefreshCw size={18} />

                        Atualizar

                    </button>


                    <button
                        onClick={() => setModalAberto(true)}
                        className="
                            flex
                            items-center
                            gap-2
                            px-5
                            py-2
                            bg-green-600
                            text-white
                            rounded-lg
                            hover:bg-green-700
                        "
                    >

                        <Plus size={20} />

                        Nova parceria

                    </button>

                </div>

            </div>


            {/* =====================================================
                ERRO
            ====================================================== */}

            {erro && (

                <div className="
                    mb-6
                    p-4
                    bg-red-100
                    text-red-700
                    rounded-lg
                    border
                    border-red-200
                ">

                    {erro}

                </div>

            )}


            {/* =====================================================
                CARDS
            ====================================================== */}

            <div className="
                grid
                grid-cols-1
                md:grid-cols-3
                gap-5
                mb-8
            ">

                <div className="
                    bg-white
                    rounded-xl
                    p-5
                    shadow-sm
                    border
                ">

                    <div className="flex justify-between">

                        <div>

                            <p className="text-gray-500 text-sm">
                                Total de parcerias
                            </p>

                            <h2 className="text-3xl font-bold mt-2">
                                {parcerias.length}
                            </h2>

                        </div>

                        <Handshake
                            className="text-green-600"
                            size={32}
                        />

                    </div>

                </div>


                <div className="
                    bg-white
                    rounded-xl
                    p-5
                    shadow-sm
                    border
                ">

                    <div className="flex justify-between">

                        <div>

                            <p className="text-gray-500 text-sm">
                                Empresas
                            </p>

                            <h2 className="text-3xl font-bold mt-2">
                                {empresas.length}
                            </h2>

                        </div>

                        <Building2
                            className="text-blue-600"
                            size={32}
                        />

                    </div>

                </div>


                <div className="
                    bg-white
                    rounded-xl
                    p-5
                    shadow-sm
                    border
                ">

                    <div className="flex justify-between">

                        <div>

                            <p className="text-gray-500 text-sm">
                                Cooperativas
                            </p>

                            <h2 className="text-3xl font-bold mt-2">
                                {cooperativas.length}
                            </h2>

                        </div>

                        <Users
                            className="text-purple-600"
                            size={32}
                        />

                    </div>

                </div>

            </div>


            {/* =====================================================
                LISTA
            ====================================================== */}

            <div className="
                bg-white
                rounded-xl
                shadow-sm
                border
                overflow-hidden
            ">

                <div className="
                    p-5
                    border-b
                    flex
                    justify-between
                    items-center
                ">

                    <div>

                        <h2 className="text-xl font-semibold">
                            Solicitações de parceria
                        </h2>

                        <p className="text-sm text-gray-500 mt-1">
                            Empresas e cooperativas relacionadas.
                        </p>

                    </div>

                </div>


                {parcerias.length === 0 ? (

                    <div className="
                        p-12
                        text-center
                        text-gray-500
                    ">

                        <Handshake
                            size={45}
                            className="mx-auto mb-4 text-gray-300"
                        />

                        <p className="text-lg">
                            Nenhuma parceria encontrada.
                        </p>

                        <p className="text-sm mt-1">
                            Crie uma nova parceria para começar.
                        </p>

                    </div>

                ) : (

                    <div className="overflow-x-auto">

                        <table className="w-full">

                            <thead className="bg-gray-50">

                                <tr>

                                    <th className="
                                        text-left
                                        px-6
                                        py-4
                                        text-sm
                                        font-semibold
                                        text-gray-600
                                    ">
                                        Empresa
                                    </th>


                                    <th className="
                                        text-left
                                        px-6
                                        py-4
                                        text-sm
                                        font-semibold
                                        text-gray-600
                                    ">
                                        Cooperativa
                                    </th>


                                    <th className="
                                        text-center
                                        px-6
                                        py-4
                                        text-sm
                                        font-semibold
                                        text-gray-600
                                    ">
                                        Status
                                    </th>


                                    <th className="
                                        text-right
                                        px-6
                                        py-4
                                        text-sm
                                        font-semibold
                                        text-gray-600
                                    ">
                                        Ações
                                    </th>

                                </tr>

                            </thead>


                            <tbody>

                                {parcerias.map((parceria, index) => (

                                    <tr
                                        key={`${parceria.id_empresa}-${parceria.id_cooperativa}-${index}`}
                                        className="
                                            border-t
                                            hover:bg-gray-50
                                        "
                                    >

                                        {/* EMPRESA */}

                                        <td className="px-6 py-4">

                                            <div className="
                                                flex
                                                items-center
                                                gap-3
                                            ">

                                                <div className="
                                                    w-10
                                                    h-10
                                                    rounded-full
                                                    bg-blue-100
                                                    flex
                                                    items-center
                                                    justify-center
                                                ">

                                                    <Building2
                                                        size={20}
                                                        className="text-blue-600"
                                                    />

                                                </div>


                                                <div>

                                                    <p className="
                                                        font-medium
                                                        text-gray-800
                                                    ">
                                                        {nomeEmpresa(
                                                            parceria.id_empresa
                                                        )}
                                                    </p>

                                                    <p className="
                                                        text-xs
                                                        text-gray-400
                                                    ">
                                                        ID: {parceria.id_empresa}
                                                    </p>

                                                </div>

                                            </div>

                                        </td>


                                        {/* COOPERATIVA */}

                                        <td className="px-6 py-4">

                                            <div className="
                                                flex
                                                items-center
                                                gap-3
                                            ">

                                                <div className="
                                                    w-10
                                                    h-10
                                                    rounded-full
                                                    bg-green-100
                                                    flex
                                                    items-center
                                                    justify-center
                                                ">

                                                    <Users
                                                        size={20}
                                                        className="text-green-600"
                                                    />

                                                </div>


                                                <div>

                                                    <p className="
                                                        font-medium
                                                        text-gray-800
                                                    ">
                                                        {nomeCooperativa(
                                                            parceria.id_cooperativa
                                                        )}
                                                    </p>

                                                    <p className="
                                                        text-xs
                                                        text-gray-400
                                                    ">
                                                        ID: {parceria.id_cooperativa}
                                                    </p>

                                                </div>

                                            </div>

                                        </td>


                                        {/* STATUS */}

                                        <td className="px-6 py-4 text-center">

                                            <span className="
                                                inline-flex
                                                items-center
                                                px-3
                                                py-1
                                                rounded-full
                                                text-sm
                                                font-medium
                                                bg-green-100
                                                text-green-700
                                            ">

                                                <span className="
                                                    w-2
                                                    h-2
                                                    bg-green-500
                                                    rounded-full
                                                    mr-2
                                                " />

                                                Ativa

                                            </span>

                                        </td>


                                        {/* AÇÕES */}

                                        <td className="px-6 py-4">

                                            <div className="
                                                flex
                                                justify-end
                                            ">

                                                <button
                                                    onClick={() =>
                                                        deletarParceria(
                                                            parceria.id_empresa,
                                                            parceria.id_cooperativa
                                                        )
                                                    }
                                                    className="
                                                        p-2
                                                        text-red-600
                                                        hover:bg-red-50
                                                        rounded-lg
                                                    "
                                                    title="Excluir parceria"
                                                >

                                                    <Trash2 size={19} />

                                                </button>

                                            </div>

                                        </td>

                                    </tr>

                                ))}

                            </tbody>

                        </table>

                    </div>

                )}

            </div>


            {/* =====================================================
                MODAL
            ====================================================== */}

            {modalAberto && (

                <div className="
                    fixed
                    inset-0
                    bg-black/50
                    flex
                    items-center
                    justify-center
                    z-50
                    p-4
                ">

                    <div className="
                        bg-white
                        rounded-xl
                        shadow-xl
                        w-full
                        max-w-lg
                    ">

                        {/* HEADER */}

                        <div className="
                            flex
                            justify-between
                            items-center
                            p-6
                            border-b
                        ">

                            <div>

                                <h2 className="
                                    text-xl
                                    font-bold
                                    text-gray-800
                                ">
                                    Nova solicitação de parceria
                                </h2>

                                <p className="
                                    text-sm
                                    text-gray-500
                                    mt-1
                                ">
                                    Relacione uma empresa a uma cooperativa.
                                </p>

                            </div>


                            <button
                                onClick={() => setModalAberto(false)}
                                className="
                                    p-2
                                    hover:bg-gray-100
                                    rounded-lg
                                "
                            >

                                <X size={22} />

                            </button>

                        </div>


                        {/* FORM */}

                        <form
                            onSubmit={criarParceria}
                            className="p-6 space-y-5"
                        >

                            {/* EMPRESA */}

                            <div>

                                <label className="
                                    block
                                    text-sm
                                    font-medium
                                    text-gray-700
                                    mb-2
                                ">
                                    Empresa
                                </label>

                                <select
                                    name="id_empresa"
                                    value={form.id_empresa}
                                    onChange={handleChange}
                                    required
                                    className="
                                        w-full
                                        border
                                        border-gray-300
                                        rounded-lg
                                        px-4
                                        py-3
                                        outline-none
                                        focus:ring-2
                                        focus:ring-green-500
                                    "
                                >

                                    <option value="">
                                        Selecione uma empresa
                                    </option>

                                    {empresas.map((empresa) => (

                                        <option
                                            key={
                                                empresa.id_empresa ??
                                                empresa.id
                                            }
                                            value={
                                                empresa.id_empresa ??
                                                empresa.id
                                            }
                                        >

                                            {empresa.nome_empresa ||
                                                empresa.nome ||
                                                empresa.razao_social ||
                                                `Empresa #${empresa.id_empresa ??
                                                empresa.id
                                                }`}

                                        </option>

                                    ))}

                                </select>

                            </div>


                            {/* COOPERATIVA */}

                            <div>

                                <label className="
                                    block
                                    text-sm
                                    font-medium
                                    text-gray-700
                                    mb-2
                                ">
                                    Cooperativa
                                </label>

                                <select
                                    name="id_cooperativa"
                                    value={form.id_cooperativa}
                                    onChange={handleChange}
                                    required
                                    className="
                                        w-full
                                        border
                                        border-gray-300
                                        rounded-lg
                                        px-4
                                        py-3
                                        outline-none
                                        focus:ring-2
                                        focus:ring-green-500
                                    "
                                >

                                    <option value="">
                                        Selecione uma cooperativa
                                    </option>

                                    {cooperativas.map((cooperativa) => (

                                        <option
                                            key={
                                                cooperativa.id_cooperativa ??
                                                cooperativa.id
                                            }
                                            value={
                                                cooperativa.id_cooperativa ??
                                                cooperativa.id
                                            }
                                        >

                                            {cooperativa.nome_cooperativa ||
                                                cooperativa.nome ||
                                                `Cooperativa #${cooperativa.id_cooperativa ??
                                                cooperativa.id
                                                }`}

                                        </option>

                                    ))}

                                </select>

                            </div>


                            {/* BOTÕES */}

                            <div className="
                                flex
                                justify-end
                                gap-3
                                pt-4
                            ">

                                <button
                                    type="button"
                                    onClick={() =>
                                        setModalAberto(false)
                                    }
                                    className="
                                        px-5
                                        py-2.5
                                        border
                                        border-gray-300
                                        rounded-lg
                                        hover:bg-gray-100
                                    "
                                >

                                    Cancelar

                                </button>


                                <button
                                    type="submit"
                                    className="
                                        px-5
                                        py-2.5
                                        bg-green-600
                                        text-white
                                        rounded-lg
                                        hover:bg-green-700
                                    "
                                >

                                    Criar parceria

                                </button>

                            </div>

                        </form>

                    </div>

                </div>

            )}

        </div>
    );
}

export default Parcerias;

