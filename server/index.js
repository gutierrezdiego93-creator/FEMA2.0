require('dotenv').config();
const express = require('express');
const axios = require('axios');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;
app.use(express.json());
app.use(cors());

let tokenCache = { token: null, expiresAt: null };

// Los 27 activos reales de FEMA con sus códigos
const FEMA_ACTIVOS = {
  48905455: 'Auto A-0067',
  48905440: 'Auto A-0132',
  48905452: 'Bomba de Lavado F-30584',
  48905453: 'Camioneta A-0128',
  48905454: 'Minisplit F-30631',
  48905458: 'Plancha F-30323',
  48905441: 'Remolque RE-50129',
  48905444: 'Remolque RE-50347',
  48905431: 'Remolque RE-51022',
  48905436: 'Remolque RE-51217',
  48905445: 'Remolque RE-51621',
  48905434: 'Remolque RE-51741',
  48905451: 'Termostatos F-30445',
  48905447: 'Tractor TC-0770',
  48905439: 'Tractor TC-0771',
  48905433: 'Tractor TC-0776',
  48905446: 'Tractor TC-0784',
  48905432: 'Tractor TC-0785',
  48905443: 'Tractor TC-0789',
  48905449: 'Tractor TC-2047',
  48905435: 'Tractor TC-2185',
  48905438: 'Transfer TT-1183',
  48905448: 'Transfer TT-1220',
  48905437: 'Transfer TT-1222',
  48905456: 'Transfer TT-1242',
  48905450: 'Transfer TT-1244',
  48905457: 'Transfer TT-1504'
};

const FEMA_IDS = Object.keys(FEMA_ACTIVOS).map(Number);

// Talleres de FEMA por ID de activo
const TALLERES = {
  48905455: 'Taller Externo',
  48905440: 'Taller Externo',
  48905453: 'Taller Externo',
  48905452: 'Taller Edificios',
  48905454: 'Taller Edificios',
  48905458: 'Taller Edificios',
  48905451: 'Taller Edificios',
  48905441: 'Taller Remolques',
  48905444: 'Taller Remolques',
  48905436: 'Taller Remolques',
  48905445: 'Taller Remolques',
  48905431: 'Taller Llantas',
  48905434: 'Taller Llantas',
  48905438: 'Taller Llantas',
  48905437: 'Taller Llantas',
  48905447: 'Taller Preventivo',
  48905439: 'Taller Preventivo',
  48905449: 'Taller Preventivo',
  48905435: 'Taller Preventivo',
  48905433: 'Taller Correctivo',
  48905446: 'Taller Correctivo',
  48905432: 'Taller Correctivo',
  48905443: 'Taller Correctivo',
  48905448: 'Taller Pintura',
  48905456: 'Taller Pintura',
  48905450: 'Taller Pintura',
  48905457: 'Taller Pintura'
};

async function getFracttalToken() {
  const now = Date.now();
  if (tokenCache.token && tokenCache.expiresAt && now < tokenCache.expiresAt) {
    return tokenCache.token;
  }
  const params = new URLSearchParams();
  params.append('grant_type', 'client_credentials');
  params.append('client_id', process.env.FRACTTAL_CLIENT_ID);
  params.append('client_secret', process.env.FRACTTAL_CLIENT_SECRET);
  const r = await axios.post(
    `${process.env.FRACTTAL_BASE_URL}/oauth/token`,
    params,
    { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
  );
  tokenCache.token = r.data.access_token;
  tokenCache.expiresAt = now + (r.data.expires_in - 60) * 1000;
  return tokenCache.token;
}

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', fema_activos: FEMA_IDS.length });
});

app.get('/api/debug', async (req, res) => {
  try {
    const token = await getFracttalToken();
    // Buscar tareas del primer activo FEMA para ver estructura
    const r = await axios.get(
      `${process.env.FRACTTAL_BASE_URL}/api/tasks/todo`,
      {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          limit: 3,
          start: 0,
          filter: JSON.stringify([
            { property: 'id_item', operator: 'eq', value: 48905449, condition: 'and' }
          ])
        }
      }
    );
    res.json({
      total_con_id_item: r.data.total,
      data: r.data.data || [],
      campos: Object.keys(r.data.data?.[0] || {})
    });
  } catch (e) {
    res.status(500).json({ error: e.message, detalle: e.response?.data });
  }
});

app.get('/api/tareas-pendientes', async (req, res) => {
  try {
    const token = await getFracttalToken();
    let todasFEMA = [];

    // Consultar tareas de todos los activos FEMA en lotes de 10 IDs
    const loteSize = 10;
    for (let i = 0; i < FEMA_IDS.length; i += loteSize) {
      const lote = FEMA_IDS.slice(i, i + loteSize);

      const filtros = lote.map(id => ({
        property: 'id_item',
        operator: 'eq',
        value: id,
        condition: 'or'
      }));

      try {
        const r = await axios.get(
          `${process.env.FRACTTAL_BASE_URL}/api/tasks/todo`,
          {
            headers: { Authorization: `Bearer ${token}` },
            params: {
              limit: 200,
              start: 0,
              filter: JSON.stringify(filtros),
              sort: JSON.stringify([{ property: 'date_maintenance', direction: 'asc' }])
            }
          }
        );
        const tareas = r.data.data || [];
        console.log(`Lote IDs ${lote.join(',')}: ${tareas.length} tareas`);
        todasFEMA = todasFEMA.concat(tareas);
      } catch (e) {
        console.error(`Error lote ${i}:`, e.message);
      }
    }

    // Eliminar duplicados
    const vistas = new Set();
    const unicas = todasFEMA.filter(t => {
      if (vistas.has(t.id)) return false;
      vistas.add(t.id);
      return true;
    });

    const tareas = unicas.map(t => ({
      id: t.id,
      activo_codigo: t.code || '',
      activo_nombre: FEMA_ACTIVOS[t.id_item] || t.item_description || '',
      tarea: t.description || '',
      tipo: t.tasks_types_main_description || '',
      tipo_2: t.tasks_types_description || '',
      prioridad: t.priorities_description || '',
      fecha_mantenimiento: t.date_maintenance || '',
      duracion: t.duration || 0,
      taller: TALLERES[t.id_item] || '',
      trigger: t.trigger_description || '',
      plan: t.groups_tasks_description || '',
      delay: t.delay || 0,
      es_planificada: !!t.id_group_task,
      folio_ot: t.wo_folio || null,
      solicitado_por: t.requested_by || ''
    }));

    console.log(`Total tareas FEMA: ${tareas.length}`);
    res.json({ success: true, total: tareas.length, data: tareas, timestamp: new Date().toISOString() });

  } catch (error) {
    console.error('Error:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/build')));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/build', 'index.html'));
  });
}

app.listen(PORT, () => console.log(`Puerto ${PORT} - ${FEMA_IDS.length} activos FEMA`));
