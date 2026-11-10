export const bovtraceAPI = {
  // ajuste o caminho conforme o Swagger da API
  movimentacoes: (params) => api.get("/bovtrace/movimentacoes", { params }),
};
