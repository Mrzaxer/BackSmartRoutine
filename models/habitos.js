const mongoose = require('mongoose');

const habitoSchema = new mongoose.Schema({
  titulo: { type: String, required: true },
  descripcion: { type: String, default: '' },
  horaObjetivo: { type: String, default: '' },
  duracionMinutos: { type: Number, default: 0 },
  estado: { 
    type: String, 
    enum: ['pendiente', 'activo', 'completado', 'fallado'], 
    default: 'pendiente' 
  },
  comentarios: { type: String, default: '' },
  diasSemana: { 
    type: [String], 
    required: true,
    validate: {
      validator: function(v) {
        return v && v.length > 0;
      },
      message: 'Debe seleccionar al menos un día para el hábito'
    }
  },
  usuarioId: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', required: true },
  fechaInicio: { type: Date, default: Date.now },
  meta: { 
    tipo: { type: String, enum: ['veces', 'minutos', 'dias'], default: 'veces' },
    valor: { type: Number, default: 1 }
  },
  streak: { type: Number, default: 0 }, // Racha actual
  mejorStreak: { type: Number, default: 0 } // Mejor racha histórica
}, { timestamps: true });

// Método para calcular el progreso del hábito
habitoSchema.methods.calcularProgreso = async function() {
  const ProgresoHabito = mongoose.model('ProgresoHabito');
  const completados = await ProgresoHabito.countDocuments({ 
    habitoId: this._id, 
    completado: true 
  });
  
  return {
    totalDias: Math.floor((new Date() - this.fechaInicio) / (1000 * 60 * 60 * 24)) + 1,
    completados,
    porcentaje: Math.round((completados / this.meta.valor) * 100) || 0,
    streak: this.streak,
    mejorStreak: this.mejorStreak
  };
};

module.exports = mongoose.model('Habito', habitoSchema);