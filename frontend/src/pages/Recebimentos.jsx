// RF10 — Receber a produção entregue pelos cooperados: pesagem, classificação e nota de recebimento.
import React from 'react';
import { Printer } from 'lucide-react';
import { recebimentosAPI, produtorAPI, safrasAPI } from '../services/api';
import useCrud from '../services/useCrud';
import CrudSecao from '../components/CrudSecao';
import { Badge, BotaoIcone, ResumoCards, fmtData, fmtNum, hoje } from '../components/ui';

const CLASSIFICACOES = ['Tipo 1', 'Tipo 2', 'Tipo 3', 'Fora de padrão'];
const COR_CLASS = { 'Tipo 1': 'green', 'Tipo 2': 'blue', 'Tipo 3': 'yellow', 'Fora de padrão': 'red' };
const PRODUTOS = ['Milho', 'Feijão', 'Mandioca', 'Sorgo', 'Algodão', 'Castanha de caju', 'Leite', 'Hortaliças'];

const gerarNota = () => `NR-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`;

// peso líquido = (bruto − tara) − desconto por impureza
function pesos(f) {
  const bruto = Number(f.peso_bruto_kg) || 0;
  const tara = Number(f.tara_kg) || 0;
  const imp = Number(f.impureza_pct) || 0;
  const base = Math.max(bruto - tara, 0);
  const desconto = base * (imp / 100);
  return { base, desconto, liquido: base - desconto };
}

const esc = (s) =>
  String(s ?? '-').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

function imprimirNota(r, cooperado) {
  const p = pesos(r);
  const w = window.open('', '_blank', 'width=800,height=900');
  if (!w) {
    alert('Não foi possível abrir a janela de impressão. Libere pop-ups para este site.');
    return;
  }
  w.document.write(`<!doctype html><html lang="pt-BR"><head><meta charset="utf-8">
<title>Nota ${esc(r.numero_nota)}</title>
<style>
  body{font-family:system-ui,sans-serif;margin:32px;color:#0f172a}
  h1{margin:0;font-size:22px} .sub{color:#64748b;margin:4px 0 24px}
  table{width:100%;border-collapse:collapse;margin-bottom:20px}
  td,th{border:1px solid #cbd5e1;padding:8px 10px;text-align:left;font-size:14px}
  th{background:#f1f5f9;width:35%}
  .total{font-size:18px;font-weight:700}
  .ass{margin-top:70px;display:flex;gap:40px}
  .ass div{flex:1;border-top:1px solid #0f172a;padding-top:6px;text-align:center;font-size:13px}
</style></head><body>
<h1>Nota de Recebimento de Produção</h1>
<div class="sub">AgroLinker — Nº ${esc(r.numero_nota)} — ${esc(fmtData(r.data_recebimento))}</div>
<table>
  <tr><th>Cooperado</th><td>${esc(cooperado)}</td></tr>
  <tr><th>Produto</th><td>${esc(r.produto)}</td></tr>
  <tr><th>Classificação</th><td>${esc(r.classificacao)}</td></tr>
  <tr><th>Umidade</th><td>${r.umidade_pct != null ? esc(fmtNum(r.umidade_pct, 1)) + ' %' : '-'}</td></tr>
  <tr><th>Impurezas</th><td>${r.impureza_pct != null ? esc(fmtNum(r.impureza_pct, 1)) + ' %' : '-'}</td></tr>
  <tr><th>Veículo (placa)</th><td>${esc(r.placa_veiculo)}</td></tr>
</table>
<table>
  <tr><th>Peso bruto</th><td>${esc(fmtNum(r.peso_bruto_kg))} kg</td></tr>
  <tr><th>Tara</th><td>${esc(fmtNum(r.tara_kg))} kg</td></tr>
  <tr><th>Desconto por impurezas</th><td>${esc(fmtNum(p.desconto))} kg</td></tr>
  <tr><th class="total">Peso líquido</th><td class="total">${esc(fmtNum(p.liquido))} kg</td></tr>
</table>
<p>Observações: ${esc(r.observacoes)}</p>
<div class="ass"><div>${esc(cooperado)}<br>Cooperado</div><div>${esc(r.responsavel)}<br>Responsável pelo recebimento</div></div>
<script>window.onload=function(){window.print()}</script>
</body></html>`);
  w.document.close();
}

