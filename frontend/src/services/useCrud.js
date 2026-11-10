import { useCallback, useEffect, useState } from 'react';

export function msgErro(error, padrao) {
  const d = error?.response?.data?.detail;
  if (typeof d === 'string') return d;
  if (Array.isArray(d)) return d.map((x) => x.msg).join('; ');
  return padrao;
}

// `api` deve ser um objeto estável (declarado fora do componente)
// com: listar(), criar(dados), atualizar(id, dados), excluir(id)
export default function useCrud(api) {
  const [itens, setItens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState(null);

  const recarregar = useCallback(async (silencioso = false) => {
    try {
      if (!silencioso) setLoading(true);
      setErro(null);
      const response = await api.listar();
      setItens(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Erro ao carregar:', error, error.response?.data);
      setErro(msgErro(error, 'Não foi possível carregar os dados.'));
    } finally {
      setLoading(false);
    }
  }, [api]);

  useEffect(() => {
    recarregar();
  }, [recarregar]);

  // id === null -> cria; caso contrário -> atualiza
  async function salvar(id, dados) {
    if (id !== null && id !== undefined) await api.atualizar(id, dados);
    else await api.criar(dados);
    await recarregar(true);
  }

  async function excluir(id) {
    await api.excluir(id);
    await recarregar(true);
  }

  return { itens, loading, erro, recarregar, salvar, excluir };
}
