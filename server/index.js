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
const FRACTTAL_TASKS_URL = 'https://app.fracttal.com/api/tasks_todo/';

async function getFracttalToken() {
  const now = Date.now();
  if (tokenCache.token && tokenCache.expiresAt && now < tokenCache.expiresAt) return tokenCache.token;
  const params = new URLSearchParams();
  params.append('grant_type', 'client_credentials');
  params.append('client_id', process.env.FRACTTAL_CLIENT_ID);
  params.append('client_secret', process.env.FRACTTAL_CLIENT_SECRET);
  const r = await axios.post(`${process.env.FRACTTAL_BASE_URL}/oauth/token`, params, {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
  });
  tokenCache.token = r.data.access_token;
  tokenCache.expiresAt = now + (r.data.expires_in - 60) * 1000;
  return tokenCache.token;
}

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

app.get('/api/tareas-pendientes', async (req, res) => {
  try {
    const token = await getFracttalToken();
    const page = parseInt(req.query.page) || 0;
    const limit = 50;

    const r = await axios.get(FRACTTAL_TASKS_URL, {
      headers: { Authorization: `Bearer ${token}` },
      params: {
        limit,
        offset: page * limit,
        // Orden igual que Fracttal: id descendente (más recientes primero)
        ordering: '-id'
      }
    });

    const todas = r.data.data || [];
    const totalAPI = r.data.total || 0;

    const conActivo = todas.filter(t => (t.item_description || '').trim().length > 0);

    const tareas = conActivo.map(t => ({
      id: t.id,
      activo_codigo: t.code || '',
      activo_nombre: t.item_description || '',
      tarea: t.description || '',
      tipo: t.tasks_types_main_description || '',
      tipo_2: t.tasks_types_description || '',
      prioridad: t.priorities_description || '',
      fecha_mantenimiento: t.date_maintenance || t.cal_date_maintenance || '',
      duracion: t.duration || 0,
      taller: t.parent_description || '',
      plan: t.group_task_description || '',
      delay: t.delay || 0,
      es_planificada: !!t.id_group_task,
      folio_ot: t.wo_folio || null,
      solicitado_por: t.requested_by || ''
    }));

    res.json({
      success: true,
      total: totalAPI,
      page,
      hay_mas: (page + 1) * limit < totalAPI,
      data: tareas,
      timestamp: new Date().toISOString()
    });

  } catch (e) {
    console.error('Error:', e.message);
    res.status(500).json({ success: false, error: e.message });
  }
});

if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/build')));
  app.get('*', (req, res) => res.sendFile(path.join(__dirname, '../client/build', 'index.html')));
}
app.listen(PORT, () => console.log(`Puerto ${PORT}`));
