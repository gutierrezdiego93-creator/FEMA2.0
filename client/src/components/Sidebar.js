import React, { useState } from 'react';
import TareaCard from './TareaCard';

const estilos = {
  sidebar: {
    width: '340px',
    minWidth: '340px',
    height: '100vh',
    background: '#f7f9fc',
    borderRight: '1px solid #e2e8f0',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden'
  },
  header: {
    padding: '16px',
    borderBottom: '1px solid #e2e8f0',
    background: '#ffffff'
  },
  tituloFila: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '10px'
  },
  titulo: {
    fontSize: '13px',
    fontWeight: '700',
    color: '#4a5568',
    letterSpacing: '0.5px',
    textTransform: 'uppercase'
  },
  contadorBadge: {
    background: '#4299e1',
    color: '#ffffff',
    fontSize: '12px',
    fontWeight: '700',
    padding: '2px 10px',
    borderRadius: '20px',
    minWidth: '32px',
    textAlign: 'center'
  },
  botonActualizar: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '4px',
    borderRadius: '6px',
    color: '#4299e1',
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    fontSize: '12px',
    transition: 'background 0.15s'
  },
  busqueda: {
    width: '100%',
    padding: '8px 12px',
    border: '1px solid #e2e8f0',
    borderRadius: '8px',
    fontSize: '13px',
    outline: 'none',
    background: '#f7f9fc',
    color: '#2d3748',
    boxSizing: 'border-box'
  },
  lista: {
    flex: 1,
    overflowY: 'auto',
    padding: '12px'
  },
  loading: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '48px 16px',
    color: '#718096',
    gap: '12px'
  },
  spinner: {
    width: '32px',
    height: '32px',
    border: '3px solid #e2e8f0',
    borderTop: '3px solid #4299e1',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite'
  },
  error: {
    margin: '16px',
    padding: '12px',
    background: '#fff5f5',
    border: '1px solid #fc8181',
    borderRadius: '8px',
    color: '#c53030',
    fontSize: '13px',
    textAlign: 'center'
  },
  vacio: {
    padding: '48px 16px',
    textAlign: 'center',
    color: '#718096',
    fontSize: '14px'
  },
  actualizacion: {
    fontSize: '11px',
    color: '#a0aec0',
    textAlign: 'center',
    padding: '8px'
  },
  filtroFila: {
    display: 'flex',
    gap: '6px',
    marginTop: '8px',
    flexWrap: 'wrap'
  },
  chipFiltro: {
    fontSize: '11px',
    padding: '3px 10px',
    borderRadius: '12px',
    border: '1px solid #e2e8f0',
    cursor: 'pointer',
    background: '#fff',
    color: '#4a5568',
    transition: 'all 0.15s'
  },
  chipFiltroActivo: {
    background: '#4299e1',
    color: '#fff',
    borderColor: '#4299e1'
  }
};

const FILTROS = ['Todos', 'Atrasadas', 'Planificadas', 'No planificadas'];

export default function Sidebar({ tareas, total, loading, error, ultimaActualizacion, onActualizar, onSeleccionarTarea, tareaSeleccionada }) {
  const [busqueda, setBusqueda] = useState('');
  const [filtroActivo, setFiltroActivo] = useState('Todos');
  const [rotando, setRotando] = useState(false);

  const handleActualizar = async () => {
    setRotando(true);
    await onActualizar();
    setTimeout(() => setRotando(false), 800);
  };

  const tareasFiltradas = tareas.filter(t => {
    const texto = busqueda.toLowerCase();
    const coincide = !texto ||
      t.activo_nombre?.toLowerCase().includes(texto) ||
      t.tarea?.toLowerCase().includes(texto) ||
      t.taller?.toLowerCase().includes(texto);

    if (!coincide) return false;

    if (filtroActivo === 'Atrasadas') return t.delay > 0 || new Date(t.fecha_mantenimiento) < new Date();
    if (filtroActivo === 'Planificadas') return t.es_planificada;
    if (filtroActivo === 'No planificadas') return !t.es_planificada;
    return true;
  });

  return (
    <aside style={estilos.sidebar}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .boton-act:hover { background: #ebf8ff !important; }
        .chip-filtro:hover { border-color: #4299e1 !important; color: #4299e1 !important; }
        .lista-scroll::-webkit-scrollbar { width: 4px; }
        .lista-scroll::-webkit-scrollbar-track { background: transparent; }
        .lista-scroll::-webkit-scrollbar-thumb { background: #cbd5e0; border-radius: 2px; }
      `}</style>

      <div style={estilos.header}>
        <div style={estilos.tituloFila}>
          <span style={estilos.titulo}>Tareas pendientes</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={estilos.contadorBadge}>{loading ? '...' : total}</span>
            <button
              className="boton-act"
              style={estilos.botonActualizar}
              onClick={handleActualizar}
              disabled={loading}
              title="Actualizar tareas"
            >
              <span style={{
                display: 'inline-block',
                fontSize: '16px',
                transform: rotando ? 'rotate(360deg)' : 'none',
                transition: 'transform 0.8s ease'
              }}>↺</span>
            </button>
          </div>
        </div>

        <input
          type="text"
          placeholder="Buscar activo o tarea..."
          value={busqueda}
          onChange={e => setBusqueda(e.target.value)}
          style={estilos.busqueda}
        />

        <div style={estilos.filtroFila}>
          {FILTROS.map(f => (
            <button
              key={f}
              className="chip-filtro"
              style={{
                ...estilos.chipFiltro,
                ...(filtroActivo === f ? estilos.chipFiltroActivo : {})
              }}
              onClick={() => setFiltroActivo(f)}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="lista-scroll" style={estilos.lista}>
        {loading && (
          <div style={estilos.loading}>
            <div style={estilos.spinner} />
            <span style={{ fontSize: '13px' }}>Cargando tareas FEMA...</span>
          </div>
        )}

        {!loading && error && (
          <div style={estilos.error}>
            ⚠ {error}
            <br />
            <button
              onClick={onActualizar}
              style={{ marginTop: '8px', color: '#4299e1', background: 'none', border: 'none', cursor: 'pointer', fontSize: '13px' }}
            >
              Reintentar
            </button>
          </div>
        )}

        {!loading && !error && tareasFiltradas.length === 0 && (
          <div style={estilos.vacio}>
            {busqueda ? 'Sin resultados para la búsqueda' : 'No hay tareas pendientes en FEMA'}
          </div>
        )}

        {!loading && !error && tareasFiltradas.map(tarea => (
          <TareaCard
            key={tarea.id}
            tarea={tarea}
            onClick={onSeleccionarTarea}
            seleccionada={tareaSeleccionada?.id === tarea.id}
          />
        ))}
      </div>

      {ultimaActualizacion && (
        <div style={estilos.actualizacion}>
          Actualizado: {ultimaActualizacion.toLocaleTimeString('es-MX')}
        </div>
      )}
    </aside>
  );
}
