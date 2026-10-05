import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://127.0.0.1:8000",
  headers: {
    "Content-Type": "application/json",
  },
});

export const produtorAPI = {
  listar: () => api.get("/produtor"),
  buscar: (id) => api.get(`/produtor/${id}`),
  criar: (dados) => api.post("/produtor", dados),
  atualizar: (id, dados) => api.patch(`/produtor/${id}`, dados),
  excluir: (id) => api.delete(`/produtor/${id}`),
};

export const agricultoresAPI = {
  listar: () => api.get("/agricultor"),
  criar: (dados) => api.post("/agricultor", dados),
  excluir: (id) => api.delete(`/agricultor/${id}`),
};
export const pecuaristaAPI = {
  listar: () => api.get("/pecuarista"),
  criar: (dados) => api.post("/pecuarista", dados),
  excluir: (id) => api.delete(`/pecuarista/${id}`),
};

export const empresaAPI = {
  listar: () => api.get("/empresa"),
  criar: (dados) => api.post("/empresa", dados),
  buscar: (id) => api.get(`/empresa/${id}`),
  atualizar: (id, dados) => api.put(`/empresa/${id}`, dados),
  excluir: (id) => api.delete(`/empresa/${id}`),
};
export const cooperativaAPI = {
  listar: () => api.get("/cooperativa"),
  criar: (dados) => api.post("/cooperativa", dados),
  buscar: (id) => api.get(`/cooperativa/${id}`),
  atualizar: (id, dados) => api.put(`/cooperativa/${id}`, dados),
  excluir: (id) => api.delete(`/cooperativa/${id}`),
    importar: (formData) =>
    api.post("/cooperativa/importar", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
};

export const clienteAPI = {
  listar: () => api.get("/client"),
  criar: (dados) => api.post("/client", dados),
  buscar: (id) => api.get(`/client/${id}`),
};

export const funcionarioAPI = {
  listar: () => api.get("/funcionario"),
  criar: (dados) => api.post("/funcionario", dados),
  buscar: (id) => api.get(`/funcionario/${id}`),
  atualizar: (id, dados) => api.patch(`/funcionario/${id}`, dados),
  excluir: (id) => api.delete(`/funcionario/${id}`),
};

export const recursoAPI = {
  listar: () => api.get("/recurso"),
  criar: (dados) => api.post("/recurso", dados),
};

export const parceriaAPI = {
  listar: () => api.get("/parceria"),
  criar: (dados) => api.post("/parceria", dados),
};

export const produtoCooperativaAPI = {
  listar: () => api.get("/produto-cooperativa"),
  criar: (dados) => api.post("/produto-cooperativa", dados),
  buscar: (id) => api.get(`/produto-cooperativa/${id}`),
  atualizar: (id, dados) => api.put(`/produto-cooperativa/${id}`, dados),
  excluir: (id) => api.delete(`/produto-cooperativa/${id}`),
};

export const associadoAPI = {
  listar: () => api.get("/associado"),
  criar: (dados) => api.post("/associado", dados),
  buscar: (id) => api.get(`/associado/${id}`),
  atualizar: (id, dados) => api.put(`/associado/${id}`, dados),
  excluir: (id) => api.delete(`/associado/${id}`),
};

export default api;
