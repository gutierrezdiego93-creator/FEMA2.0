import React, { useState, useEffect, useRef } from 'react';
import TareaCard from './TareaCard';

const s = {
  sidebar: { width: '340px', minWidth: '340px', height: '100vh', background: '#f7f9fc', borderRight: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', overflow: 'hidden' },
  header: { padding: '16px', borderBottom: '1px solid #e2e8f0', background: '#ffffff' },
  fila: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' },
  titulo: { fontSize: '13px', fontWeight: '700', color: '#4a5568', letterSpacing: '0.5px', textTransform: 'uppercase' },
  badge: { background: '#4299e1', color: '#fff', fontSize: '12px', fontWeight: '700', padding: '2px 10px', borderRadius: '20px', minWidth: '40px', textAlign: 'center' },
  btnRefresh: { background: 'none', border: 'none', cursor: 'pointer', fontSize: '20px', color: '#4299e1', padding: '4px 6px', borderRadius: '6px' },
  input: { width: '100%', padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '13px', outline: 'none', background: '#f7f9fc', color: '#2d3748', boxSizing: 'border-box' },
  filtros: { display: 'flex', gap: '6px', marginTop: '8px', flexWrap: 'wrap' },
  chip: { fontSize: '11px', padding: '3px 10px', borderRadius: '12px', border: '1px solid #e2e8f0', cursor: 'pointer', background: '#fff', color: '#4a5568' },
  chipActivo: { background: '#4299e1', color: '#fff', borderColor: '#4299e1' },
  lista: { flex: 1, overflowY: 'auto', padding: '12px' },
  loading: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '48px 16px', gap: '12px' },
  spinner: { width: '28px', height: '28px', border: '3px solid #e2e8f0', borderTop: '3px solid #4299e1', borderRadius: '50%', animation: 'spin 0.8s linear infinite' },
  error: { margin: '16px', padding: '12px', background: '#fff5f5', border: '1px solid #fc8181', borderRadius: '8px', color: '#c53030', fontSize: '13px', textAlign: 'center' },
  vacio: { padding: '48px 16px', textAlign: 'center', color: '#718096', fontSize: '14px' },
  footer: { fontSize: '11px', color: '#a0aec0', textAlign: 'center', padding: '8px', borderTop: '1px solid #e2e8f0' },
  rango: { fontSize: '10px', color: '#a0aec0', textAlign: 'center', padding: '4px 16px', background: '#f7f9fc' }
};

const FILTROS = ['Todos', 'Atrasadas', 'Planificadas', 'No planificadas'];
const VISIBLE_STEP = 100;

export default function Sidebar({ tareas, total, loading, error, ultimaActualizacion, onActualizar, onSeleccionarTarea, tareaSeleccionada }) {
  const [busqueda, setBusqueda] = useState('');
  const [filtro, setFiltro] = useState('Todos');
  const [rotando, setRotando] = useState(false);
  const [visibles, setVisibles] = useState(VISIBLE_STEP);
  const listaRef = useRef(null);

  const filtradas = tareas.filter(t => {
    const txt = busqueda.toLowerCase();
    const ok = !txt ||
      (t.activo_nombre || '').toLowerCase().includes(txt) ||
      (t.tarea || '').toLowerCase().includes(txt) ||
      (t.activo_codigo || '').toLowerCase().includes(txt) ||
      (t.taller || '').toLowerCase().includes(txt);
    if (!ok) return false;
    if (filtro === 'Atrasadas') return t.delay > 0;
    if (filtro === 'Planificadas') return t.es_planificada;
    if (filtro === 'No planificadas') return !t.es_planificada;
    return true;
  });

  useEffect(() => { setVisibles(VISIBLE_STEP); }, [busqueda, filtro]);

  useEffect(() => {
    const lista = listaRef.current;
    if (!lista) return;
    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = lista;
      if (scrollTop + clientHeight >= scrollHeight - 300) {
        setVisibles(prev => Math.min(prev + VISIBLE_STEP, filtradas.length));
      }
    };
    lista.addEventListener('scroll', handleScroll);
    return () => lista.removeEventListener('scroll', handleScroll);
  }, [filtradas.length]);

  const handleRefresh = async () => {
    setRotando(true);
    await onActualizar();
    setTimeout(() => setRotando(false), 800);
  };

  const mostradas = filtradas.slice(0, visibles);

  // Calcular rango de fechas actual
  const hoy = new Date();
  const desde = new Date(hoy); desde.setMonth(desde.getMonth() - 3);
  const hasta = new Date(hoy); hasta.setDate(hasta.getDate() + 90);
  const fmtFecha = d => d.toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' });

  return (
    <aside style={s.sidebar}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}} .lista::-webkit-scrollbar{width:4px} .lista::-webkit-scrollbar-thumb{background:#cbd5e0;border-radius:2px}`}</style>

      <div style={s.header}>
        <div style={s.fila}>
          <span style={s.titulo}>Tareas pendientes</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={s.badge}>{loading ? '...' : total}</span>
            <button style={s.btnRefresh} onClick={handleRefresh} disabled={loading} title="Actualizar">
              <span style={{ display: 'inline-block', transform: rotando ? 'rotate(360deg)' : 'none', transition: 'transform 0.8s' }}>↺</span>
            </button>
          </div>
        </div>
        <input type="text" placeholder="Buscar activo o tarea..." value={busqueda} onChange={e => setBusqueda(e.target.value)} style={s.input} />
        <div style={s.filtros}>
          {FILTROS.map(f => (
            <button key={f} style={{ ...s.chip, ...(filtro === f ? s.chipActivo : {}) }} onClick={() => setFiltro(f)}>{f}</button>
          ))}
        </div>
      </div>

      <div style={s.rango}>
        📅 {fmtFecha(desde)} — {fmtFecha(hasta)}
      </div>

      <div ref={listaRef} className="lista" style={s.lista}>
        {loading && (
          <div style={s.loading}>
            <div style={s.spinner} />
            <span style={{ fontSize: '13px', color: '#718096' }}>Cargando tareas...</span>
          </div>
        )}
        {!loading && error && (
          <div style={s.error}>
            ⚠ {error}
            <br />
            <button onClick={onActualizar} style={{ marginTop: '8px', color: '#4299e1', background: 'none', border: 'none', cursor: 'pointer', fontSize: '13px' }}>Reintentar</button>
          </div>
        )}
        {!loading && !error && filtradas.length === 0 && (
          <div style={s.vacio}>{busqueda ? 'Sin resultados' : 'No hay tareas en este rango de fechas'}</div>
        )}
        {!loading && !error && mostradas.map(t => (
          <TareaCard key={t.id} tarea={t} onClick={onSeleccionarTarea} seleccionada={tareaSeleccionada?.id === t.id} />
        ))}
        {!loading && visibles < filtradas.length && (
          <div style={{ textAlign: 'center', padding: '8px', fontSize: '11px', color: '#a0aec0' }}>
            {visibles} de {filtradas.length} — baja para ver más
          </div>
        )}
      </div>

      {ultimaActualizacion && (
        <div style={s.footer}>
          {total} tareas · {ultimaActualizacion.toLocaleTimeString('es-MX')}
        </div>
      )}
    </aside>
  );
}
