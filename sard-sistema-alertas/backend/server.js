const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
require('dotenv').config();

const app = express();

// Habilitar CORS para permitir peticiones desde el frontend (React/Vite)
app.use(cors());
app.use(express.json());

// Configuración de la conexión a PostgreSQL
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

// Ruta API para obtener las alertas activas
app.get('/api/alertas', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        id,
        tipo_incidente,
        descripcion,
        nivel_severidad,
        estado,
        ST_AsGeoJSON(ubicacion) as coordenadas
      FROM alertas_sard
    `);
    res.json(result.rows);
  } catch (err) {
    console.error('Error al consultar la base de datos:', err);
    res.status(500).send('Error en el servidor SARD');
  }
});
// Ruta API para guardar una nueva alerta en PostgreSQL
app.post('/api/alertas', async (req, res) => {
  const { tipo_incidente, descripcion, nivel_severidad, latitud, longitud } = req.body;

  try {
    const query = `
      INSERT INTO alertas_sard (tipo_incidente, descripcion, nivel_severidad, estado, ubicacion)
      VALUES ($1, $2, $3, 'activo', ST_SetSRID(ST_MakePoint($4, $5), 4326))
      RETURNING *, ST_AsGeoJSON(ubicacion) as coordenadas;
    `;
    // Nota: ST_MakePoint recibe primero Longitud y luego Latitud
    const values = [tipo_incidente, descripcion, nivel_severidad, longitud, latitud];
    const result = await pool.query(query, values);

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error insertando la alerta:', err);
    res.status(500).send('Error al guardar la alerta');
  }
});
// Ruta para actualizar el estado de una alerta (ej. de 'activo' a 'resuelto')
app.put('/api/alertas/:id', async (req, res) => {
  const { id } = req.params;
  const { estado } = req.body;

  try {
    const query = 'UPDATE alertas_sard SET estado = $1 WHERE id = $2 RETURNING *;';
    const result = await pool.query(query, [estado, id]);
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error actualizando alerta:', err);
    res.status(500).send('Error al actualizar el estado de la alerta');
  }
});

// Ruta para eliminar una alerta por su ID
app.delete('/api/alertas/:id', async (req, res) => {
  const { id } = req.params;

  try {
    await pool.query('DELETE FROM alertas_sard WHERE id = $1;', [id]);
    res.json({ mensaje: 'Alerta eliminada correctamente' });
  } catch (err) {
    console.error('Error eliminando alerta:', err);
    res.status(500).send('Error al eliminar la alerta');
  }
});
// Iniciar servidor
app.listen(3000, () => {
  console.log('Servidor de alertas operando en http://localhost:3000');
});