import React, { useEffect, useState } from 'react';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import PanelCentral from './components/PanelCentral';
import { useTareasPendientes } from './hooks/useTareasPendientes';

export default function App() {
  const { tareas, total, loading, progreso, error, ultimaActualizacion, cargar } = useTareasPendientes();
  const [tareaSeleccionada, setTareaSeleccionada] = useState(null);
  useEffect(() => { cargar(); }, [cargar]);

  return (
    <div style={{ fontFamily: "'Inter', sans-serif", height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <Header />
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <Sidebar
          tareas={tareas}
          total={total}
          loading={loading}
          progreso={progreso}
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
