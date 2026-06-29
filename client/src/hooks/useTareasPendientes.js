import { useState, useCallback } from 'react';
import axios from 'axios';

export function useTareasPendientes() {
  const [tareas, setTareas] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [ultimaActualizacion, setUltimaActualizacion] = useState(null);
  const [page, setPage] = useState(0);
  const [cargandoMas, setCargandoMas] = useState(false);

  const cargar = useCallback(async () => {
    setLoading(true);
    setError(null);
    setPage(0);
    try {
      const res = await axios.get('/api/tareas-pendientes', { params: { page: 0 } });
      if (res.data.success) {
        setTareas(res.data.data);
        setTotal(res.data.total);
        setUltimaActualizacion(new Date());
      } else {
        setError('Error al cargar tareas');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Error de conexión');
    } finally {
      setLoading(false);
    }
  }, []);

  const cargarMas = useCallback(async () => {
    setCargandoMas(true);
    try {
      const nextPage = page + 1;
      const res = await axios.get('/api/tareas-pendientes', { params: { page: nextPage } });
      if (res.data.success) {
        setTareas(prev => [...prev, ...res.data.data]);
        setPage(nextPage);
      }
    } catch (err) {
      console.error('Error cargando más:', err.message);
    } finally {
      setCargandoMas(false);
    }
  }, [page]);

  const hayMas = tareas.length < total;

  return { tareas, total, loading, error, ultimaActualizacion, cargar, cargarMas, hayMas, cargandoMas };
}
