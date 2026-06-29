import React from 'react';

const estilos = {
  panel: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#f7f9fc',
    color: '#a0aec0'
  },
  icono: {
    fontSize: '52px',
    marginBottom: '16px',
    opacity: 0.4
  },
  titulo: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#4a5568',
    marginBottom: '8px'
  },
  subtitulo: {
    fontSize: '14px',
    color: '#718096',
    textAlign: 'center',
    maxWidth: '320px',
    lineHeight: '1.5'
  },
  detalle: {
    marginTop: '32px',
    background: '#ffffff',
    border: '1px solid #e2e8f0',
    borderRadius: '12px',
    padding: '20px 28px',
    maxWidth: '480px',
    width: '100%'
  },
  detalleTitle: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#2d3748',
    marginBottom: '12px'
  },
  campo: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '8px 0',
    borderBottom: '1px solid #f7f9fc',
    fontSize: '13px'
  },
  label: {
    color: '#718096'
  },
  valor: {
    color: '#2d3748',
    fontWeight: '500',
    textAlign: 'right',
    maxWidth: '240px'
  }
};

function formatearFechaLarga(fechaISO) {
  if (!fechaISO) return '-';
  const fecha = new Date(fechaISO);
  return fecha.toLocaleDateString('es-MX', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });
}

export default function PanelCentral({ tareaSeleccionada }) {
  if (!tareaSeleccionada) {
    return (
      <div style={estilos.panel}>
        <div style={estilos.icono}>🔧</div>
        <div style={estilos.titulo}>Selecciona una tarea pendiente</div>
        <div style={estilos.subtitulo}>
          Elige una tarea de la columna izquierda para ver sus detalles y gestionar la asignación.
        </div>
      </div>
    );
  }

  const t = tareaSeleccionada;

  return (
    <div style={{ ...estilos.panel, justifyContent: 'flex-start', padding: '24px', overflowY: 'auto' }}>
      <div style={{ width: '100%', maxWidth: '560px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#1a202c', marginBottom: '4px' }}>
          {t.tarea}
        </h2>
        <div style={{ fontSize: '13px', color: '#718096', marginBottom: '20px' }}>
          {t.activo_nombre}
        </div>

        <div style={estilos.detalle}>
          <div style={estilos.detalleTitle}>Información de la tarea</div>

          {[
            ['Activo', t.activo_nombre],
            ['Código', t.activo_codigo || '-'],
            ['Tipo', t.tipo || '-'],
            ['Clasificación', t.tipo_2 || '-'],
            ['Prioridad', t.prioridad || '-'],
            ['Fecha programada', formatearFechaLarga(t.fecha_mantenimiento)],
            ['Taller', t.taller?.split('/').filter(Boolean).pop()?.trim() || '-'],
            ['Solicitado por', t.solicitado_por || '-'],
            ['Plan de mantenimiento', t.plan || '-'],
            ['Atraso', t.delay > 0 ? `${t.delay} días` : 'Sin atraso'],
          ].map(([label, valor]) => (
            <div key={label} style={estilos.campo}>
              <span style={estilos.label}>{label}</span>
              <span style={estilos.valor}>{valor}</span>
            </div>
          ))}
        </div>

        <div style={{
          marginTop: '16px',
          padding: '12px 16px',
          background: '#ebf8ff',
          border: '1px solid #90cdf4',
          borderRadius: '8px',
          fontSize: '13px',
          color: '#2c5282'
        }}>
          💡 Próximamente: asignación de técnicos y creación de órdenes de trabajo desde aquí.
        </div>
      </div>
    </div>
  );
}
