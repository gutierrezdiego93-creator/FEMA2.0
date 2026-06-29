import React, { useEffect, useState } from 'react';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import PanelCentral from './components/PanelCentral';
import { useTareasPendientes } from './hooks/useTareasPendientes';

const estilos = {
  app: {
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    height: '100vh',
    display: 'flex',
    flexDirection: 'column',
    background: '#f7f9fc',
    overflow: 'hidden'
  },
  cuerpo: {
    display: 'flex',
    flex: 1,
    overflow: 'hidden'
  }
};

export default function App() {
  const { tareas, total, loading, error, ultimaActualizacion, cargar } = useTareasPendientes();
  const [tareaSeleccionada, setTareaSeleccionada] = useState(null);

  useEffect(() => {
    cargar();
  }, [cargar]);

  return (
    <div style={estilos.app}>
      <Header />
      <div style={estilos.cuerpo}>
        <Sidebar
          tareas={tareas}
          total={total}
          loading={loading}
          error={error}
          ultimaActualizacion={ultimaActualizacion}
          onActualizar={cargar}
          onSeleccionarTarea={setTareaSeleccionada}
          tareaSeleccionada={tareaSeleccionada}
        />
        <PanelCentral tareaSeleccionada={tareaSeleccionada} />
      </div>
    </div>
  );
}
