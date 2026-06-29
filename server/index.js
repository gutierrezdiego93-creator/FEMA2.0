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

app.get('/api/tareas-pendientes', async (req, res) => {
  try {
    const token = await getFracttalToken();
    const page = parseInt(req.query.page) || 0;
    const limit = 200; // traemos más por página para compensar el filtro
    const start = page * limit;

    const r = await axios.get(
      `${process.env.FRACTTAL_BASE_URL}/api/tasks/todo`,
      {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          limit,
          start,
          sort: JSON.stringify([{ property: 'date_maintenance', direction: 'asc' }])
        }
      }
    );

    const todas = r.data.data || [];
    const totalAPI = r.data.total || 0;

    // FILTRO: solo tareas que tienen activo registrado
    // item_description debe tener contenido real (no vacío, no solo espacios)
    const conActivo = todas.filter(t => {
      const nombre = (t.item_description || '').trim();
      return nombre.length > 0;
    });

    const tareas = conActivo.map(t => ({
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

    // Calcular si hay más páginas
    const hayMas = start + limit < totalAPI;

    console.log(`Página ${page}: ${todas.length} totales, ${tareas.length} con activo`);

    res.json({
      success: true,
      total_api: totalAPI,        // total real de la API (9243)
      total_pagina: tareas.length, // cuántos con activo en esta página
      page,
      hay_mas: hayMas,
      data: tareas,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/build')));
  app.get('*', (req, res) => res.sendFile(path.join(__dirname, '../client/build', 'index.html')));
}

app.listen(PORT, () => console.log(`Puerto ${PORT}`));
