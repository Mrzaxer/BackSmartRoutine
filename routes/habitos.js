// routes/habitos.js
const express = require('express');
const HabitoUsuario = require('../models/HabitoUsuario');
const router = express.Router();

// Guardar/Actualizar hábitos de usuario
router.post('/', async (req, res) => {
  try {
    const { userId, habitos } = req.body;

    // Validación básica
    if (!userId || !habitos) {
      return res.status(400).json({ error: 'Datos incompletos' });
    }

    // Buscar y actualizar o crear nuevo registro
    const habitoUsuario = await HabitoUsuario.findOneAndUpdate(
      { userId },
      { userId, habitos },
      { upsert: true, new: true }
    );

    res.status(200).json(habitoUsuario);
  } catch (error) {
    console.error('Error guardando hábitos:', error);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// Obtener hábitos de usuario
router.get('/', async (req, res) => {
  try {
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({ error: 'ID de usuario requerido' });
    }

    const habitoUsuario = await HabitoUsuario.findOne({ userId });

    if (!habitoUsuario) {
      return res.status(404).json({ error: 'No se encontraron hábitos' });
    }

    res.status(200).json(habitoUsuario.habitos);
  } catch (error) {
    console.error('Error obteniendo hábitos:', error);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

module.exports = router;