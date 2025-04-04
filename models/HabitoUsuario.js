// models/HabitoUsuario.js
const mongoose = require('mongoose');

const habitoUsuarioSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Usuario',
    required: true
  },
  habitos: [{
    id: { type: Number, required: true },
    nombre: { type: String, required: true },
    categoria: { type: String, required: true }
  }],
  fechaActualizacion: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('HabitoUsuario', habitoUsuarioSchema);