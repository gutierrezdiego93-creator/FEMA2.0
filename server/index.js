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

// Ver registro completo con todos sus valores reales
app.get('/api/campos', async (req, res) => {
  try {
    const token = await getFracttalToken();
    const r = await axios.get(
      `${process.env.FRACTTAL_BASE_URL}/api/tasks/todo`,
      {
        headers: { Authorization: `Bearer ${token}` },
        params: { limit: 5, start: 0 }
      }
    );
    const registros = r.data.data || [];
    // Mostrar los 5 registros completos con todos sus valores
    const analisis = registros.map(t => ({
      id: t.id,
      // Campos que pueden servir para filtrar
      item_description: t.item_description,
      code: t.code,
      parent_description: t.parent_description,
      groups_tasks_description: t.groups_tasks_description,
      id_group_task: t.id_group_task,
      id_item: t.id_item,
      id_type_item: t.id_type_item,
      date_maintenance: t.date_maintenance,
      is_active: t.is_active,
      // Ver el registro COMPLETO
      TODOS_LOS_CAMPOS: t
    }));
    res.json({ total: r.data.total, analisis });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Probar: filtrar donde item_description NO sea nulo (tiene activo asociado)
app.get('/api/con-activo', async (req, res) => {
  try {
    const token = await getFracttalToken();
    const r = await axios.get(
      `${process.env.FRACTTAL_BASE_URL}/api/tasks/todo`,
      {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          limit: 10,
          start: 0,
          filter: JSON.stringify([
            { property: 'item_description', operator: 'is not', value: null, condition: 'and' }
          ])
        }
      }
    );
    res.json({
      total_con_activo: r.data.total,
      muestra: (r.data.data || []).map(t => ({
        item_description: t.item_description,
        code: t.code,
        parent_description: t.parent_description,
        id_item: t.id_item
      }))
    });
  } catch (e) {
    res.status(500).json({ error: e.message, detalle: e.response?.data });
  }
});

// Probar: filtrar por code no nulo
app.get('/api/con-code', async (req, res) => {
  try {
    const token = await getFracttalToken();
    const r = await axios.get(
      `${process.env.FRACTTAL_BASE_URL}/api/tasks/todo`,
      {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          limit: 10,
          start: 0,
          filter: JSON.stringify([
            { property: 'code', operator: 'is not', value: null, condition: 'and' }
          ])
        }
      }
    );
    res.json({
      total_con_code: r.data.total,
      muestra: (r.data.data || []).map(t => ({
        item_description: t.item_description,
        code: t.code,
        parent_description: t.parent_description
      }))
    });
  } catch (e) {
    res.status(500).json({ error: e.message, detalle: e.response?.data });
  }
});

app.get('/api/tareas-pendientes', async (req, res) => {
  try {
    const token = await getFracttalToken();
    const page = parseInt(req.query.page) || 0;
    const r = await axios.get(
      `${process.env.FRACTTAL_BASE_URL}/api/tasks/todo`,
      {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          limit: 50,
          start: page * 50,
          sort: JSON.stringify([{ property: 'date_maintenance', direction: 'asc' }])
        }
      }
    );
    const data = r.data.data || [];
    const tareas = data.map(t => ({
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
    res.json({ success: true, total: r.data.total, page, hay_mas: (page + 1) * 50 < r.data.total, data: tareas });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/build')));
  app.get('*', (req, res) => res.sendFile(path.join(__dirname, '../client/build', 'index.html')));
}

app.listen(PORT, () => console.log(`Puerto ${PORT}`));
