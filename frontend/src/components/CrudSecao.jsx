import React, { useState } from 'react';
import { Plus, Pencil, Trash2, Search } from 'lucide-react';
import { Modal, Campo, Estado, BotaoIcone } from './ui';
import { msgErro } from '../services/useCrud';

/**
 * Seção CRUD genérica (lista + busca + modal de cadastro/edição + exclusão).
 *
 * crud        -> retorno de useCrud(api)
 * idKey       -> nome da chave primária (ex.: 'id_safra')
 * colunas     -> [{ titulo, render: (item) => node }]
 * campos      -> array ou função (form) => array de
 *                { name, label, tipo, opcoes, required, numerico, full, hint,
 *                  sugestoes, step, min, readOnly, placeholder, somenteExibicao }
 * inicial     -> objeto (ou função) com o formulário vazio
 * validar     -> (form, editId) => string | null
 * paraPayload -> (form) => objeto enviado à API (padrão: converte '' em null e números)
 * acoesExtras -> (item) => node
 * topo        -> (itens) => node (cards de resumo)
 * filtro      -> (item, termo) => boolean (ativa a barra de busca)
 * rodapeForm  -> (form) => node (ex.: cálculo em tempo real)
 * compacto    -> usa h3 (para seções dentro de abas)
 */
export default function CrudSecao({
  titulo, descricao, labelNovo = 'Novo registro', crud, idKey, colunas, campos,
  inicial, paraPayload, validar, acoesExtras, topo, filtro, rodapeForm,
  larguraModal = 650, compacto = false, placeholderBusca = 'Buscar...', vazio = 'Nenhum registro encontrado.'
}) {
  const getInicial = () => (typeof inicial === 'function' ? inicial() : inicial);

  const [aberto, setAberto] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(getInicial);
  const [busca, setBusca] = useState('');
  const [salvando, setSalvando] = useState(false);

  const defs = typeof campos === 'function' ? campos(form) : campos;

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  function abrirNovo() {
    setEditId(null);
    setForm(getInicial());
    setAberto(true);
  }

  function abrirEdicao(item) {
    const base = getInicial();
    const defsBase = typeof campos === 'function' ? campos(base) : campos;
    const novo = { ...base };
    defsBase.forEach((c) => {
      let v = item[c.name];
      if (v === null || v === undefined) v = '';
      if (c.tipo === 'date') v = String(v).slice(0, 10);
      if (c.tipo === 'datetime-local') v = String(v).slice(0, 16);
      novo[c.name] = v;
    });
    setEditId(item[idKey]);
    setForm(novo);
    setAberto(true);
  }

  function payloadPadrao() {
    const out = {};
    defs.forEach((c) => {
      if (c.somenteExibicao) return;
      let v = form[c.name];
      if (v === '' || v === undefined) v = null;
      else if (c.tipo === 'number' || c.numerico) v = Number(v);
      out[c.name] = v;
    });
    return out;
  }

  async function enviar(e) {
    e.preventDefault();
    const msg = validar ? validar(form, editId) : null;
    if (msg) {
      alert(msg);
      return;
    }
    try {
      setSalvando(true);
      await crud.salvar(editId, paraPayload ? paraPayload(form) : payloadPadrao());
      setAberto(false);
    } catch (error) {
      console.error('Erro ao salvar:', error, error.response?.data);
      alert(msgErro(error, 'Erro ao salvar o registro.'));
    } finally {
      setSalvando(false);
    }
  }

  async function remover(item) {
    if (!window.confirm('Tem certeza que deseja excluir este registro?')) return;
    try {
      await crud.excluir(item[idKey]);
    } catch (error) {
      console.error('Erro ao excluir:', error, error.response?.data);
      alert(msgErro(error, 'Erro ao excluir o registro.'));
    }
  }

  const itens = filtro && busca
    ? crud.itens.filter((i) => filtro(i, busca.toLowerCase()))
    : crud.itens;

  const Titulo = compacto ? 'h3' : 'h2';

  return (
    <div>
      <div className={compacto ? 'agro-sec-head' : 'page-header'}>
        <div>
          <Titulo>{titulo}</Titulo>
          {descricao && <p>{descricao}</p>}
        </div>
        <button className="btn-primary" onClick={abrirNovo}>
          <Plus size={18} />
          {labelNovo}
        </button>
      </div>

      {!crud.loading && !crud.erro && topo && topo(crud.itens)}

      {filtro && (
        <div className="agro-busca">
          <Search size={20} />
          <input
            type="text"
            placeholder={placeholderBusca}
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
          />
        </div>
      )}

      <Estado loading={crud.loading} erro={crud.erro} />

      {!crud.loading && !crud.erro && (
        <div className="table-container">
          <table className="custom-table">
            <thead>
              <tr>
                {colunas.map((c) => <th key={c.titulo}>{c.titulo}</th>)}
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {itens.length > 0 ? (
                itens.map((item) => (
                  <tr key={item[idKey]}>
                    {colunas.map((c) => <td key={c.titulo}>{c.render(item)}</td>)}
                    <td>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        {acoesExtras && acoesExtras(item)}
                        <BotaoIcone title="Editar" cor="#2563eb" onClick={() => abrirEdicao(item)}>
                          <Pencil size={18} />
                        </BotaoIcone>
                        <BotaoIcone title="Excluir" cor="#dc2626" onClick={() => remover(item)}>
                          <Trash2 size={18} />
                        </BotaoIcone>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={colunas.length + 1} style={{ textAlign: 'center', padding: '2rem' }}>
                    {vazio}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {aberto && (
        <Modal
          titulo={`${editId !== null ? 'Editar' : 'Novo'} — ${titulo}`}
          onClose={() => setAberto(false)}
          largura={larguraModal}
        >
          <form onSubmit={enviar}>
            <div className="agro-form-grid">
              {defs.map((c) => {
                // eslint-disable-next-line no-unused-vars
                const { numerico, somenteExibicao, ...resto } = c;
                return (
                  <Campo
                    key={c.name}
                    {...resto}
                    value={form[c.name] ?? ''}
                    onChange={handleChange}
                  />
                );
              })}
            </div>
            {rodapeForm && rodapeForm(form)}
            <div className="agro-form-acoes">
              <button type="button" className="agro-btn-sec" onClick={() => setAberto(false)}>
                Cancelar
              </button>
              <button type="submit" className="btn-primary" disabled={salvando}>
                {salvando ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
