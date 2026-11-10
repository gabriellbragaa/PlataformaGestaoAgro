// RF08 — Máquinas e equipamentos: cadastro, uso, agendamento e manutenção.
import React, { useState } from 'react';
import { Check } from 'lucide-react';
import {
  maquinasAPI, usoMaquinasAPI, agendMaquinasAPI, manutMaquinasAPI, produtorAPI
} from '../services/api';
import useCrud, { msgErro } from '../services/useCrud';
import CrudSecao from '../components/CrudSecao';
import { Abas, Badge, BotaoIcone, ResumoCards, fmtData, fmtDataHora, fmtNum, hoje, diasAte } from '../components/ui';

const TIPOS = ['Trator', 'Colheitadeira', 'Pulverizador', 'Plantadeira', 'Bomba d\'água', 'Implemento', 'Veículo', 'Outro'];
const STATUS_MAQ = ['Disponível', 'Em uso', 'Em manutenção', 'Inativa'];
const COR_MAQ = { 'Disponível': 'green', 'Em uso': 'blue', 'Em manutenção': 'yellow', Inativa: 'gray' };
const ATIVIDADES = ['Preparo do solo', 'Plantio', 'Pulverização', 'Colheita', 'Transporte', 'Bombeamento', 'Outro'];
const STATUS_AGEND = ['Agendado', 'Concluído', 'Cancelado'];
const COR_AGEND = { Agendado: 'blue', 'Concluído': 'green', Cancelado: 'gray' };
const STATUS_MANUT = ['Agendada', 'Concluída'];