function Recebimentos() {
  const recebimentos = useCrud(recebimentosAPI);
  const produtores = useCrud(produtorAPI);
  const safras = useCrud(safrasAPI);

  const nomeProdutor = (id) =>
    produtores.itens.find((p) => Number(p.id_produtor) === Number(id))?.nome || `Produtor ${id}`;

  function topo(itens) {
    const mes = hoje().slice(0, 7);
    const doMes = itens.filter((r) => String(r.data_recebimento).startsWith(mes));
    const kgMes = doMes.reduce((t, r) => t + (Number(r.peso_liquido_kg) || pesos(r).liquido), 0);
    const kgTotal = itens.reduce((t, r) => t + (Number(r.peso_liquido_kg) || pesos(r).liquido), 0);
    const foraPadrao = itens.filter((r) => r.classificacao === 'Fora de padrão').length;
    return (
      <ResumoCards
        itens={[
          { rotulo: 'Notas no mês', valor: doMes.length },
          { rotulo: 'Recebido no mês', valor: `${fmtNum(kgMes, 0)} kg` },
          { rotulo: 'Recebido (total)', valor: `${fmtNum(kgTotal, 0)} kg` },
          { rotulo: 'Fora de padrão', valor: foraPadrao, tom: foraPadrao ? 'alerta' : '' }
        ]}
      />
    );
  }

  return (
    <CrudSecao
      titulo="Recebimento de Produção"
      descricao="Pesagem, classificação e nota de recebimento da produção dos cooperados"
      labelNovo="Novo Recebimento"
      crud={recebimentos}
      idKey="id_recebimento"
      larguraModal={720}
      inicial={() => ({
        numero_nota: gerarNota(), id_produtor: '', id_safra: '', produto: '', data_recebimento: hoje(),
        peso_bruto_kg: '', tara_kg: '', umidade_pct: '', impureza_pct: '', classificacao: '',
        placa_veiculo: '', responsavel: '', observacoes: ''
      })}
      topo={topo}
      filtro={(r, t) =>
        (r.numero_nota || '').toLowerCase().includes(t) ||
        nomeProdutor(r.id_produtor).toLowerCase().includes(t) ||
        (r.produto || '').toLowerCase().includes(t)
      }
      placeholderBusca="Buscar por nota, cooperado ou produto..."
      validar={(f) => {
        if (!(Number(f.peso_bruto_kg) > 0)) return 'Informe o peso bruto.';
        if (Number(f.tara_kg || 0) >= Number(f.peso_bruto_kg)) return 'A tara deve ser menor que o peso bruto.';
        if (f.umidade_pct !== '' && (Number(f.umidade_pct) < 0 || Number(f.umidade_pct) > 100)) return 'Umidade deve estar entre 0 e 100%.';
        if (f.impureza_pct !== '' && (Number(f.impureza_pct) < 0 || Number(f.impureza_pct) > 100)) return 'Impurezas devem estar entre 0 e 100%.';
        return null;
      }}
      paraPayload={(f) => ({
        numero_nota: f.numero_nota,
        id_produtor: Number(f.id_produtor),
        id_safra: f.id_safra === '' ? null : Number(f.id_safra),
        produto: f.produto,
        data_recebimento: f.data_recebimento,
        peso_bruto_kg: Number(f.peso_bruto_kg),
        tara_kg: Number(f.tara_kg || 0),
        umidade_pct: f.umidade_pct === '' ? null : Number(f.umidade_pct),
        impureza_pct: f.impureza_pct === '' ? null : Number(f.impureza_pct),
        peso_liquido_kg: Number(pesos(f).liquido.toFixed(2)),
        classificacao: f.classificacao,
        placa_veiculo: f.placa_veiculo || null,
        responsavel: f.responsavel || null,
        observacoes: f.observacoes || null
      })}
      campos={(f) => [
        { name: 'numero_nota', label: 'Nº da nota', readOnly: true },
        { name: 'data_recebimento', label: 'Data do recebimento', tipo: 'date', required: true },
        {
          name: 'id_produtor', label: 'Cooperado', required: true, numerico: true, full: true,
          opcoes: produtores.itens.map((p) => ({ value: p.id_produtor, label: `${p.nome} - ID ${p.id_produtor}` }))
        },
        { name: 'produto', label: 'Produto', required: true, sugestoes: PRODUTOS },
        {
          name: 'id_safra', label: 'Safra de origem (opcional)', numerico: true,
          opcoes: safras.itens
            .filter((s) => !f.id_produtor || Number(s.id_produtor) === Number(f.id_produtor))
            .map((s) => ({ value: s.id_safra, label: `${s.cultura} — plantio ${fmtData(s.data_plantio)}` }))
        },
        { name: 'peso_bruto_kg', label: 'Peso bruto (kg)', tipo: 'number', step: '0.01', min: '0', required: true },
        { name: 'tara_kg', label: 'Tara (kg)', tipo: 'number', step: '0.01', min: '0', required: true },
        { name: 'umidade_pct', label: 'Umidade (%)', tipo: 'number', step: '0.1', min: '0', max: '100' },
        { name: 'impureza_pct', label: 'Impurezas (%)', tipo: 'number', step: '0.1', min: '0', max: '100', hint: 'Descontadas do peso líquido.' },
        { name: 'classificacao', label: 'Classificação', opcoes: CLASSIFICACOES, required: true },
        { name: 'placa_veiculo', label: 'Placa do veículo' },
        { name: 'responsavel', label: 'Responsável pelo recebimento' },
        { name: 'observacoes', label: 'Observações', tipo: 'textarea', full: true }
      ]}
      rodapeForm={(f) => {
        const p = pesos(f);
        return (
          <div className="agro-preview">
            <span>Bruto − tara: <strong>{fmtNum(p.base)} kg</strong></span>
            <span>Desconto: <strong>{fmtNum(p.desconto)} kg</strong></span>
            <span>Peso líquido: <strong>{fmtNum(p.liquido)} kg</strong></span>
          </div>
        );
      }}
      colunas={[
        { titulo: 'Nota', render: (r) => <strong>{r.numero_nota}</strong> },
        { titulo: 'Data', render: (r) => fmtData(r.data_recebimento) },
        { titulo: 'Cooperado', render: (r) => nomeProdutor(r.id_produtor) },
        { titulo: 'Produto', render: (r) => r.produto },
        { titulo: 'Bruto (kg)', render: (r) => fmtNum(r.peso_bruto_kg) },
        { titulo: 'Líquido (kg)', render: (r) => <strong>{fmtNum(r.peso_liquido_kg ?? pesos(r).liquido)}</strong> },
        { titulo: 'Umidade', render: (r) => (r.umidade_pct != null ? `${fmtNum(r.umidade_pct, 1)} %` : '-') },
        { titulo: 'Classe', render: (r) => <Badge cor={COR_CLASS[r.classificacao] || 'gray'}>{r.classificacao}</Badge> }
      ]}
      acoesExtras={(r) => (
        <BotaoIcone title="Imprimir nota de recebimento" cor="#0f766e" onClick={() => imprimirNota(r, nomeProdutor(r.id_produtor))}>
          <Printer size={18} />
        </BotaoIcone>
      )}
    />
  );
}

export default Recebimentos;
