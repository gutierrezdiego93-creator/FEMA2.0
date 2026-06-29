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
  const response = await axios.post(
    `${process.env.FRACTTAL_BASE_URL}/oauth/token`,
    params,
    { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
  );
  tokenCache.token = response.data.access_token;
  tokenCache.expiresAt = now + (response.data.expires_in - 60) * 1000;
  return tokenCache.token;
}

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Debug completo - ver registro completo con todos los valores
app.get('/api/debug', async (req, res) => {
  try {
    const token = await getFracttalToken();
    const response = await axios.get(
      `${process.env.FRACTTAL_BASE_URL}/api/tasks/todo`,
      {
        headers: { Authorization: `Bearer ${token}` },
        params: { limit: 1, start: 0 }
      }
    );
    const primer = response.data.data?.[0] || {};
    res.json({
      total_api: response.data.total,
      registro_completo_con_valores: primer
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Debug con show_todo - probar filtros disponibles
app.get('/api/debug2', async (req, res) => {
  try {
    const token = await getFracttalToken();

    // Probar filtro por show_todo y is_wo_creating
    const response = await axios.get(
      `${process.env.FRACTTAL_BASE_URL}/api/tasks/todo`,
      {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          limit: 1,
          start: 0,
          filter: JSON.stringify([
            { property: 'show_todo', operator: 'eq', value: true, condition: 'and' },
            { property: 'is_wo_creating', operator: 'eq', value: false, condition: 'and' }
          ])
        }
      }
    );
    res.json({
      total_con_filtro_show_todo: response.data.total,
      primer_registro: response.data.data?.[0] || {}
    });
  } catch (e) {
    res.status(500).json({ error: e.message, detalle: e.response?.data });
  }
});

// Debug3 - ver qué campos acepta como filtro
app.get('/api/debug3', async (req, res) => {
  try {
    const token = await getFracttalToken();
    // Intentar filtrar por id_company = 371
    const response = await axios.get(
      `${process.env.FRACTTAL_BASE_URL}/api/tasks/todo`,
      {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          limit: 5,
          start: 0,
          filter: JSON.stringify([
            { property: 'id_company', operator: 'eq', value: 371, condition: 'and' }
          ])
        }
      }
    );
    res.json({
      total_company_371: response.data.total,
      muestra: (response.data.data || []).map(t => ({
        id: t.id,
        id_company: t.id_company,
        description: t.description,
        todos_valores: t
      }))
    });
  } catch (e) {
    res.status(500).json({ error: e.message, detalle: e.response?.data });
  }
});

app.get('/api/tareas-pendientes', async (req, res) => {
  res.json({ success: true, total: 0, data: [], mensaje: 'Investigando filtros correctos' });
});

if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/build')));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/build', 'index.html'));
  });
}

app.listen(PORT, () => console.log(`Puerto ${PORT}`));
