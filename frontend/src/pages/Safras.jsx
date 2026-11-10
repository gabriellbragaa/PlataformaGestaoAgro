// RF06 — Registrar safras: plantio, manejo, colheita e produtividade.
import React, { useState } from 'react';
import { ClipboardList, Wheat, Trash2 } from 'lucide-react';
import { safrasAPI, manejosAPI, produtorAPI } from '../services/api';
import useCrud, { msgErro } from '../services/useCrud';
import CrudSecao from '../components/CrudSecao';
import { Modal, Campo, Badge, BotaoIcone, ResumoCards, fmtData, fmtNum, hoje } from '../components/ui';

const STATUS = ['Planejada', 'Plantada', 'Em manejo', 'Colhida', 'Perdida'];
const COR_STATUS = { Planejada: 'gray', Plantada: 'blue', 'Em manejo': 'yellow', Colhida: 'green', Perdida: 'red' };
const TIPOS_MANEJO = ['Adubação', 'Irrigação', 'Controle de pragas', 'Controle de plantas daninhas', 'Poda / desbaste', 'Outro'];
const CULTURAS = ['Milho', 'Feijão', 'Mandioca', 'Sorgo', 'Algodão', 'Caju', 'Hortaliças'];

// produtividade em kg/ha
const produtividade = (s) =>
  s.producao_kg && Number(s.area_ha) > 0 ? Number(s.producao_kg) / Number(s.area_ha) : null;

const INICIAL = {
  id_produtor: '', cultura: '', variedade: '', area_ha: '',
  data_plantio: '', data_colheita_prevista: '', status: 'Planejada', observacoes: ''
};

