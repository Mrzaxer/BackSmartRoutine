const mongoose = require('mongoose');
const { Schema } = mongoose;

const LogroSchema = new Schema({
  titulo: String,
  descripcion: String,
  fecha: { type: Date, default: Date.now },
  icono: String,
  tipo: String
});

const HabitoSchema = new Schema({
  nombre: String,
  completado: { type: Boolean, default: false },
  fechaCompletado: Date
});

const ConfiguracionSchema = new Schema({
  tema: { type: String, enum: ['claro', 'oscuro'], default: 'claro' },
  notificaciones: { type: Boolean, default: true },
  recordatorios: { type: Boolean, default: true }
});

const UsuarioSchema = new Schema({
  nombre: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  telefono: { type: String },
  password: { type: String, required: true },
  fecha_nacimiento: { type: Date },
  genero: { type: String, enum: ['masculino', 'femenino', 'otro', 'prefiero_no_decir'] },
  rol: { type: String, enum: ['usuario', 'admin'], default: 'usuario' },
  fecha_registro: { type: Date, default: Date.now },
  ultimo_login: { type: Date },
  avatar: { type: String, default: '/avatar-default.png' },
  logros: [LogroSchema],
  habitos: [HabitoSchema],
  configuracion: { type: ConfiguracionSchema, default: () => ({}) },
  nivel: { type: Number, default: 1 },
  experiencia: { type: Number, default: 0 },
  xp_para_siguiente: { type: Number, default: 100 },
  rachaActual: { type: Number, default: 0 },
  mejorRacha: { type: Number, default: 0 }
});

// Middleware para normalizar email
UsuarioSchema.pre('save', function(next) {
  if (this.isModified('email')) {
    this.email = this.email.toLowerCase();
  }
  next();
});

module.exports = mongoose.model('Usuario', UsuarioSchema);