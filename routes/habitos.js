const express = require('express');
const router = express.Router();
const Habito = require('../models/habitos');

// Mapeo días a número JS
const diasSemanaMap = {
  domingo: 0,
  lunes: 1,
  martes: 2,
  miercoles: 3,
  jueves: 4,
  viernes: 5,
  sabado: 6,
};

function puedeCompletar(habito) {
  const ahora = new Date();
  const hoyDia = ahora.getDay();

  // Verificar si hoy es uno de los días programados
  const diasHabitoNums = (habito.diasSemana || []).map(d => diasSemanaMap[d.toLowerCase()]);
  if (!diasHabitoNums.includes(hoyDia)) return false;

  // Verificar si ya está completado hoy
  if (habito.estado === 'completado' && habito.fechaUltimaEjecucion) {
    const fechaUlt = new Date(habito.fechaUltimaEjecucion);
    if (fechaUlt.getDate() === ahora.getDate() && 
        fechaUlt.getMonth() === ahora.getMonth() && 
        fechaUlt.getFullYear() === ahora.getFullYear()) {
      return false;
    }
  }

  // Si no tiene hora objetivo, se puede completar en cualquier momento del día
  if (!habito.horaObjetivo) return true;

  // Verificar si ya pasó el tiempo de finalización
  const [horas, minutos] = habito.horaObjetivo.split(':').map(Number);
  const inicio = new Date(ahora);
  inicio.setHours(horas, minutos, 0, 0);

  const fin = new Date(inicio);
  fin.setMinutes(inicio.getMinutes() + (habito.duracionMinutos || 0));

  return ahora >= fin;
}

// Obtener hábitos por usuario
router.get('/usuario/:userId', async (req, res) => {
  try {
    const habitos = await Habito.find({ usuarioId: req.params.userId })
                              .sort({ createdAt: -1 }); // Ordenar por más reciente
    res.json(habitos);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener hábitos', error });
  }
});

// Crear nuevo hábito
router.post('/nuevo', async (req, res) => {
  try {
    const {
      titulo,
      descripcion = '',
      horaObjetivo = '',
      duracionMinutos = 0,
      comentarios = '',
      diasSemana = [],
      usuarioId
    } = req.body;

    if (!titulo || !usuarioId) {
      return res.status(400).json({ message: 'Título y usuarioId son obligatorios' });
    }

    if (!diasSemana || diasSemana.length === 0) {
      return res.status(400).json({ message: 'Debe seleccionar al menos un día' });
    }

    const nuevoHabito = new Habito({
      titulo,
      descripcion,
      horaObjetivo,
      duracionMinutos,
      comentarios,
      diasSemana,
      usuarioId,
      estado: 'pendiente',
      fechaUltimaEjecucion: null
    });

    const guardado = await nuevoHabito.save();
    res.status(201).json(guardado);
  } catch (error) {
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: 'Error al crear hábito', error });
  }
});

// Actualizar hábito (edición)
router.put('/:id', async (req, res) => {
  try {
    // Validar que al menos hay un día seleccionado
    if (req.body.diasSemana && req.body.diasSemana.length === 0) {
      return res.status(400).json({ message: 'Debe seleccionar al menos un día' });
    }

    const habitoActualizado = await Habito.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!habitoActualizado) {
      return res.status(404).json({ message: 'Hábito no encontrado' });
    }
    res.json(habitoActualizado);
  } catch (error) {
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: 'Error al actualizar hábito', error });
  }
});

// Borrar hábito
router.delete('/:id', async (req, res) => {
  try {
    const eliminado = await Habito.findByIdAndDelete(req.params.id);
    if (!eliminado) return res.status(404).json({ message: 'Hábito no encontrado' });
    res.json({ message: 'Hábito eliminado' });
  } catch (error) {
    res.status(500).json({ message: 'Error al eliminar hábito', error });
  }
});

// Completar hábito (validando tiempo y días)
router.post('/:id/completar', async (req, res) => {
  try {
    const habito = await Habito.findById(req.params.id);
    if (!habito) return res.status(404).json({ message: 'Hábito no encontrado' });

    if (!puedeCompletar(habito)) {
      return res.status(400).json({ message: 'No puedes completar el hábito hoy o ya lo completaste' });
    }

    habito.estado = 'completado';
    habito.fechaUltimaEjecucion = new Date();
    await habito.save();

    res.json(habito);
  } catch (error) {
    res.status(500).json({ message: 'Error al completar hábito', error });
  }
});

module.exports = router;