function Maquinas() {
  const [aba, setAba] = useState('maquinas');
  const maquinas = useCrud(maquinasAPI);
  const usos = useCrud(usoMaquinasAPI);
  const agend = useCrud(agendMaquinasAPI);
  const manut = useCrud(manutMaquinasAPI);
  const produtores = useCrud(produtorAPI);

  const maq = (id) => maquinas.itens.find((m) => Number(m.id_maquina) === Number(id));
  const nomeMaq = (id) => maq(id)?.nome || `Máquina ${id}`;
  const nomeProdutor = (id) =>
    id ? produtores.itens.find((p) => Number(p.id_produtor) === Number(id))?.nome || `Produtor ${id}` : '-';

  const opcoesMaq = maquinas.itens.map((m) => ({ value: m.id_maquina, label: `${m.nome} (${m.tipo})` }));
  const opcoesProd = produtores.itens.map((p) => ({ value: p.id_produtor, label: p.nome }));

  const manutAtrasadas = manut.itens.filter((m) => m.status === 'Agendada' && diasAte(m.data) < 0).length;
  const agendHoje = agend.itens.filter(
    (a) => a.status === 'Agendado' && String(a.data_inicio).slice(0, 10) <= hoje() && String(a.data_fim).slice(0, 10) >= hoje()
  ).length;

  async function marcar(crud, item, dados, msgPadrao) {
    try {
      await crud.salvar(item[crud === manut ? 'id_manutencao' : 'id_agendamento'], { ...item, ...dados });
    } catch (error) {
      alert(msgErro(error, msgPadrao));
    }
  }

  function validarAgendamento(f, editId) {
    if (!f.data_inicio || !f.data_fim) return 'Informe início e fim.';
    if (f.data_fim <= f.data_inicio) return 'O fim deve ser depois do início.';
    const m = maq(f.id_maquina);
    if (m && ['Em manutenção', 'Inativa'].includes(m.status)) {
      return `A máquina está "${m.status}" e não pode ser agendada.`;
    }
    if (f.status === 'Cancelado') return null;
    const ini = new Date(f.data_inicio);
    const fim = new Date(f.data_fim);
    const conflito = agend.itens.find(
      (a) =>
        a.id_agendamento !== editId &&
        a.status !== 'Cancelado' &&
        Number(a.id_maquina) === Number(f.id_maquina) &&
        ini < new Date(a.data_fim) &&
        fim > new Date(a.data_inicio)
    );
    return conflito
      ? `Conflito: a máquina já está agendada de ${fmtDataHora(conflito.data_inicio)} até ${fmtDataHora(conflito.data_fim)}.`
      : null;
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>Máquinas e Equipamentos</h2>
          <p>Frota da cooperativa: uso, agendamento e manutenção</p>
        </div>
      </div>

      <ResumoCards
        itens={[
          { rotulo: 'Máquinas', valor: maquinas.itens.length },
          { rotulo: 'Disponíveis', valor: maquinas.itens.filter((m) => m.status === 'Disponível').length },
          { rotulo: 'Em manutenção', valor: maquinas.itens.filter((m) => m.status === 'Em manutenção').length, tom: 'alerta' },
          { rotulo: 'Manutenções atrasadas', valor: manutAtrasadas, tom: manutAtrasadas ? 'perigo' : '' },
          { rotulo: 'Agendadas para hoje', valor: agendHoje }
        ]}
      />

      <Abas
        ativa={aba}
        onChange={setAba}
        abas={[
          { id: 'maquinas', label: 'Máquinas' },
          { id: 'uso', label: 'Registro de uso' },
          { id: 'agenda', label: 'Agendamentos' },
          { id: 'manutencao', label: 'Manutenções' }
        ]}
      />

      {aba === 'maquinas' && (
        <CrudSecao
          compacto titulo="Máquinas" descricao="Cadastro da frota" labelNovo="Nova Máquina"
          crud={maquinas} idKey="id_maquina"
          inicial={{ nome: '', tipo: '', modelo: '', ano: '', horimetro: '', status: 'Disponível' }}
          filtro={(m, t) => m.nome.toLowerCase().includes(t) || (m.modelo || '').toLowerCase().includes(t)}
          placeholderBusca="Buscar máquina..."
          campos={[
            { name: 'nome', label: 'Nome / identificação', required: true, full: true, placeholder: 'Ex.: Trator Massey 275' },
            { name: 'tipo', label: 'Tipo', opcoes: TIPOS, required: true },
            { name: 'status', label: 'Situação', opcoes: STATUS_MAQ, required: true },
            { name: 'modelo', label: 'Modelo' },
            { name: 'ano', label: 'Ano', tipo: 'number', min: '1950', max: '2100' },
            { name: 'horimetro', label: 'Horímetro atual (h)', tipo: 'number', step: '0.1', min: '0' }
          ]}
          colunas={[
            { titulo: 'Nome', render: (m) => <strong>{m.nome}</strong> },
            { titulo: 'Tipo', render: (m) => m.tipo },
            { titulo: 'Modelo / ano', render: (m) => [m.modelo, m.ano].filter(Boolean).join(' / ') || '-' },
            { titulo: 'Horímetro', render: (m) => (m.horimetro != null ? `${fmtNum(m.horimetro, 1)} h` : '-') },
            { titulo: 'Situação', render: (m) => <Badge cor={COR_MAQ[m.status] || 'gray'}>{m.status}</Badge> }
          ]}
        />
      )}

      {aba === 'uso' && (
        <CrudSecao
          compacto titulo="Registro de uso" descricao="Quem usou, quando e por quantas horas" labelNovo="Registrar Uso"
          crud={usos} idKey="id_uso"
          inicial={() => ({ id_maquina: '', id_produtor: '', data: hoje(), horas_uso: '', horimetro_final: '', atividade: '', operador: '', observacoes: '' })}
          filtro={(u, t) => nomeMaq(u.id_maquina).toLowerCase().includes(t) || nomeProdutor(u.id_produtor).toLowerCase().includes(t)}
          placeholderBusca="Buscar por máquina ou produtor..."
          validar={(f) => (Number(f.horas_uso) <= 0 ? 'Informe as horas de uso.' : null)}
          campos={[
            { name: 'id_maquina', label: 'Máquina', opcoes: opcoesMaq, required: true, numerico: true, full: true },
            { name: 'id_produtor', label: 'Produtor atendido', opcoes: opcoesProd, numerico: true },
            { name: 'data', label: 'Data', tipo: 'date', required: true },
            { name: 'atividade', label: 'Atividade', opcoes: ATIVIDADES, required: true },
            { name: 'horas_uso', label: 'Horas de uso', tipo: 'number', step: '0.1', min: '0', required: true },
            { name: 'horimetro_final', label: 'Horímetro final (h)', tipo: 'number', step: '0.1', min: '0' },
            { name: 'operador', label: 'Operador' },
            { name: 'observacoes', label: 'Observações', tipo: 'textarea', full: true }
          ]}
          colunas={[
            { titulo: 'Data', render: (u) => fmtData(u.data) },
            { titulo: 'Máquina', render: (u) => <strong>{nomeMaq(u.id_maquina)}</strong> },
            { titulo: 'Produtor', render: (u) => nomeProdutor(u.id_produtor) },
            { titulo: 'Atividade', render: (u) => u.atividade },
            { titulo: 'Horas', render: (u) => `${fmtNum(u.horas_uso, 1)} h` },
            { titulo: 'Operador', render: (u) => u.operador || '-' }
          ]}
        />
      )}

      {aba === 'agenda' && (
        <CrudSecao
          compacto titulo="Agendamentos" descricao="Reserva de máquinas, sem sobreposição de horários" labelNovo="Novo Agendamento"
          crud={agend} idKey="id_agendamento"
          inicial={{ id_maquina: '', id_produtor: '', data_inicio: '', data_fim: '', finalidade: '', status: 'Agendado' }}
          validar={validarAgendamento}
          filtro={(a, t) => nomeMaq(a.id_maquina).toLowerCase().includes(t) || nomeProdutor(a.id_produtor).toLowerCase().includes(t)}
          placeholderBusca="Buscar por máquina ou produtor..."
          campos={[
            { name: 'id_maquina', label: 'Máquina', opcoes: opcoesMaq, required: true, numerico: true, full: true },
            { name: 'id_produtor', label: 'Solicitante', opcoes: opcoesProd, numerico: true, required: true },
            { name: 'status', label: 'Situação', opcoes: STATUS_AGEND, required: true },
            { name: 'data_inicio', label: 'Início', tipo: 'datetime-local', required: true },
            { name: 'data_fim', label: 'Fim', tipo: 'datetime-local', required: true },
            { name: 'finalidade', label: 'Finalidade', full: true, placeholder: 'Ex.: Preparo de 5 ha para plantio de milho' }
          ]}
          colunas={[
            { titulo: 'Máquina', render: (a) => <strong>{nomeMaq(a.id_maquina)}</strong> },
            { titulo: 'Solicitante', render: (a) => nomeProdutor(a.id_produtor) },
            { titulo: 'Início', render: (a) => fmtDataHora(a.data_inicio) },
            { titulo: 'Fim', render: (a) => fmtDataHora(a.data_fim) },
            { titulo: 'Finalidade', render: (a) => a.finalidade || '-' },
            { titulo: 'Situação', render: (a) => <Badge cor={COR_AGEND[a.status] || 'gray'}>{a.status}</Badge> }
          ]}
          acoesExtras={(a) =>
            a.status === 'Agendado' && (
              <BotaoIcone title="Marcar como concluído" cor="#16a34a" onClick={() => marcar(agend, a, { status: 'Concluído' }, 'Erro ao concluir o agendamento.')}>
                <Check size={18} />
              </BotaoIcone>
            )
          }
        />
      )}

      {aba === 'manutencao' && (
        <CrudSecao
          compacto titulo="Manutenções" descricao="Preventivas e corretivas, com custo e próxima revisão" labelNovo="Nova Manutenção"
          crud={manut} idKey="id_manutencao"
          inicial={() => ({ id_maquina: '', tipo: 'Preventiva', data: hoje(), status: 'Agendada', custo: '', proxima_manutencao: '', descricao: '' })}
          filtro={(m, t) => nomeMaq(m.id_maquina).toLowerCase().includes(t)}
          placeholderBusca="Buscar por máquina..."
          validar={(f) =>
            f.proxima_manutencao && f.proxima_manutencao < f.data ? 'A próxima manutenção deve ser depois desta.' : null
          }
          campos={[
            { name: 'id_maquina', label: 'Máquina', opcoes: opcoesMaq, required: true, numerico: true, full: true },
            { name: 'tipo', label: 'Tipo', opcoes: ['Preventiva', 'Corretiva'], required: true },
            { name: 'status', label: 'Situação', opcoes: STATUS_MANUT, required: true },
            { name: 'data', label: 'Data', tipo: 'date', required: true },
            { name: 'custo', label: 'Custo (R$)', tipo: 'number', step: '0.01', min: '0' },
            { name: 'proxima_manutencao', label: 'Próxima manutenção', tipo: 'date' },
            { name: 'descricao', label: 'Serviço realizado / a realizar', tipo: 'textarea', full: true }
          ]}
          colunas={[
            { titulo: 'Máquina', render: (m) => <strong>{nomeMaq(m.id_maquina)}</strong> },
            { titulo: 'Tipo', render: (m) => <Badge cor={m.tipo === 'Corretiva' ? 'red' : 'blue'}>{m.tipo}</Badge> },
            { titulo: 'Data', render: (m) => fmtData(m.data) },
            { titulo: 'Custo', render: (m) => (m.custo != null ? `R$ ${fmtNum(m.custo)}` : '-') },
            { titulo: 'Próxima', render: (m) => fmtData(m.proxima_manutencao) },
            {
              titulo: 'Situação',
              render: (m) =>
                m.status === 'Agendada' && diasAte(m.data) < 0
                  ? <Badge cor="red">Atrasada</Badge>
                  : <Badge cor={m.status === 'Concluída' ? 'green' : 'yellow'}>{m.status}</Badge>
            }
          ]}
          acoesExtras={(m) =>
            m.status === 'Agendada' && (
              <BotaoIcone title="Marcar como concluída" cor="#16a34a" onClick={() => marcar(manut, m, { status: 'Concluída' }, 'Erro ao concluir a manutenção.')}>
                <Check size={18} />
              </BotaoIcone>
            )
          }
        />
      )}
    </div>
  );
}

export default Maquinas;
