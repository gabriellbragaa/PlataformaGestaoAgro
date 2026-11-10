// RF09 — Uso de água e irrigação (ponto crítico no semiárido).
import React from 'react';
import { irrigacaoAPI, produtorAPI, safrasAPI } from '../services/api';
import useCrud from '../services/useCrud';
import CrudSecao from '../components/CrudSecao';
import { Badge, ResumoCards, fmtData, fmtNum, hoje } from '../components/ui';

const FONTES = ['Poço', 'Cisterna', 'Açude', 'Rio / riacho', 'Barragem', 'Reúso', 'Rede pública'];
const SISTEMAS = ['Gotejamento', 'Microaspersão', 'Aspersão', 'Pivô central', 'Sulcos', 'Manual / mangueira'];
const COR_FONTE = { Poço: 'blue', Cisterna: 'green', 'Açude': 'blue', 'Reúso': 'green' };

// lâmina aplicada em mm: 1 mm = 1 L/m²; 1 ha = 10.000 m²
const lamina = (r) => (r.area_ha > 0 ? Number(r.volume_litros) / (Number(r.area_ha) * 10000) : null);

function Irrigacao() {
  const registros = useCrud(irrigacaoAPI);
  const produtores = useCrud(produtorAPI);
  const safras = useCrud(safrasAPI);

  const nomeProdutor = (id) =>
    produtores.itens.find((p) => Number(p.id_produtor) === Number(id))?.nome || `Produtor ${id}`;
  const rotuloSafra = (s) => `${s.cultura} — ${nomeProdutor(s.id_produtor)}`;
  const safra = (id) => safras.itens.find((s) => Number(s.id_safra) === Number(id));

  function topo(itens) {
    const mes = hoje().slice(0, 7);
    const doMes = itens.filter((r) => String(r.data).startsWith(mes));
    const volMes = doMes.reduce((t, r) => t + Number(r.volume_litros || 0), 0);
    const volTotal = itens.reduce((t, r) => t + Number(r.volume_litros || 0), 0);
    const comArea = itens.filter((r) => r.area_ha > 0);
    const litrosPorHa = comArea.length
      ? comArea.reduce((t, r) => t + Number(r.volume_litros), 0) / comArea.reduce((t, r) => t + Number(r.area_ha), 0)
      : null;

    const porFonte = {};
    itens.forEach((r) => { porFonte[r.fonte_agua] = (porFonte[r.fonte_agua] || 0) + Number(r.volume_litros || 0); });
    const ordenadas = Object.entries(porFonte).sort((a, b) => b[1] - a[1]);
    const maior = ordenadas[0]?.[1] || 1;

    return (
      <>
        <ResumoCards
          itens={[
            { rotulo: 'Consumo no mês', valor: `${fmtNum(volMes / 1000, 1)} m³`, detalhe: `${doMes.length} registro(s)` },
            { rotulo: 'Consumo total', valor: `${fmtNum(volTotal / 1000, 1)} m³` },
            { rotulo: 'Média por hectare', valor: litrosPorHa ? `${fmtNum(litrosPorHa, 0)} L/ha` : '-', detalhe: 'registros com área' },
            { rotulo: 'Principal fonte', valor: ordenadas[0]?.[0] || '-' }
          ]}
        />
        {ordenadas.length > 0 && (
          <div className="agro-barras" aria-label="Consumo por fonte de água">
            {ordenadas.map(([fonte, vol]) => (
              <div className="agro-barra" key={fonte}>
                <span>{fonte}</span>
                <div className="trilho"><div className="preench" style={{ width: `${(vol / maior) * 100}%` }} /></div>
                <span>{fmtNum(vol / 1000, 1)} m³</span>
              </div>
            ))}
          </div>
        )}
      </>
    );
  }

  return (
    <CrudSecao
      titulo="Água e Irrigação"
      descricao="Registre quanto de água foi usada, de onde veio e em qual área"
      labelNovo="Novo Registro"
      crud={registros}
      idKey="id_irrigacao"
      inicial={() => ({
        id_produtor: '', id_safra: '', data: hoje(), fonte_agua: '', sistema: '',
        volume_litros: '', duracao_min: '', area_ha: '', observacoes: ''
      })}
      topo={topo}
      filtro={(r, t) => nomeProdutor(r.id_produtor).toLowerCase().includes(t) || (r.fonte_agua || '').toLowerCase().includes(t)}
      placeholderBusca="Buscar por produtor ou fonte..."
      validar={(f) => (Number(f.volume_litros) <= 0 ? 'Informe o volume de água em litros.' : null)}
      campos={(f) => [
        {
          name: 'id_produtor', label: 'Produtor', required: true, numerico: true, full: true,
          opcoes: produtores.itens.map((p) => ({ value: p.id_produtor, label: `${p.nome} - ID ${p.id_produtor}` }))
        },
        {
          name: 'id_safra', label: 'Safra (opcional)', numerico: true, full: true,
          opcoes: safras.itens
            .filter((s) => !f.id_produtor || Number(s.id_produtor) === Number(f.id_produtor))
            .map((s) => ({ value: s.id_safra, label: rotuloSafra(s) })),
          hint: 'Liga o consumo de água à safra.'
        },
        { name: 'data', label: 'Data', tipo: 'date', required: true },
        { name: 'fonte_agua', label: 'Fonte de água', opcoes: FONTES, required: true },
        { name: 'sistema', label: 'Sistema de irrigação', opcoes: SISTEMAS, required: true },
        { name: 'volume_litros', label: 'Volume (litros)', tipo: 'number', step: '1', min: '0', required: true },
        { name: 'duracao_min', label: 'Duração (min)', tipo: 'number', step: '1', min: '0' },
        { name: 'area_ha', label: 'Área irrigada (ha)', tipo: 'number', step: '0.01', min: '0' },
        { name: 'observacoes', label: 'Observações', tipo: 'textarea', full: true }
      ]}
      rodapeForm={(f) => {
        const l = lamina(f);
        return l ? (
          <div className="agro-preview">
            <span>Lâmina aplicada: <strong>{fmtNum(l, 1)} mm</strong></span>
            <span>Equivale a <strong>{fmtNum(Number(f.volume_litros) / Number(f.area_ha), 0)} L/ha</strong></span>
          </div>
        ) : null;
      }}
      colunas={[
        { titulo: 'Data', render: (r) => fmtData(r.data) },
        { titulo: 'Produtor', render: (r) => <strong>{nomeProdutor(r.id_produtor)}</strong> },
        { titulo: 'Safra', render: (r) => (r.id_safra && safra(r.id_safra) ? safra(r.id_safra).cultura : '-') },
        { titulo: 'Fonte', render: (r) => <Badge cor={COR_FONTE[r.fonte_agua] || 'gray'}>{r.fonte_agua}</Badge> },
        { titulo: 'Sistema', render: (r) => r.sistema },
        { titulo: 'Volume', render: (r) => `${fmtNum(r.volume_litros, 0)} L` },
        { titulo: 'Área', render: (r) => (r.area_ha ? `${fmtNum(r.area_ha)} ha` : '-') },
        { titulo: 'Lâmina', render: (r) => (lamina(r) ? `${fmtNum(lamina(r), 1)} mm` : '-') }
      ]}
    />
  );
}

export default Irrigacao;
