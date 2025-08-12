const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Habito = require('../models/habitos');
const ProgresoHabito = require('../models/progresoHabito');

// Registrar progreso diario
router.post('/registrar', async (req, res) => {
  try {
    const { habitoId, usuarioId, completado, porcentaje, notas } = req.body;

    // Validar que el hábito existe y pertenece al usuario
    const habito = await Habito.findOne({ _id: habitoId, usuarioId });
    if (!habito) {
      return res.status(404).json({ message: 'Hábito no encontrado' });
    }

    // Verificar si ya hay registro para hoy
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    
    const existeRegistro = await ProgresoHabito.findOne({
      habitoId,
      usuarioId,
      fecha: { $gte: hoy }
    });

    if (existeRegistro) {
      return res.status(400).json({ message: 'Ya hay un registro para hoy' });
    }

    // Crear nuevo registro de progreso
    const nuevoProgreso = new ProgresoHabito({
      habitoId,
      usuarioId,
      fecha: new Date(),
      completado,
      porcentaje,
      notas
    });

    await nuevoProgreso.save();

    // Actualizar racha del hábito
    if (completado) {
      habito.streak += 1;
      if (habito.streak > habito.mejorStreak) {
        habito.mejorStreak = habito.streak;
      }
      habito.estado = 'completado';
    } else {
      habito.streak = 0;
      habito.estado = 'fallado';
    }

    await habito.save();

    res.status(201).json(nuevoProgreso);
  } catch (error) {
    res.status(500).json({ message: 'Error al registrar progreso', error });
  }
});

// Obtener progreso de un hábito
router.get('/habito/:habitoId', async (req, res) => {
  try {
    const { habitoId } = req.params;
    const { usuarioId } = req.query;

    // Validar que el hábito existe y pertenece al usuario
    const habito = await Habito.findOne({ _id: habitoId, usuarioId });
    if (!habito) {
      return res.status(404).json({ message: 'Hábito no encontrado' });
    }

    // Obtener todos los registros de progreso
    const progreso = await ProgresoHabito.find({ habitoId })
      .sort({ fecha: -1 })
      .limit(30); // Últimos 30 días

    // Calcular estadísticas
    const estadisticas = await habito.calcularProgreso();

    res.json({
      habito,
      progreso,
      estadisticas
    });
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener progreso', error });
  }
});

// Obtener resumen de progreso para el usuario
router.get('/usuario/:usuarioId', async (req, res) => {
  try {
    const { usuarioId } = req.params;
    const { limite = 7 } = req.query; // Últimos 7 días por defecto

    // Obtener hábitos del usuario
    const habitos = await Habito.find({ usuarioId });

    // Obtener progreso para cada hábito
    const resumen = await Promise.all(habitos.map(async habito => {
      const progreso = await habito.calcularProgreso();
      return {
        habitoId: habito._id,
        titulo: habito.titulo,
        ...progreso
      };
    }));

    // Obtener datos para gráfico de los últimos días
    const fechas = [];
    const hoy = new Date();
    for (let i = 0; i < limite; i++) {
      const fecha = new Date(hoy);
      fecha.setDate(hoy.getDate() - i);
      fechas.push(fecha.toISOString().split('T')[0]);
    }

    const datosGrafico = await Promise.all(fechas.map(async fecha => {
      const fechaObj = new Date(fecha);
      const siguienteDia = new Date(fechaObj);
      siguienteDia.setDate(fechaObj.getDate() + 1);

      const completados = await ProgresoHabito.countDocuments({
        usuarioId,
        fecha: { $gte: fechaObj, $lt: siguienteDia },
        completado: true
      });

      return {
        fecha,
        completados
      };
    }));

    res.json({
      resumen,
      grafico: datosGrafico.reverse() // Ordenar de más antiguo a más reciente
    });
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener resumen', error });
  }
});

// Obtener resumen de progreso para logros
// Obtener resumen de progreso para logros
router.get('/usuario/:userId/resumen', async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Validar que el userId es un ObjectId válido
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: 'ID de usuario no válido' });
    }

    // Convertir userId a ObjectId
    const usuarioObjectId = new mongoose.Types.ObjectId(userId);
    
    // Obtener hábitos del usuario
    const habitos = await Habito.find({ usuarioId: userId });
    
    // Obtener progreso de los últimos 30 días
    const treintaDiasAtras = new Date();
    treintaDiasAtras.setDate(treintaDiasAtras.getDate() - 30);
    
    const progreso = await ProgresoHabito.aggregate([
      {
        $match: {
          usuarioId: usuarioObjectId,
          fecha: { $gte: treintaDiasAtras },
          completado: true
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$fecha" }
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { _id: -1 }
      }
    ]);
    
    // Calcular máximos diarios
    const maxDiario = progreso.reduce((max, item) => Math.max(max, item.count), 0);
    
    res.json({
      totalHabitos: habitos.length,
      habitosCompletados: habitos.filter(h => h.estado === 'completado').length,
      maxDiario,
      rachaMaxima: Math.max(...habitos.map(h => h.mejorStreak || 0), 0),
      diasConProgreso: progreso.length
    });
  } catch (error) {
    console.error("Error al obtener resumen:", error);
    res.status(500).json({ 
      message: 'Error al obtener resumen',
      error: error.message 
    });
  }
});

module.exports = router;