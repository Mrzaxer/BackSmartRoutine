// index.js
const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');
const usuariosRoutes = require('./routes/usuariosRoutes');
const respaldoRouter = require('./routes/respaldo');
const sensoresRoutes = require('./routes/sensores');
const progresoRouter = require('./routes/progreso');
const habitosRouter = require('./routes/habitos');
dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Rutas externas
app.use('/api/respaldo', respaldoRouter);
app.use('/api/usuarios', usuariosRoutes);
app.use('/api/sensores', sensoresRoutes);
app.use('/api/progreso', progresoRouter);
app.use('/api/habitos', habitosRouter);

// Conexión a MongoDB
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('✅ Conectado a MongoDB'))
  .catch((err) => console.error('❌ Error al conectar a MongoDB:', err));


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Servidor corriendo en el puerto ${PORT}`));
