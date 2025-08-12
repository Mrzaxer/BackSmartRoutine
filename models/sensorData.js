const mongoose = require('mongoose');

const sensorSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  tipo_sensor: { type: String, required: true },
  valor: { type: Number, required: true },
  unidad: { type: String, required: true },
  timestamp: { type: String, required: true }
});

module.exports = mongoose.model('SensorData', sensorSchema, 'datos_sensores');
