const express = require('express');
const bcrypt = require('bcrypt');
const Usuario = require('../models/usuario'); // Asegúrate de usar la ruta correcta
const router = express.Router();

// Ruta para registrar un nuevo usuario
router.post('/register', async (req, res) => {
  const { nombre, telefono, correo, password, rol } = req.body;

  // Validar campos obligatorios
  if (!nombre || !telefono || !correo || !password) {
    return res.status(400).json({ message: 'Todos los campos son obligatorios.' });
  }

  try {
    // Verificar si el teléfono o correo ya están registrados
    const usuarioExistente = await Usuario.findOne({ 
      $or: [{ telefono }, { correo }]
    });

    if (usuarioExistente) {
      return res.status(400).json({ message: 'El número de teléfono o correo ya están registrados.' });
    }

    // Hashear la contraseña
    const hashedPassword = await bcrypt.hash(password, 10);

    // Crear un nuevo usuario
    const nuevoUsuario = new Usuario({
      nombre,
      telefono,
      correo,
      password: hashedPassword,
      rol: rol || 'usuario', // Si no se especifica, será 'usuario'
    });

    // Guardar en la base de datos
    const usuarioGuardado = await nuevoUsuario.save();
    res.status(201).json({ message: 'Usuario registrado con éxito.', usuario: usuarioGuardado });
  } catch (err) {
    res.status(500).json({ message: 'Error al registrar el usuario.', error: err.message });
  }
});

// Ruta para iniciar sesión
router.post('/login', async (req, res) => {
  const { correo, password } = req.body;

  // Validar campos obligatorios
  if (!correo || !password) {
    return res.status(400).json({ message: 'Correo y contraseña son obligatorios.' });
  }

  try {
    // Verificar si el usuario existe
    const usuario = await Usuario.findOne({ correo });
    if (!usuario) {
      return res.status(404).json({ message: 'Usuario no encontrado.' });
    }

    // Verificar la contraseña
    const esValida = await bcrypt.compare(password, usuario.password);
    if (!esValida) {
      return res.status(401).json({ message: 'Contraseña incorrecta.' });
    }

    // Devolver información del usuario (sin incluir la contraseña)
    res.status(200).json({ 
      message: 'Inicio de sesión exitoso.', 
      usuario: {
        id: usuario._id,
        nombre: usuario.nombre,
        telefono: usuario.telefono,
        correo: usuario.correo,
        rol: usuario.rol,
      }
    });
  } catch (err) {
    res.status(500).json({ message: 'Error al iniciar sesión.', error: err.message });
  }
});

module.exports = router;
