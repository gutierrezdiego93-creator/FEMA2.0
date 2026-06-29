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
let tareasCache = [];
let cacheTimestamp = null;
let cargando = false;
const CACHE_TTL = 5 * 60 * 1000;

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

async function fetchPagina(token, offset, limit) {
  try {
    const r = await axios.get(FRACTTAL_TASKS_URL, {
      headers: { Authorization: `Bearer ${token}` },
      params: { limit, offset },
      timeout: 15000
    });
    return { data: r.data.data || [], total: r.data.total || 0 };
  } catch (e) {
    console.error(`Error página offset=${offset}:`, e.message);
    return { data: [], total: 0 };
  }
}

async function recargarCache() {
  if (cargando) return;
  cargando = true;
  try {
    const token = await getFracttalToken();
    const limit = 200;

    // Primera página para saber el total
    const primera = await fetchPagina(token, 0, limit);
    const total = primera.total;
    console.log(`Total API: ${total} tareas`);

    // Calcular todos los offsets necesarios
    const offsets = [];
    for (let offset = limit; offset < total; offset += limit) {
      offsets.push(offset);
    }

    // Cargar en paralelo de 5 en 5
    let todasLasPaginas = [...primera.data];
    const BATCH = 5;
    for (let i = 0; i < offsets.length; i += BATCH) {
      const lote = offsets.slice(i, i + BATCH);
      const resultados = await Promise.all(lote.map(offset => fetchPagina(token, offset, limit)));
      resultados.forEach(r => { todasLasPaginas = todasLasPaginas.concat(r.data); });
      console.log(`Cargadas ${todasLasPaginas.length} de ${total}`);
    }

    // Filtrar con activo y ordenar por id DESC
    const conActivo = todasLasPaginas
      .filter(t => (t.item_description || '').trim().length > 0)
      .sort((a, b) => b.id - a.id);

    tareasCache = conActivo;
    cacheTimestamp = Date.now();
    console.log(`Cache listo: ${conActivo.length} con activo de ${total} total`);
  } catch (e) {
    console.error('Error cache:', e.message);
  } finally {
    cargando = false;
  }
}

recargarCache();

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    cache_tareas: tareasCache.length,
    cache_edad_min: cacheTimestamp ? Math.round((Date.now() - cacheTimestamp) / 60000) : null,
    cargando
  });
});

app.get('/api/tareas-pendientes', async (req, res) => {
  try {
    if (tareasCache.length === 0 && !cargando) recargarCache();
    if (req.query.refresh === 'true') recargarCache();
    if (cacheTimestamp && Date.now() - cacheTimestamp > CACHE_TTL) recargarCache();

    const page = parseInt(req.query.page) || 0;
    const limit = 50;
    const inicio = page * limit;
    const pagina = tareasCache.slice(inicio, inicio + limit);

    res.json({
      success: true,
      total: tareasCache.length,
      page,
      hay_mas: inicio + limit < tareasCache.length,
      cargando,
      data: pagina.map(t => ({
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
    res.status(500).json({ success: false, error: e.message });
  }
});

if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/build')));
  app.get('*', (req, res) => res.sendFile(path.join(__dirname, '../client/build', 'index.html')));
}
app.listen(PORT, () => console.log(`Puerto ${PORT}`));
