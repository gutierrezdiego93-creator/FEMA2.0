require('dotenv').config();
const express = require('express');
const axios = require('axios');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;
app.use(express.json());
app.use(cors());

const FRACTTAL_TASKS_URL = 'https://app.fracttal.com/api/tasks_todo/';
let tokenCache = { token: null, expiresAt: null };

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

function getFechas() {
  const hoy = new Date();
  const desde = new Date(hoy);
  desde.setMonth(desde.getMonth() - 3);
  const hasta = new Date(hoy);
  hasta.setDate(hasta.getDate() + 90);
  return {
    since: desde.toISOString().split('T')[0],
    until: hasta.toISOString().split('T')[0]
  };
}

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

app.get('/api/tareas-pendientes', async (req, res) => {
  res.set({ 'Cache-Control': 'no-store', 'Pragma': 'no-cache' });
  try {
    const token = await getFracttalToken();
    const { since, until } = getFechas();

    // La API limita a 100 por página — paginamos en el servidor
    let todas = [];
    let offset = 0;
    const LIMIT = 100;

    while (true) {
      console.log(`Cargando offset=${offset} rango ${since} → ${until}`);
      const r = await axios.get(FRACTTAL_TASKS_URL, {
        headers: { Authorization: `Bearer ${token}` },
        params: { since, until, limit: LIMIT, offset },
        timeout: 30000
      });

      const lote = r.data.data || [];
      const totalAPI = r.data.total || 0;
      todas = todas.concat(lote);

      console.log(`offset=${offset}: ${lote.length} registros, total=${totalAPI}`);

      // Parar si llegamos al total o si la página vino incompleta
      if (lote.length < LIMIT || offset + LIMIT >= totalAPI) break;
      offset += LIMIT;
    }

    console.log(`Total descargado: ${todas.length}`);

    const conActivo = todas
      .filter(t => (t.item_description || '').trim().length > 0)
      .sort((a, b) => b.id - a.id);

    res.json({
      success: true,
      total: conActivo.length,
      rango: { since, until },
      data: conActivo.map(t => ({
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
      })),
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
