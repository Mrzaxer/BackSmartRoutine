const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');
const { cifrarVigenere, descifrarVigenere } = require('./utils/crypto'); // Cambio aquí
const Usuario = require('./models/usuario');
const respaldoRouter = require('./routes/respaldo');
const habitosRouter = require('./routes/habitos');
dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());
app.use('/api/habitos', habitosRouter); 
// Conectar a MongoDB
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('Conectado a MongoDB'))
  .catch((err) => console.error('Error al conectar a MongoDB:', err));

// Ruta para registrar un nuevo usuario con Vigenère
app.post('/register', async (req, res) => {
  const { nombre, telefono, correo, password, rol } = req.body;

  if (!nombre || !telefono || !correo || !password) {
    return res.status(400).json({ message: 'Faltan datos' });
  }

  try {
    // Cifrar la contraseña con Vigenère
    const passwordCifrada = cifrarVigenere(password, process.env.VIGENERE_KEY || 'ClaveSecreta123');
    
    const newUser = new Usuario({
      nombre,
      telefono,
      correo,
      password: passwordCifrada, // Guardamos el texto cifrado
      rol,
    });

    await newUser.save();
    res.status(201).json({ message: 'Usuario registrado correctamente' });
  } catch (error) {
    res.status(500).json({ message: 'Error al registrar el usuario', error });
  }
});

// Ruta para iniciar sesión con Vigenère
app.post('/login', async (req, res) => {
  const { correo, password } = req.body;

  if (!correo || !password) {
    return res.status(400).json({ message: 'Correo y contraseña son obligatorios.' });
  }

  try {
    const usuario = await Usuario.findOne({ correo });
    if (!usuario) {
      return res.status(404).json({ message: 'Usuario no encontrado.' });
    }

    // Descifrar la contraseña almacenada y comparar
    const passwordDescifrada = descifrarVigenere(usuario.password, process.env.VIGENERE_KEY || 'ClaveSecreta123');
    
    if (password === passwordDescifrada) {
      res.status(200).json({
        message: 'Inicio de sesión exitoso.',
        usuario: {
          id: usuario._id,
          nombre: usuario.nombre,
          telefono: usuario.telefono,
          correo: usuario.correo,
          rol: usuario.rol,
        },
      });
    } else {
      res.status(401).json({ message: 'Contraseña incorrecta.' });
    }
  } catch (err) {
    res.status(500).json({ message: 'Error al iniciar sesión.', error: err.message });
  }
});

// Ruta para el respaldo
app.use('/api/respaldo', respaldoRouter);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor corriendo en el puerto ${PORT}`));