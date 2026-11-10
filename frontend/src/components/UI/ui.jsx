import React from 'react';
import { X } from 'lucide-react';

// ---------- formatação ----------
export const hoje = () => new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD (local)

export function fmtData(s) {
  if (!s) return '-';
  const [a, m, d] = String(s).slice(0, 10).split('-');
  return `${d}/${m}/${a}`;
}

export function fmtDataHora(s) {
  if (!s) return '-';
  return new Date(s).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
}

export function fmtNum(n, casas = 2) {
  if (n === null || n === undefined || n === '' || Number.isNaN(Number(n))) return '-';
  return Number(n).toLocaleString('pt-BR', { maximumFractionDigits: casas });
}

export function diasAte(data) {
  if (!data) return null;
  const alvo = new Date(String(data).slice(0, 10) + 'T00:00:00');
  const base = new Date(hoje() + 'T00:00:00');
  return Math.round((alvo - base) / 86400000);
}

// ---------- componentes ----------
export function Badge({ cor = 'gray', children }) {
  return <span className={`badge badge-${cor}`}>{children}</span>;
}

export function Estado({ loading, erro, texto = 'Carregando...' }) {
  if (loading) return <p style={{ padding: '1rem' }}>{texto}</p>;
  if (erro) {
    return (
      <div className="agro-erro">
        <strong>Atenção:</strong> {erro}
      </div>
    );
  }
  return null;
}

export function BotaoIcone({ title, cor, onClick, children, disabled }) {
  return (
    <button
      type="button"
      className="agro-icon-btn"
      style={cor ? { color: cor } : undefined}
      title={title}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
}

export function Abas({ abas, ativa, onChange }) {
  return (
    <div className="agro-abas" role="tablist">
      {abas.map((a) => (
        <button
          key={a.id}
          type="button"
          role="tab"
          aria-selected={ativa === a.id}
          className={ativa === a.id ? 'ativa' : ''}
          onClick={() => onChange(a.id)}
        >
          {a.label}
        </button>
      ))}
    </div>
  );
}

// itens: [{ rotulo, valor, detalhe, tom: 'ok' | 'alerta' | 'perigo' }]
export function ResumoCards({ itens }) {
  return (
    <div className="agro-resumo">
      {itens.map((i) => (
        <div key={i.rotulo} className={`agro-resumo-item ${i.tom || ''}`}>
          <span className="rotulo">{i.rotulo}</span>
          <strong>{i.valor}</strong>
          {i.detalhe && <small>{i.detalhe}</small>}
        </div>
      ))}
    </div>
  );
}

export function Modal({ titulo, subtitulo, onClose, children, largura = 600 }) {
  return (
    <div
      className="agro-overlay"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="agro-modal" style={{ maxWidth: largura }} role="dialog" aria-modal="true">
        <div className="agro-modal-head">
          <div>
            <h2>{titulo}</h2>
            {subtitulo && <p>{subtitulo}</p>}
          </div>
          <button type="button" className="agro-icon-btn" onClick={onClose} aria-label="Fechar">
            <X size={24} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

// opcoes: ['A','B'] ou [{ value, label }]
export function Campo({ label, tipo = 'text', opcoes, full, hint, sugestoes, ...props }) {
  let controle;
  if (opcoes) {
    controle = (
      <select className="agro-input" {...props}>
        <option value="">Selecione...</option>
        {opcoes.map((o) =>
          typeof o === 'object' ? (
            <option key={o.value} value={o.value}>{o.label}</option>
          ) : (
            <option key={o} value={o}>{o}</option>
          )
        )}
      </select>
    );
  } else if (tipo === 'textarea') {
    controle = <textarea className="agro-input" rows={3} {...props} />;
  } else {
    controle = (
      <input
        className="agro-input"
        type={tipo}
        list={sugestoes ? `lista-${props.name}` : undefined}
        {...props}
      />
    );
  }

  return (
    <div className={`agro-campo ${full ? 'full' : ''}`}>
      <label>
        {label}
        {props.required && <span className="req"> *</span>}
      </label>
      {controle}
      {sugestoes && (
        <datalist id={`lista-${props.name}`}>
          {sugestoes.map((s) => <option key={s} value={s} />)}
        </datalist>
      )}
      {hint && <small>{hint}</small>}
    </div>
  );
}
