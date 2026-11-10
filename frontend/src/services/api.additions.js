// =====================================================================
// COLE NO FINAL DE src/services/api.js
// Use o mesmo objeto axios que você já usa em produtorAPI / agricultoresAPI.
// Aqui ele está chamado `api` — ajuste o nome se for diferente.
// =====================================================================
const crud = (base, idParam) => ({
  listar: () => api.get(base),
  criar: (dados) => api.post(base, dados),
  atualizar: (id, dados) => api.put(`${base}/${id}`, dados),
  excluir: (id) => api.delete(`${base}/${id}`),
});

export const safrasAPI = crud('/safras');                 // RF06
export const manejosAPI = crud('/manejos');               // RF06
export const insumosAPI = crud('/insumos');               // RF07
export const lotesAPI = crud('/lotes-insumo');            // RF07
export const movInsumosAPI = crud('/movimentacoes-insumo'); // RF07
export const maquinasAPI = crud('/maquinas');             // RF08
export const usoMaquinasAPI = crud('/uso-maquinas');      // RF08
export const agendMaquinasAPI = crud('/agendamentos-maquinas'); // RF08
export const manutMaquinasAPI = crud('/manutencoes-maquinas');  // RF08
export const irrigacaoAPI = crud('/irrigacoes');          // RF09
export const recebimentosAPI = crud('/recebimentos');     // RF10