function Safras() {
  const safras = useCrud(safrasAPI);
  const produtores = useCrud(produtorAPI);
  const manejos = useCrud(manejosAPI);

  const [safraManejo, setSafraManejo] = useState(null);
  const [safraColheita, setSafraColheita] = useState(null);

  const agricultores = produtores.itens.filter((p) => p.tipo === 'Agricultor');
  const nomeProdutor = (id) =>
    produtores.itens.find((p) => Number(p.id_produtor) === Number(id))?.nome || `Produtor ${id}`;

  const campos = [
    {
      name: 'id_produtor', label: 'Agricultor', required: true, numerico: true, full: true,
      opcoes: agricultores.map((p) => ({ value: p.id_produtor, label: `${p.nome} - ID ${p.id_produtor}` }))
    },
    { name: 'cultura', label: 'Cultura', required: true, sugestoes: CULTURAS, placeholder: 'Ex.: Milho' },
    { name: 'variedade', label: 'Variedade', placeholder: 'Ex.: BRS 2022' },
    { name: 'area_ha', label: 'Área plantada (ha)', tipo: 'number', step: '0.01', min: '0', required: true },
    { name: 'status', label: 'Situação', opcoes: STATUS, required: true },
    { name: 'data_plantio', label: 'Data do plantio', tipo: 'date' },
    { name: 'data_colheita_prevista', label: 'Colheita prevista', tipo: 'date' },
    { name: 'observacoes', label: 'Observações', tipo: 'textarea', full: true }
  ];

  const colunas = [
    { titulo: 'Agricultor', render: (s) => <strong>{nomeProdutor(s.id_produtor)}</strong> },
    { titulo: 'Cultura', render: (s) => `${s.cultura}${s.variedade ? ` (${s.variedade})` : ''}` },
    { titulo: 'Área (ha)', render: (s) => fmtNum(s.area_ha) },
    { titulo: 'Plantio', render: (s) => fmtData(s.data_plantio) },
    { titulo: 'Colheita', render: (s) => fmtData(s.data_colheita || s.data_colheita_prevista) },
    { titulo: 'Produção (kg)', render: (s) => fmtNum(s.producao_kg, 0) },
    { titulo: 'Produtividade', render: (s) => (produtividade(s) ? `${fmtNum(produtividade(s), 0)} kg/ha` : '-') },
    { titulo: 'Situação', render: (s) => <Badge cor={COR_STATUS[s.status] || 'gray'}>{s.status}</Badge> }
  ];

  function topo(itens) {
    const ativas = itens.filter((s) => ['Plantada', 'Em manejo'].includes(s.status));
    const colhidas = itens.filter((s) => produtividade(s));
    const prod = colhidas.reduce((t, s) => t + Number(s.producao_kg), 0);
    const area = colhidas.reduce((t, s) => t + Number(s.area_ha), 0);
    return (
      <ResumoCards
        itens={[
          { rotulo: 'Safras em andamento', valor: ativas.length },
          { rotulo: 'Área em andamento', valor: `${fmtNum(ativas.reduce((t, s) => t + Number(s.area_ha || 0), 0))} ha` },
          { rotulo: 'Produção colhida', valor: `${fmtNum(prod, 0)} kg` },
          { rotulo: 'Produtividade média', valor: area ? `${fmtNum(prod / area, 0)} kg/ha` : '-', detalhe: 'safras colhidas' }
        ]}
      />
    );
  }

  return (
    <>
      <CrudSecao
        titulo="Safras"
        descricao="Plantio, manejo, colheita e produtividade de cada safra"
        labelNovo="Nova Safra"
        crud={safras}
        idKey="id_safra"
        colunas={colunas}
        campos={campos}
        inicial={INICIAL}
        topo={topo}
        filtro={(s, t) =>
          nomeProdutor(s.id_produtor).toLowerCase().includes(t) || (s.cultura || '').toLowerCase().includes(t)
        }
        placeholderBusca="Buscar por agricultor ou cultura..."
        validar={(f) =>
          f.data_plantio && f.data_colheita_prevista && f.data_colheita_prevista < f.data_plantio
            ? 'A colheita prevista não pode ser anterior ao plantio.'
            : null
        }
        acoesExtras={(s) => (
          <>
            <BotaoIcone title="Registrar manejo" cor="#0f766e" onClick={() => setSafraManejo(s)}>
              <ClipboardList size={18} />
            </BotaoIcone>
            <BotaoIcone title="Registrar colheita" cor="#a16207" onClick={() => setSafraColheita(s)}>
              <Wheat size={18} />
            </BotaoIcone>
          </>
        )}
      />

      {safraManejo && (
        <ModalManejo
          safra={safraManejo}
          nome={nomeProdutor(safraManejo.id_produtor)}
          manejos={manejos}
          onClose={() => setSafraManejo(null)}
        />
      )}

      {safraColheita && (
        <ModalColheita
          safra={safraColheita}
          nome={nomeProdutor(safraColheita.id_produtor)}
          onClose={() => setSafraColheita(null)}
          onSalvar={(dados) => safras.salvar(safraColheita.id_safra, { ...safraColheita, ...dados })}
        />
      )}
    </>
  );
}

