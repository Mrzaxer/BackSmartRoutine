const { v4: uuidv4 } = require('uuid');
const express = require('express');
const router = express.Router();
const SensorData = require('../models/sensorData');

// Obtener datos por usuario (ruta protegida o no)
router.get('/:userId', async (req, res) => {
  const { userId } = req.params;

  try {
    // Usamos user_id para coincidir con tu DB
    const datos = await SensorData.find({ user_id: userId });
    res.json(datos);
  } catch (error) {
    console.error('Error al obtener datos por user_id:', error);
    res.status(500).json({ error: 'Error al obtener datos' });
  }
});

// Insertar dato nuevo
router.post('/', async (req, res) => {
  try {
    const { user_id, tipo_sensor, valor, unidad, timestamp } = req.body;

    if (!user_id || !tipo_sensor || valor === undefined || !unidad || !timestamp) {
      return res.status(400).json({ error: 'Todos los campos son requeridos' });
    }

    const nuevoDato = new SensorData({
      _id: uuidv4(), // asignar id único
      user_id,
      tipo_sensor,
      valor,
      unidad,
      timestamp
    });

    const guardado = await nuevoDato.save();
    res.status(201).json(guardado);
  } catch (error) {
    console.error('Error al guardar dato:', error);
    res.status(500).json({ error: 'Error al guardar en base de datos' });
  }
});

// Obtener todos los usuarios con registros (opcional, proteger si quieres)
router.get('/users/all', async (req, res) => {
  try {
    // Usamos user_id para coincidir con tu DB
    const userIds = await SensorData.distinct('user_id');
    res.json(userIds);
  } catch (error) {
    console.error('Error al obtener userIds:', error);
    res.status(500).json({ error: 'Error al obtener userIds' });
  }
});

module.exports = router;
