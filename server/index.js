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

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

// Prueba 1: filtrar num_iterations is null
app.get('/api/prueba1', async (req, res) => {
  try {
    const token = await getFracttalToken();
    const r = await axios.get(`${process.env.FRACTTAL_BASE_URL}/api/tasks/todo`, {
      headers: { Authorization: `Bearer ${token}` },
      params: {
        limit: 5, start: 0,
        filter: JSON.stringify([
          { property: 'num_iterations', operator: 'is', value: null, condition: 'and' }
        ])
      }
    });
    res.json({ total: r.data.total, muestra: (r.data.data||[]).map(t=>({ id:t.id, num_iterations:t.num_iterations, is_cyclical:t.is_cyclical, description:t.description })) });
  } catch (e) { res.status(500).json({ error: e.message, detalle: e.response?.data }); }
});

// Prueba 2: filtrar is_cyclical = false
app.get('/api/prueba2', async (req, res) => {
  try {
    const token = await getFracttalToken();
    const r = await axios.get(`${process.env.FRACTTAL_BASE_URL}/api/tasks/todo`, {
      headers: { Authorization: `Bearer ${token}` },
      params: {
        limit: 5, start: 0,
        filter: JSON.stringify([
          { property: 'is_cyclical', operator: 'eq', value: false, condition: 'and' }
        ])
      }
    });
    res.json({ total: r.data.total, muestra: (r.data.data||[]).map(t=>({ id:t.id, num_iterations:t.num_iterations, is_cyclical:t.is_cyclical, description:t.description })) });
  } catch (e) { res.status(500).json({ error: e.message, detalle: e.response?.data }); }
});

// Prueba 3: filtrar replay_counter = 0 (sin iteraciones previas)
app.get('/api/prueba3', async (req, res) => {
  try {
    const token = await getFracttalToken();
    const r = await axios.get(`${process.env.FRACTTAL_BASE_URL}/api/tasks/todo`, {
      headers: { Authorization: `Bearer ${token}` },
      params: {
        limit: 5, start: 0,
        filter: JSON.stringify([
          { property: 'replay_counter', operator: 'eq', value: 0, condition: 'and' }
        ])
      }
    });
    res.json({ total: r.data.total, muestra: (r.data.data||[]).map(t=>({ id:t.id, replay_counter:t.replay_counter, num_iterations:t.num_iterations, is_cyclical:t.is_cyclical, description:t.description })) });
  } catch (e) { res.status(500).json({ error: e.message, detalle: e.response?.data }); }
});

app.get('/api/tareas-pendientes', async (req, res) => {
  try {
    const token = await getFracttalToken();
    const page = parseInt(req.query.page) || 0;
    const r = await axios.get(`${process.env.FRACTTAL_BASE_URL}/api/tasks/todo`, {
      headers: { Authorization: `Bearer ${token}` },
      params: {
        limit: 50, start: page * 50,
        sort: JSON.stringify([{ property: 'date_maintenance', direction: 'asc' }])
      }
    });
    const tareas = (r.data.data||[]).map(t => ({
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
      plan: t.groups_tasks_description || '',
      delay: t.delay || 0,
      es_planificada: !!t.id_group_task,
      folio_ot: t.wo_folio || null,
      solicitado_por: t.requested_by || ''
    }));
    res.json({ success: true, total: r.data.total, page, hay_mas: (page+1)*50 < r.data.total, data: tareas });
  } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/build')));
  app.get('*', (req, res) => res.sendFile(path.join(__dirname, '../client/build', 'index.html')));
}
app.listen(PORT, () => console.log(`Puerto ${PORT}`));
