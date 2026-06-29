import React from 'react';
import {
  formatearFecha,
  formatearHora,
  colorPrioridad,
  etiquetaPrioridad,
  extraerCodigoActivo,
  extraerNombreActivo,
  esAtrasada,
  formatearTaller
} from '../utils/formato';

const estilos = {
  card: {
    background: '#ffffff',
    border: '1px solid #e2e8f0',
    borderRadius: '12px',
    padding: '14px 16px',
    marginBottom: '10px',
    cursor: 'pointer',
    transition: 'box-shadow 0.15s ease, border-color 0.15s ease',
    position: 'relative'
  },
  cardHover: {
    boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
    borderColor: '#4299e1'
  },
  headerActivo: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    marginBottom: '4px'
  },
  labelActivo: {
    fontSize: '12px',
    color: '#718096',
    fontWeight: '500'
  },
  codigoActivo: {
    fontSize: '13px',
    color: '#2563eb',
    fontWeight: '600'
  },
  nombreActivo: {
    fontSize: '13px',
    color: '#1a202c',
    fontWeight: '500',
    marginBottom: '8px',
    lineHeight: '1.4'
  },
  tarea: {
    fontSize: '13px',
    color: '#2d3748',
    marginBottom: '10px',
    lineHeight: '1.4'
  },
  badges: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '5px',
    marginBottom: '10px'
  },
  badge: {
    fontSize: '10px',
    fontWeight: '700',
    padding: '2px 8px',
    borderRadius: '4px',
    letterSpacing: '0.3px',
    border: '1px solid'
  },
  footer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: '6px'
  },
  metaDato: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    fontSize: '12px',
    color: '#718096'
  },
  taller: {
    fontSize: '11px',
    color: '#718096',
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    marginTop: '6px'
  },
  atrasada: {
    position: 'absolute',
    top: '12px',
    right: '12px',
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    background: '#e53e3e'
  },
  plan: {
    fontSize: '11px',
    color: '#3182ce',
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    marginTop: '6px'
  }
};

function getBadgeStyle(tipo) {
  const t = (tipo || '').toUpperCase();
  if (t.includes('CORRECTIVO') || t.includes('CORRECTIV')) {
    return { color: '#c05621', background: '#feebc8', borderColor: '#fbd38d' };
  }
  if (t.includes('PREVENTIVO') || t.includes('PREVENTIV')) {
    return { color: '#276749', background: '#c6f6d5', borderColor: '#9ae6b4' };
  }
  if (t.includes('NO PLANIFICAD') || t.includes('UNPLANNED')) {
    return { color: '#744210', background: '#fefcbf', borderColor: '#f6e05e' };
  }
  if (t.includes('PLANIFICAD') || t.includes('PLANNED')) {
    return { color: '#2c5282', background: '#bee3f8', borderColor: '#90cdf4' };
  }
  return { color: '#4a5568', background: '#edf2f7', borderColor: '#e2e8f0' };
}

function getPrioridadStyle(prioridad) {
  const color = colorPrioridad(prioridad);
  return {
    color,
    background: color + '18',
    borderColor: color + '60'
  };
}

export default function TareaCard({ tarea, onClick }) {
  const [hover, setHover] = React.useState(false);
  const codigo = extraerCodigoActivo(tarea.activo_nombre);
  const nombre = extraerNombreActivo(tarea.activo_nombre);
  const atrasada = esAtrasada(tarea.fecha_mantenimiento, tarea.delay);
  const taller = formatearTaller(tarea.taller);

  return (
    <div
      style={{
        ...estilos.card,
        ...(hover ? estilos.cardHover : {})
      }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onClick={() => onClick && onClick(tarea)}
    >
      {atrasada && <div style={estilos.atrasada} title="Tarea atrasada" />}

      <div style={estilos.headerActivo}>
        <span style={estilos.labelActivo}>Activo:</span>
        {codigo && <span style={estilos.codigoActivo}>{codigo}</span>}
      </div>

      {nombre && (
        <div style={estilos.nombreActivo}>{nombre}</div>
      )}

      <div style={estilos.tarea}>
        <span style={{ color: '#718096', fontSize: '12px', fontWeight: '500' }}>Tarea: </span>
        {tarea.tarea}
      </div>

      <div style={estilos.badges}>
        {tarea.tipo && (
          <span style={{ ...estilos.badge, ...getBadgeStyle(tarea.tipo) }}>
            {tarea.tipo.toUpperCase()}
          </span>
        )}
        {tarea.tipo_2 && tarea.tipo_2 !== tarea.tipo && (
          <span style={{ ...estilos.badge, ...getBadgeStyle(tarea.tipo_2) }}>
            {tarea.tipo_2.toUpperCase()}
          </span>
        )}
        <span style={{ ...estilos.badge, ...getBadgeStyle(tarea.es_planificada ? 'PLANIFICADA' : 'NO PLANIFICADA') }}>
          {tarea.es_planificada ? 'PLANIFICADA' : 'NO PLANIFICADA'}
        </span>
        <span style={{ ...estilos.badge, ...getPrioridadStyle(tarea.prioridad) }}>
          {etiquetaPrioridad(tarea.prioridad)}
        </span>
      </div>

      <div style={estilos.footer}>
        <div style={estilos.metaDato}>
          <span>📅</span>
          <span>{formatearFecha(tarea.fecha_mantenimiento)}</span>
        </div>
        <div style={estilos.metaDato}>
          <span>⏱</span>
          <span>{formatearHora(tarea.duracion)}</span>
        </div>
        {tarea.delay > 0 && (
          <div style={{ ...estilos.metaDato, color: '#e53e3e' }}>
            <span>⚠</span>
            <span>{tarea.delay} día{tarea.delay !== 1 ? 's' : ''} de atraso</span>
          </div>
        )}
      </div>

      {taller && (
        <div style={estilos.taller}>
          <span>📍</span>
          <span>{taller}</span>
        </div>
      )}

      {tarea.plan && (
        <div style={estilos.plan}>
          <span>🔄</span>
          <span style={{ fontSize: '11px' }}>
            {tarea.trigger?.replace('DATE$EVERY$', 'CADA ').replace('$', ' ').replace('MONTHS', 'MES(ES)').replace('WEEKS', 'SEMANA(S)').replace('DAYS', 'DÍA(S)').replace('YEARS', 'AÑO(S)') || tarea.plan}
          </span>
        </div>
      )}
    </div>
  );
}
