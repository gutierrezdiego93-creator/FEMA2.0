require('dotenv').config();
const express = require('express');
const axios = require('axios');
const cors = require('cors');
const path = require('path');
const rateLimit = require('express-rate-limit');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(express.json());
app.use(cors());

const limiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 60,
  message: { error: 'Demasiadas solicitudes, intenta en un minuto.' }
});
app.use('/api/', limiter);

let tokenCache = { token: null, expiresAt: null };

// IDs de los 27 activos de FEMA (equipos reales)
const FEMA_ITEM_IDS = [
  48905455, 48905440, 48905452, 48905453, 48905454, 48905458,
  48905441, 48905444, 48905431, 48905436, 48905445, 48905434,
  48905451, 48905447, 48905439, 48905433, 48905446, 48905432,
  48905443, 48905449, 48905435, 48905438, 48905448, 48905437,
  48905456, 48905450, 48905457
];

async function getFracttalToken() {
  const now = Date.now();
  if (tokenCache.token && tokenCache.expiresAt && now < tokenCache.expiresAt) {
    return tokenCache.token;
  }
  try {
    const params = new URLSearchParams();
    params.append('grant_type', 'client_credentials');
    params.append('client_id', process.env.FRACTTAL_CLIENT_ID);
    params.append('client_secret', process.env.FRACTTAL_CLIENT_SECRET);

    const response = await axios.post(
      `${process.env.FRACTTAL_BASE_URL}/oauth/token`,
      params,
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    );

    const { access_token, expires_in } = response.data;
    tokenCache.token = access_token;
    tokenCache.expiresAt = now + (expires_in - 60) * 1000;
    console.log('Token Fracttal obtenido correctamente');
    return access_token;
  } catch (error) {
    console.error('Error obteniendo token:', error.response?.data || error.message);
    throw new Error('No se pudo autenticar con Fracttal');
  }
}

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/api/tareas-pendientes', async (req, res) => {
  try {
    const token = await getFracttalToken();

    // Traemos en lotes de 200 y filtramos por los IDs de FEMA en el servidor
    let todasLasTareas = [];
    let start = 0;
    const batchSize = 200;
    let hayMas = true;

    while (hayMas) {
      const response = await axios.get(
        `${process.env.FRACTTAL_BASE_URL}/api/tasks/todo`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          params: {
            limit: batchSize,
            start,
            sort: JSON.stringify([{ property: 'date_maintenance', direction: 'asc' }])
          }
        }
      );

      const data = response.data;
      const lote = data.data || [];

      // Filtrar solo las tareas de activos FEMA
      const tareasFEMA = lote.filter(t => FEMA_ITEM_IDS.includes(t.id_item));
      todasLasTareas = todasLasTareas.concat(tareasFEMA);

      // Si ya encontramos todas las de FEMA o no hay más páginas, parar
      if (lote.length < batchSize || todasLasTareas.length >= FEMA_ITEM_IDS.length * 10) {
        hayMas = false;
      } else {
        start += batchSize;
      }

      // Máximo 5 páginas para no sobrecargar
      if (start >= 1000) hayMas = false;
    }

    const tareas = todasLasTareas.map(t => ({
      id: t.id,
      id_item: t.id_item,
      activo_codigo: t.code || '',
      activo_nombre: t.item_description || t.items_log_description || '',
      tarea: t.description || '',
      tipo: t.tasks_types_main_description || '',
      tipo_2: t.tasks_types_description || '',
      prioridad: t.priorities_description || '',
      fecha_mantenimiento: t.date_maintenance || '',
      duracion: t.duration || 0,
      taller: t.parent_description || '',
      trigger: t.trigger_description || '',
      plan: t.group_task_description || '',
      delay: t.delay || 0,
      es_planificada: !!t.id_group_task,
      folio_ot: t.wo_folio || null,
      solicitado_por: t.requested_by || ''
    }));

    res.json({
      success: true,
      total: tareas.length,
      data: tareas,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error tareas pendientes:', error.response?.data || error.message);
    res.status(500).json({
      success: false,
      error: 'Error al obtener tareas pendientes',
      detalle: error.message
    });
  }
});

if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/build')));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/build', 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`Servidor FEMA corriendo en puerto ${PORT}`);
  console.log(`Ambiente: ${process.env.NODE_ENV}`);
  console.log(`Fracttal URL: ${process.env.FRACTTAL_BASE_URL}`);
  console.log(`Filtrando ${FEMA_ITEM_IDS.length} activos de FEMA`);
});