// ---------------------------------------------------------------
function ModalManejo({ safra, nome, manejos, onClose }) {
  const vazio = { tipo: '', data: hoje(), descricao: '', custo: '' };
  const [form, setForm] = useState(vazio);
  const [salvando, setSalvando] = useState(false);

  const lista = manejos.itens
    .filter((m) => Number(m.id_safra) === Number(safra.id_safra))
    .sort((a, b) => String(b.data).localeCompare(String(a.data)));

  const handleChange = (e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  async function adicionar(e) {
    e.preventDefault();
    try {
      setSalvando(true);
      await manejos.salvar(null, {
        id_safra: safra.id_safra,
        tipo: form.tipo,
        data: form.data,
        descricao: form.descricao || null,
        custo: form.custo === '' ? null : Number(form.custo)
      });
      setForm(vazio);
    } catch (error) {
      alert(msgErro(error, 'Erro ao registrar o manejo.'));
    } finally {
      setSalvando(false);
    }
  }

  async function remover(id) {
    if (!window.confirm('Excluir este registro de manejo?')) return;
    try {
      await manejos.excluir(id);
    } catch (error) {
      alert(msgErro(error, 'Erro ao excluir o manejo.'));
    }
  }

  return (
    <Modal titulo="Manejo da safra" subtitulo={`${safra.cultura} — ${nome}`} onClose={onClose} largura={760}>
      <div className="agro-sublista">
        <h4>Histórico ({lista.length})</h4>
        {lista.length === 0 ? (
          <p style={{ color: '#64748b' }}>Nenhum manejo registrado nesta safra.</p>
        ) : (
          <div className="table-container">
            <table className="custom-table">
              <thead>
                <tr><th>Data</th><th>Tipo</th><th>Descrição</th><th>Custo (R$)</th><th></th></tr>
              </thead>
              <tbody>
                {lista.map((m) => (
                  <tr key={m.id_manejo}>
                    <td>{fmtData(m.data)}</td>
                    <td><Badge cor="blue">{m.tipo}</Badge></td>
                    <td>{m.descricao || '-'}</td>
                    <td>{m.custo != null ? fmtNum(m.custo) : '-'}</td>
                    <td>
                      <BotaoIcone title="Excluir manejo" cor="#dc2626" onClick={() => remover(m.id_manejo)}>
                        <Trash2 size={16} />
                      </BotaoIcone>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <form onSubmit={adicionar}>
        <h4 style={{ margin: '0 0 8px' }}>Novo manejo</h4>
        <div className="agro-form-grid">
          <Campo name="tipo" label="Tipo de manejo" opcoes={TIPOS_MANEJO} required value={form.tipo} onChange={handleChange} />
          <Campo name="data" label="Data" tipo="date" required value={form.data} onChange={handleChange} />
          <Campo name="descricao" label="Descrição" full placeholder="Ex.: 200 kg/ha de NPK em cobertura" value={form.descricao} onChange={handleChange} />
          <Campo name="custo" label="Custo (R$)" tipo="number" step="0.01" min="0" value={form.custo} onChange={handleChange} />
        </div>
        <div className="agro-form-acoes">
          <button type="button" className="agro-btn-sec" onClick={onClose}>Fechar</button>
          <button type="submit" className="btn-primary" disabled={salvando}>
            {salvando ? 'Salvando...' : 'Registrar manejo'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

// ---------------------------------------------------------------
function ModalColheita({ safra, nome, onClose, onSalvar }) {
  const [form, setForm] = useState({
    data_colheita: String(safra.data_colheita || hoje()).slice(0, 10),
    producao_kg: safra.producao_kg ?? ''
  });
  const [salvando, setSalvando] = useState(false);
  const handleChange = (e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const prod = form.producao_kg && Number(safra.area_ha) > 0 ? Number(form.producao_kg) / Number(safra.area_ha) : null;

  async function enviar(e) {
    e.preventDefault();
    if (safra.data_plantio && form.data_colheita < String(safra.data_plantio).slice(0, 10)) {
      alert('A data da colheita não pode ser anterior ao plantio.');
      return;
    }
    try {
      setSalvando(true);
      await onSalvar({ data_colheita: form.data_colheita, producao_kg: Number(form.producao_kg), status: 'Colhida' });
      onClose();
    } catch (error) {
      alert(msgErro(error, 'Erro ao registrar a colheita.'));
    } finally {
      setSalvando(false);
    }
  }

  return (
    <Modal titulo="Registrar colheita" subtitulo={`${safra.cultura} — ${nome} (${fmtNum(safra.area_ha)} ha)`} onClose={onClose} largura={500}>
      <form onSubmit={enviar}>
        <div className="agro-form-grid">
          <Campo name="data_colheita" label="Data da colheita" tipo="date" required value={form.data_colheita} onChange={handleChange} />
          <Campo name="producao_kg" label="Produção total (kg)" tipo="number" step="0.01" min="0" required value={form.producao_kg} onChange={handleChange} />
        </div>
        <div className="agro-preview">
          <span>Produtividade: <strong>{prod ? `${fmtNum(prod, 0)} kg/ha` : '-'}</strong></span>
          <span>A safra ficará como <strong>Colhida</strong>.</span>
        </div>
        <div className="agro-form-acoes">
          <button type="button" className="agro-btn-sec" onClick={onClose}>Cancelar</button>
          <button type="submit" className="btn-primary" disabled={salvando}>
            {salvando ? 'Salvando...' : 'Registrar colheita'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

export default Safras;
