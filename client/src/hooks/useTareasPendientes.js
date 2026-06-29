import { useState, useCallback } from 'react';
import axios from 'axios';

export function useTareasPendientes() {
  const [tareas, setTareas] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [progreso, setProgreso] = useState(0);
  const [error, setError] = useState(null);
  const [ultimaActualizacion, setUltimaActualizacion] = useState(null);

  const cargar = useCallback(async () => {
    setLoading(true);
    setError(null);
    setTareas([]);
    setProgreso(0);

    try {
      const LIMIT = 500;
      let acumuladas = [];
      let offset = 0;
      let totalAPI = 99999;
      let pagina = 0;

      // Cargar una página a la vez, secuencial
      while (offset < totalAPI) {
        const ts = Date.now() + offset; // evitar caché
        const r = await axios.get('/api/tareas-pagina', {
          params: { offset, limit: LIMIT, ts },
          headers: { 'Cache-Control': 'no-cache' },
          timeout: 30000
        });

        if (!r.data.success) break;

        totalAPI = r.data.total || 0;
        acumuladas = acumuladas.concat(r.data.data || []);
        offset += LIMIT;
        pagina++;

        // Actualizar progreso en tiempo real
        const pct = Math.round((offset / totalAPI) * 100);
        setProgreso(Math.min(pct, 99));

        // Mostrar tareas parciales mientras carga
        if (pagina % 2 === 0) {
          const parciales = [...acumuladas].sort((a, b) => b.id - a.id);
          setTareas(parciales);
          setTotal(parciales.length);
        }

        if (r.data.data.length < LIMIT) break;
      }

      // Orden final por id DESC igual que Fracttal
      acumuladas.sort((a, b) => b.id - a.id);
      setTareas(acumuladas);
      setTotal(acumuladas.length);
      setProgreso(100);
      setUltimaActualizacion(new Date());

    } catch (err) {
      console.error('Error:', err.message);
      setError('Error de conexión con Fracttal');
    } finally {
      setLoading(false);
    }
  }, []);

  return { tareas, total, loading, progreso, error, ultimaActualizacion, cargar };
}
