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

// Textos que identifican ubicaciones de FEMA en parent_description
const FEMA_KEYWORDS = [
  'FEMA',
  'Taller Preventivo',
  'Taller Correctivo',
  'Taller Externo',
  'Taller Llantas',
  'Taller Pintura',
  'Taller Remolques',
  'Taller Edificios',
  'Transportes de Carga FEMA'
];

function esTareaFEMA(tarea) {
  const parentDesc = tarea.parent_description || '';
  return FEMA_KEYWORDS.some(kw => parentDesc.includes(kw));
}

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
    console.log('Token Fracttal obtenido');
    return access_token;
  } catch (error) {
    console.error('Error token:', error.response?.data || error.message);
    throw new Error('No se pudo autenticar con Fracttal');
  }
}

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/api/debug', async (req, res) => {
  try {
    const token = await getFracttalToken();
    const response = await axios.get(
      `${process.env.FRACTTAL_BASE_URL}/api/tasks/todo`,
      {
        headers: { Authorization: `Bearer ${token}` },
        params: { limit: 5, start: 0 }
      }
    );
    // Mostrar solo los campos clave de las primeras 3 tareas
    const muestra = (response.data.data || []).slice(0, 3).map(t => ({
      id: t.id,
      id_item: t.id_item,
      description: t.description,
      parent_description: t.parent_description,
      item_description: t.item_description,
      code: t.code,
      total_campos: Object.keys(t).length,
      todos_campos: Object.keys(t)
    }));
    res.json({ total: response.data.total, muestra });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/tareas-pendientes', async (req, res) => {
  try {
    const token = await getFracttalToken();
    let todasFEMA = [];
    let start = 0;
    const batchSize = 200;
    let continuar = true;
    let paginasRevisadas = 0;
    const MAX_PAGINAS = 15;

    while (continuar && paginasRevisadas < MAX_PAGINAS) {
      const response = await axios.get(
        `${process.env.FRACTTAL_BASE_URL}/api/tasks/todo`,
        {
          headers: { Authorization: `Bearer ${token}` },
          params: {
            limit: batchSize,
            start,
            sort: JSON.stringify([{ property: 'date_maintenance', direction: 'asc' }])
          }
        }
      );

      const lote = response.data.data || [];
      const totalAPI = response.data.total || 0;

      // Filtrar solo las de FEMA
      const femaDeLote = lote.filter(esTareaFEMA);
      todasFEMA = todasFEMA.concat(femaDeLote);

      console.log(`Página ${paginasRevisadas + 1}: ${lote.length} tareas, ${femaDeLote.length} de FEMA`);

      paginasRevisadas++;
      start += batchSize;

      // Parar si ya revisamos todo
      if (start >= totalAPI || lote.length < batchSize) {
        continuar = false;
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
      activo_nombre: t.item_description || '',
      tarea: t.description || '',
      tipo: t.tasks_types_main_description || '',
      tipo_2: t.tasks_types_description || '',
      prioridad: t.priorities_description || '',
      fecha_mantenimiento: t.date_maintenance || '',
      duracion: t.duration || 0,
      taller: t.parent_description || '',
      trigger: t.trigger_description || '',
      plan: t.groups_tasks_description || t.group_task_description || '',
      delay: t.delay || 0,
      es_planificada: !!t.id_group_task,
      folio_ot: t.wo_folio || null,
      solicitado_por: t.requested_by || ''
    }));

    console.log(`Total tareas FEMA encontradas: ${tareas.length}`);

    res.json({
      success: true,
      total: tareas.length,
      data: tareas,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
    res.status(500).json({
      success: false,
      error: 'Error al obtener tareas',
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
});
