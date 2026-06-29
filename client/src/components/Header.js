import React from 'react';

const estilos = {
  header: {
    height: '52px',
    background: '#ffffff',
    borderBottom: '1px solid #e2e8f0',
    display: 'flex',
    alignItems: 'center',
    padding: '0 20px',
    gap: '14px',
    position: 'sticky',
    top: 0,
    zIndex: 100
  },
  logo: {
    background: '#2563eb',
    color: '#ffffff',
    fontWeight: '800',
    fontSize: '13px',
    padding: '5px 10px',
    borderRadius: '6px',
    letterSpacing: '0.5px'
  },
  titulo: {
    fontSize: '15px',
    fontWeight: '600',
    color: '#1a202c'
  },
  subtitulo: {
    fontSize: '12px',
    color: '#718096'
  },
  separador: {
    color: '#e2e8f0',
    fontSize: '18px'
  },
  spacer: { flex: 1 },
  instancia: {
    fontSize: '12px',
    color: '#a0aec0',
    background: '#f7f9fc',
    padding: '4px 10px',
    borderRadius: '6px',
    border: '1px solid #e2e8f0'
  }
};

export default function Header() {
  return (
    <header style={estilos.header}>
      <div style={estilos.logo}>FEMA</div>
      <div>
        <div style={estilos.titulo}>Planificador de OTs</div>
      </div>
      <span style={estilos.separador}>·</span>
      <span style={estilos.subtitulo}>Fracttal One · Instancia 371</span>
      <div style={estilos.spacer} />
      <div style={estilos.instancia}>Transportes de Carga FEMA S.A. de C.V.</div>
    </header>
  );
}
