import { useState, useCallback } from 'react';
import axios from 'axios';

export function useTareasPendientes() {
  const [tareas, setTareas] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [progreso, setProgreso] = useState(0); // 0-100
  const [error, setError] = useState(null);
  const [ultimaActualizacion, setUltimaActualizacion] = useState(null);

  const cargar = useCallback(async () => {
    setLoading(true);
    setError(null);
    setTareas([]);
    setProgreso(0);

    try {
      const LIMIT = 500;

      // Primera página para saber el total
      const primera = await axios.get('/api/tareas-pagina', {
        params: { offset: 0, limit: LIMIT }
      });

      const totalAPI = primera.data.total || 0;
      setTotal(totalAPI);
      setProgreso(10);

      // Calcular todos los offsets necesarios
      const offsets = [];
      for (let offset = LIMIT; offset < totalAPI; offset += LIMIT) {
        offsets.push(offset);
      }

      // Descargar todas las páginas en paralelo
      let todasLasTareas = [...primera.data.data];

      if (offsets.length > 0) {
        const resultados = await Promise.all(
          offsets.map(offset =>
            axios.get('/api/tareas-pagina', { params: { offset, limit: LIMIT } })
              .then(r => r.data.data || [])
              .catch(() => [])
          )
        );
        resultados.forEach(lote => {
          todasLasTareas = todasLasTareas.concat(lote);
        });
      }

      setProgreso(90);

      // Ordenar por id DESC igual que Fracttal
      todasLasTareas.sort((a, b) => b.id - a.id);

      setTareas(todasLasTareas);
      setTotal(todasLasTareas.length);
      setProgreso(100);
      setUltimaActualizacion(new Date());

    } catch (err) {
      setError('Error de conexión con Fracttal');
    } finally {
      setLoading(false);
    }
  }, []);

  return { tareas, total, loading, progreso, error, ultimaActualizacion, cargar };
}
