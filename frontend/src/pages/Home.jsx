import React, { useState } from "react";
import { produtorAPI, cooperativaAPI } from "../services/api";

function CadastrarUsuario({ onCadastroSucesso }) {
  const [tipoUsuario, setTipoUsuario] = useState("produtor"); // 'produtor' ou 'cooperativa'
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    nome: "",
    email: "",
    // ...outros campos necessários
  });

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);

    try {
      if (tipoUsuario === "produtor") {
        const response = await produtorAPI.criar(form);
        const novoProdutor = response.data;
        alert("Produtor cadastrado com sucesso!");
        
        // Passa o ID do novo produtor para abrir diretamente o cadastro de produtos
        onCadastroSucesso({
          id_produtor: novoProdutor.id_produtor,
          produtorNome: novoProdutor.nome
        });
      } else {
        const response = await cooperativaAPI.criar(form);
        const novaCooperativa = response.data;
        alert("Cooperativa cadastrada com sucesso!");

        // Passa o ID da nova cooperativa para abrir diretamente o cadastro de produtos
        onCadastroSucesso({
          id_cooperativa: novaCooperativa.id_cooperativa,
          cooperativaNome: novaCooperativa.nome
        });
      }
    } catch (error) {
      console.error("Erro ao cadastrar:", error);
      alert(error.response?.data?.detail || "Erro ao efetuar cadastro.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card-cadastro">
      <h2>Cadastrar {tipoUsuario === "produtor" ? "Produtor" : "Cooperativa"}</h2>
      
      <div className="seletor-tipo">
        <button 
          type="button" 
          onClick={() => setTipoUsuario("produtor")}
          className={tipoUsuario === "produtor" ? "ativo" : ""}
        >
          Produtor
        </button>
        <button 
          type="button" 
          onClick={() => setTipoUsuario("cooperativa")}
          className={tipoUsuario === "cooperativa" ? "ativo" : ""}
        >
          Cooperativa
        </button>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Nome *</label>
          <input
            type="text"
            name="nome"
            value={form.nome}
            onChange={handleChange}
            required
          />
        </div>

        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? "Cadastrando..." : "Cadastrar e Ir para Produtos"}
        </button>
      </form>
    </div>
  );
}

export default CadastrarUsuario;