const mongoose = require('mongoose');

const progresoHabitoSchema = new mongoose.Schema({
  habitoId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Habito', 
    required: true 
  },
  usuarioId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Usuario', 
    required: true 
  },
  fecha: { 
    type: Date, 
    required: true,
    default: Date.now 
  },
  completado: { 
    type: Boolean, 
    required: true 
  },
  porcentaje: { 
    type: Number, 
    min: 0, 
    max: 100 
  },
  notas: { 
    type: String 
  }
}, { timestamps: true });

// Índice para búsquedas eficientes
progresoHabitoSchema.index({ habitoId: 1, usuarioId: 1, fecha: 1 });

module.exports = mongoose.model('ProgresoHabito', progresoHabitoSchema);