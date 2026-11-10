// RF07 — Estoque de insumos (sementes, adubos, defensivos) com entradas, saídas e lotes.
// O saldo é sempre calculado a partir das movimentações: Σ entradas − Σ saídas.
import React, { useState } from 'react';
import { insumosAPI, lotesAPI, movInsumosAPI } from '../services/api';
import useCrud from '../services/useCrud';
import CrudSecao from '../components/CrudSecao';
import { Abas, Badge, ResumoCards, fmtData, fmtNum, hoje, diasAte } from '../components/ui';

const CATEGORIAS = ['Semente', 'Adubo', 'Defensivo', 'Corretivo', 'Outro'];
const UNIDADES = ['kg', 'g', 'L', 'mL', 'saco', 'un'];
const DIAS_ALERTA_VALIDADE = 30;

function Insumos() {
  const [aba, setAba] = useState('estoque');
  const insumos = useCrud(insumosAPI);
  const lotes = useCrud(lotesAPI);
  const movs = useCrud(movInsumosAPI);

  const sinal = (m) => (m.tipo === 'Entrada' ? 1 : -1);
  const soma = (lista) => lista.reduce((t, m) => t + sinal(m) * Number(m.quantidade), 0);

  const saldoInsumo = (id) => soma(movs.itens.filter((m) => Number(m.id_insumo) === Number(id)));
  const saldoLote = (id) => soma(movs.itens.filter((m) => Number(m.id_lote) === Number(id)));

  const insumo = (id) => insumos.itens.find((i) => Number(i.id_insumo) === Number(id));
  const lote = (id) => lotes.itens.find((l) => Number(l.id_lote) === Number(id));
  const nomeInsumo = (id) => insumo(id)?.nome || `Insumo ${id}`;
  const unidade = (id) => insumo(id)?.unidade || '';

  function situacaoValidade(l) {
    const d = diasAte(l.validade);
    if (d === null) return <span>-</span>;
    if (d < 0) return <Badge cor="red">Vencido</Badge>;
    if (d <= DIAS_ALERTA_VALIDADE) return <Badge cor="yellow">Vence em {d} d</Badge>;
    return <Badge cor="green">{fmtData(l.validade)}</Badge>;
  }

  // ---------- cards de alerta (aparecem em todas as abas) ----------
  const abaixoMinimo = insumos.itens.filter((i) => saldoInsumo(i.id_insumo) <= Number(i.estoque_minimo || 0)).length;
  const lotesComSaldo = lotes.itens.filter((l) => saldoLote(l.id_lote) > 0);
  const vencidos = lotesComSaldo.filter((l) => diasAte(l.validade) !== null && diasAte(l.validade) < 0).length;
  const vencendo = lotesComSaldo.filter((l) => {
    const d = diasAte(l.validade);
    return d !== null && d >= 0 && d <= DIAS_ALERTA_VALIDADE;
  }).length;

  // ---------- validação das movimentações ----------
  function validarMov(f, editId) {
    const qtd = Number(f.quantidade);
    if (!(qtd > 0)) return 'Informe uma quantidade maior que zero.';
    const l = lote(f.id_lote);
    if (!l) return 'Selecione um lote.';
    if (Number(l.id_insumo) !== Number(f.id_insumo)) return 'O lote selecionado não pertence a este insumo.';
    if (f.tipo === 'Saída') {
      if (diasAte(l.validade) !== null && diasAte(l.validade) < 0) {
        return 'Este lote está vencido e não pode ter saída.';
      }
      let disponivel = saldoLote(l.id_lote);
      const anterior = editId !== null ? movs.itens.find((m) => m.id_movimentacao === editId) : null;
      if (anterior && Number(anterior.id_lote) === Number(l.id_lote)) {
        disponivel -= sinal(anterior) * Number(anterior.quantidade); // desconsidera o próprio registro
      }
      if (qtd > disponivel) {
        return `Saldo insuficiente no lote ${l.numero_lote}: disponível ${fmtNum(disponivel)} ${unidade(f.id_insumo)}.`;
      }
    }
    return null;
  }

  const resumo = (
    <ResumoCards
      itens={[
        { rotulo: 'Insumos cadastrados', valor: insumos.itens.length },
        { rotulo: 'Abaixo do mínimo', valor: abaixoMinimo, tom: abaixoMinimo ? 'alerta' : '' },
        { rotulo: 'Lotes vencidos (com saldo)', valor: vencidos, tom: vencidos ? 'perigo' : '' },
        { rotulo: `Vencem em ${DIAS_ALERTA_VALIDADE} dias`, valor: vencendo, tom: vencendo ? 'alerta' : '' }
      ]}
    />
  );

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>Estoque de Insumos</h2>
          <p>Sementes, adubos e defensivos: saldo, lotes, entradas e saídas</p>
        </div>
      </div>

      {!insumos.loading && !lotes.loading && !movs.loading && resumo}

      <Abas
        ativa={aba}
        onChange={setAba}
        abas={[
          { id: 'estoque', label: 'Estoque' },
          { id: 'lotes', label: 'Lotes' },
          { id: 'movimentacoes', label: 'Entradas e saídas' }
        ]}
      />

      {aba === 'estoque' && (
        <CrudSecao
          compacto
          titulo="Insumos"
          descricao="Cadastro e saldo atual de cada insumo"
          labelNovo="Novo Insumo"
          crud={insumos}
          idKey="id_insumo"
          inicial={{ nome: '', categoria: '', unidade: '', estoque_minimo: '0' }}
          filtro={(i, t) => i.nome.toLowerCase().includes(t)}
          placeholderBusca="Buscar insumo..."
          campos={[
            { name: 'nome', label: 'Nome', required: true, full: true, placeholder: 'Ex.: Semente de milho híbrido' },
            { name: 'categoria', label: 'Categoria', opcoes: CATEGORIAS, required: true },
            { name: 'unidade', label: 'Unidade', opcoes: UNIDADES, required: true },
            { name: 'estoque_minimo', label: 'Estoque mínimo', tipo: 'number', step: '0.01', min: '0', hint: 'Abaixo disso, o insumo aparece como "Baixo".' }
          ]}
          colunas={[
            { titulo: 'Nome', render: (i) => <strong>{i.nome}</strong> },
            { titulo: 'Categoria', render: (i) => <Badge cor="blue">{i.categoria}</Badge> },
            { titulo: 'Saldo', render: (i) => `${fmtNum(saldoInsumo(i.id_insumo))} ${i.unidade}` },
            { titulo: 'Mínimo', render: (i) => `${fmtNum(i.estoque_minimo)} ${i.unidade}` },
            {
              titulo: 'Situação',
              render: (i) => {
                const s = saldoInsumo(i.id_insumo);
                if (s <= 0) return <Badge cor="red">Zerado</Badge>;
                if (s <= Number(i.estoque_minimo || 0)) return <Badge cor="yellow">Baixo</Badge>;
                return <Badge cor="green">OK</Badge>;
              }
            }
          ]}
        />
      )}

      {aba === 'lotes' && (
        <CrudSecao
          compacto
          titulo="Lotes"
          descricao="Controle de validade e saldo por lote"
          labelNovo="Novo Lote"
          crud={lotes}
          idKey="id_lote"
          inicial={{ id_insumo: '', numero_lote: '', validade: '', fornecedor: '' }}
          filtro={(l, t) => l.numero_lote.toLowerCase().includes(t) || nomeInsumo(l.id_insumo).toLowerCase().includes(t)}
          placeholderBusca="Buscar por lote ou insumo..."
          campos={[
            {
              name: 'id_insumo', label: 'Insumo', required: true, numerico: true, full: true,
              opcoes: insumos.itens.map((i) => ({ value: i.id_insumo, label: `${i.nome} (${i.unidade})` }))
            },
            { name: 'numero_lote', label: 'Número do lote', required: true },
            { name: 'validade', label: 'Validade', tipo: 'date' },
            { name: 'fornecedor', label: 'Fornecedor', full: true }
          ]}
          colunas={[
            { titulo: 'Lote', render: (l) => <strong>{l.numero_lote}</strong> },
            { titulo: 'Insumo', render: (l) => nomeInsumo(l.id_insumo) },
            { titulo: 'Fornecedor', render: (l) => l.fornecedor || '-' },
            { titulo: 'Validade', render: situacaoValidade },
            { titulo: 'Saldo', render: (l) => `${fmtNum(saldoLote(l.id_lote))} ${unidade(l.id_insumo)}` }
          ]}
        />
      )}

      {aba === 'movimentacoes' && (
        <CrudSecao
          compacto
          titulo="Entradas e saídas"
          descricao="Toda alteração de estoque é registrada aqui"
          labelNovo="Nova Movimentação"
          crud={movs}
          idKey="id_movimentacao"
          inicial={() => ({ tipo: 'Entrada', id_insumo: '', id_lote: '', quantidade: '', data: hoje(), documento: '', observacao: '' })}
          validar={validarMov}
          filtro={(m, t) => nomeInsumo(m.id_insumo).toLowerCase().includes(t)}
          placeholderBusca="Buscar por insumo..."
          campos={(f) => [
            { name: 'tipo', label: 'Tipo', opcoes: ['Entrada', 'Saída'], required: true },
            { name: 'data', label: 'Data', tipo: 'date', required: true },
            {
              name: 'id_insumo', label: 'Insumo', required: true, numerico: true, full: true,
              opcoes: insumos.itens.map((i) => ({ value: i.id_insumo, label: `${i.nome} (${i.unidade})` }))
            },
            {
              name: 'id_lote', label: 'Lote', required: true, numerico: true,
              hint: f.id_insumo ? undefined : 'Escolha o insumo primeiro.',
              opcoes: lotes.itens
                .filter((l) => Number(l.id_insumo) === Number(f.id_insumo))
                .map((l) => ({ value: l.id_lote, label: `${l.numero_lote} — saldo ${fmtNum(saldoLote(l.id_lote))}` }))
            },
            { name: 'quantidade', label: `Quantidade${f.id_insumo ? ` (${unidade(f.id_insumo)})` : ''}`, tipo: 'number', step: '0.01', min: '0', required: true },
            { name: 'documento', label: 'Nota fiscal / documento' },
            { name: 'observacao', label: 'Destino / observação', tipo: 'textarea', full: true, hint: 'Ex.: aplicado na safra de milho do João' }
          ]}
          colunas={[
            { titulo: 'Data', render: (m) => fmtData(m.data) },
            { titulo: 'Tipo', render: (m) => <Badge cor={m.tipo === 'Entrada' ? 'green' : 'red'}>{m.tipo}</Badge> },
            { titulo: 'Insumo', render: (m) => nomeInsumo(m.id_insumo) },
            { titulo: 'Lote', render: (m) => lote(m.id_lote)?.numero_lote || '-' },
            { titulo: 'Quantidade', render: (m) => `${fmtNum(m.quantidade)} ${unidade(m.id_insumo)}` },
            { titulo: 'Observação', render: (m) => m.observacao || '-' }
          ]}
        />
      )}
    </div>
  );
}

export default Insumos;
