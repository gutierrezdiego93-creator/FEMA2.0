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

      // Primera página para saber el total
      const primera = await axios.get('/api/tareas-pagina', {
        params: { offset: 0, limit: LIMIT }
      });

      const totalAPI = primera.data.total || 0;
      let acumuladas = [...primera.data.data];
      setProgreso(Math.round((acumuladas.length / totalAPI) * 100));

      // Calcular offsets restantes
      const offsets = [];
      for (let offset = LIMIT; offset < totalAPI; offset += LIMIT) {
        offsets.push(offset);
      }

      // Descargar en grupos de 3 para respetar límite del navegador
      const GRUPO = 3;
      for (let i = 0; i < offsets.length; i += GRUPO) {
        const lote = offsets.slice(i, i + GRUPO);
        const resultados = await Promise.all(
          lote.map(offset =>
            axios.get('/api/tareas-pagina', { params: { offset, limit: LIMIT } })
              .then(r => r.data.data || [])
              .catch(() => [])
          )
        );
        resultados.forEach(loteData => {
          acumuladas = acumuladas.concat(loteData);
        });
        setProgreso(Math.round((acumuladas.length / totalAPI) * 100));
      }

      // Ordenar por id DESC igual que Fracttal
      acumuladas.sort((a, b) => b.id - a.id);

      setTareas(acumuladas);
      setTotal(acumuladas.length);
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
