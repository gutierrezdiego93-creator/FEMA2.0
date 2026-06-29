import { useState, useCallback } from 'react';
import axios from 'axios';

export function useTareasPendientes() {
  const [tareas, setTareas] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [cargandoMas, setCargandoMas] = useState(false);
  const [error, setError] = useState(null);
  const [ultimaActualizacion, setUltimaActualizacion] = useState(null);
  const [page, setPage] = useState(0);
  const [hayMas, setHayMas] = useState(false);

  const cargar = useCallback(async () => {
    setLoading(true);
    setError(null);
    setPage(0);
    setTareas([]);
    try {
      const res = await axios.get('/api/tareas-pendientes', { params: { page: 0 } });
      if (res.data.success) {
        setTareas(res.data.data);
        setTotal(res.data.total);
        setHayMas(res.data.hay_mas);
        setUltimaActualizacion(new Date());
      }
    } catch (err) {
      setError('Error de conexión con Fracttal');
    } finally {
      setLoading(false);
    }
  }, []);

  const cargarMas = useCallback(async () => {
    if (cargandoMas) return;
    setCargandoMas(true);
    try {
      const nextPage = page + 1;
      const res = await axios.get('/api/tareas-pendientes', { params: { page: nextPage } });
      if (res.data.success) {
        setTareas(prev => [...prev, ...res.data.data]);
        setPage(nextPage);
        setHayMas(res.data.hay_mas);
      }
    } catch (err) {
      console.error('Error:', err.message);
    } finally {
      setCargandoMas(false);
    }
  }, [page, cargandoMas]);

  return { tareas, total, loading, cargandoMas, error, ultimaActualizacion, cargar, cargarMas, hayMas };
}
