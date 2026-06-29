import { useState, useCallback } from 'react';
import axios from 'axios';

export function useTareasPendientes() {
  const [tareas, setTareas] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [ultimaActualizacion, setUltimaActualizacion] = useState(null);

  const cargar = useCallback(async () => {
    setLoading(true);
    setError(null);
    setTareas([]);
    try {
      const res = await axios.get('/api/tareas-pendientes');
      if (res.data.success) {
        setTareas(res.data.data);
        setTotal(res.data.total);
        setUltimaActualizacion(new Date());
      }
    } catch (err) {
      setError('Error de conexión con Fracttal');
    } finally {
      setLoading(false);
    }
  }, []);

  return { tareas, total, loading, error, ultimaActualizacion, cargar };
}
