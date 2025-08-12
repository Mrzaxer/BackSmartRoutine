// routes/usuarioRoutes.js
const express = require("express");
const router = express.Router();
const Usuario = require("../models/usuario");
const { cifrarVigenere, descifrarVigenere } = require("../utils/crypto");
const jwt = require("jsonwebtoken");
const multer = require('multer');
const path = require('path');

// ✅ Obtener todos los usuarios
router.get("/", async (req, res) => {
  try {
    const usuarios = await Usuario.find();
    res.json(usuarios);
  } catch (error) {
    res.status(500).json({ message: "Error al obtener usuarios", error });
  }
});

// ✅ Obtener usuario por ID
router.get("/:id", async (req, res) => {
  try {
    const usuario = await Usuario.findById(req.params.id);
    if (!usuario) return res.status(404).json({ message: "Usuario no encontrado" });
    res.json(usuario);
  } catch (error) {
    res.status(500).json({ message: "Error al obtener usuario", error });
  }
});

// ✅ Registrar usuario (con Vigenère)
router.post('/registrar', async (req, res) => {
  const {
    nombre,
    email,
    telefono,
    password,
    fecha_nacimiento,
    genero,
    rol
  } = req.body;

  // Validación básica
  if (!nombre || !email || !password) {
    return res.status(400).json({ message: "Faltan datos obligatorios" });
  }

  try {
    // Cifrar contraseña
    const passwordCifrada = cifrarVigenere(
      password,
      process.env.VIGENERE_KEY || "ClaveSecreta123"
    );

    // Crear nuevo usuario con los campos del modelo
    const nuevoUsuario = new Usuario({
      nombre,
      email: email.toLowerCase(), // Normalizar email a minúsculas
      telefono: telefono || null,
      password: passwordCifrada,
      fecha_nacimiento: fecha_nacimiento ? new Date(fecha_nacimiento) : null,
      genero: genero || null,
      rol: rol || 'usuario', // Valor por defecto
    });

    await nuevoUsuario.save();

    res.status(201).json({ message: "Usuario registrado correctamente" });
  } catch (error) {
    console.error('Error al registrar usuario:', error); // <-- Imprime el error completo
    res.status(500).json({ message: "Error al registrar usuario", error: error.message });
  }
});

// ✅ Actualizar usuario
router.put("/:id", async (req, res) => {
  try {
    const { nombre, email, telefono, password, fecha_nacimiento, genero, rol } = req.body;
    const datosActualizados = { nombre, email, telefono, fecha_nacimiento, genero, rol };

    if (password) {
      datosActualizados.password = cifrarVigenere(
        password,
        process.env.VIGENERE_KEY || "ClaveSecreta123"
      );
    }

    const usuario = await Usuario.findByIdAndUpdate(req.params.id, datosActualizados, {
      new: true,
    });

    if (!usuario) return res.status(404).json({ message: "Usuario no encontrado" });
    res.json(usuario);
  } catch (error) {
    res.status(500).json({ message: "Error al actualizar usuario", error });
  }
});

// ✅ Eliminar usuario
router.delete("/:id", async (req, res) => {
  try {
    const usuario = await Usuario.findByIdAndDelete(req.params.id);
    if (!usuario) return res.status(404).json({ message: "Usuario no encontrado" });
    res.json({ message: "Usuario eliminado correctamente" });
  } catch (error) {
    res.status(500).json({ message: "Error al eliminar usuario", error });
  }
});

// --- LOGIN ---
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password)
    return res.status(400).json({ message: 'Email y contraseña son requeridos' });

  try {
    const usuario = await Usuario.findOne({ email: email.toLowerCase() });
    if (!usuario)
      return res.status(401).json({ message: 'Credenciales inválidas' });

    // Descifrar contraseña almacenada
    const passwordDescifrada = descifrarVigenere(
      usuario.password,
      process.env.VIGENERE_KEY || "ClaveSecreta123"
    );

    if (password !== passwordDescifrada)
      return res.status(401).json({ message: 'Credenciales inválidas' });

    // Generar token JWT
    const payload = {
      id: usuario._id,
      nombre: usuario.nombre,
      email: usuario.email,
      rol: usuario.rol,
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET || "MiSecretoJWT", {
      expiresIn: "12h",
    });

    res.json({
      message: 'Login exitoso',
      token,
      usuario: {
        id: usuario._id,
        nombre: usuario.nombre,
        email: usuario.email,
        rol: usuario.rol,
      },
    });
  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ message: 'Error interno en login' });
  }
});

// ✅ Añadir logro
router.post("/:id/logros", async (req, res) => {
  try {
    const { titulo, descripcion } = req.body;
    const usuario = await Usuario.findById(req.params.id);
    if (!usuario) return res.status(404).json({ message: "Usuario no encontrado" });

    usuario.logros.push({ titulo, descripcion });
    await usuario.save();
    res.json(usuario.logros);
  } catch (error) {
    res.status(500).json({ message: "Error al añadir logro", error });
  }
});

// ✅ Añadir hábito
router.post("/:id/habitos", async (req, res) => {
  try {
    const { nombre } = req.body;
    const usuario = await Usuario.findById(req.params.id);
    if (!usuario) return res.status(404).json({ message: "Usuario no encontrado" });

    usuario.habitos.push({ nombre });
    await usuario.save();
    res.json(usuario.habitos);
  } catch (error) {
    res.status(500).json({ message: "Error al añadir hábito", error });
  }
});

// ✅ Completar hábito y sumar experiencia
router.put("/:id/habitos/:habitoId/completar", async (req, res) => {
  try {
    const usuario = await Usuario.findById(req.params.id);
    if (!usuario) return res.status(404).json({ message: "Usuario no encontrado" });

    const habito = usuario.habitos.id(req.params.habitoId);
    if (!habito) return res.status(404).json({ message: "Hábito no encontrado" });

    habito.completado = true;
    usuario.experiencia += 20;

    if (usuario.experiencia >= usuario.xp_para_siguiente) {
      usuario.nivel += 1;
      usuario.experiencia = 0;
      usuario.xp_para_siguiente += 50;
    }

    await usuario.save();
    res.json({ message: "Hábito completado", usuario });
  } catch (error) {
    res.status(500).json({ message: "Error al completar hábito", error });
  }
});

// ✅ Eliminar hábito
router.delete("/:id/habitos/:habitoId", async (req, res) => {
  try {
    const usuario = await Usuario.findById(req.params.id);
    if (!usuario) return res.status(404).json({ message: "Usuario no encontrado" });

    usuario.habitos = usuario.habitos.filter(
      h => h._id.toString() !== req.params.habitoId
    );
    await usuario.save();
    res.json(usuario.habitos);
  } catch (error) {
    res.status(500).json({ message: "Error al eliminar hábito", error });
  }
});

// Configuración de Multer para subir avatares
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'public/uploads/avatars');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `${req.params.id}-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    
    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('Solo se permiten imágenes (JPEG, JPG, PNG)'));
  }
});

// Actualizar avatar de usuario
router.put('/:id/avatar', upload.single('avatar'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No se subió ningún archivo' });
    }

    const avatarPath = `/uploads/avatars/${req.file.filename}`;
    const usuario = await Usuario.findByIdAndUpdate(
      req.params.id,
      { avatar: avatarPath },
      { new: true }
    );

    if (!usuario) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    res.json({ avatar: usuario.avatar });
  } catch (error) {
    console.error('Error al actualizar avatar:', error);
    res.status(500).json({ message: 'Error al actualizar avatar', error: error.message });
  }
});

// Actualizar configuración de usuario
router.put('/:id/configuracion', async (req, res) => {
  try {
    const { tema, notificaciones, recordatorios } = req.body;
    const usuario = await Usuario.findByIdAndUpdate(
      req.params.id,
      { 
        configuracion: { 
          tema, 
          notificaciones, 
          recordatorios 
        } 
      },
      { new: true }
    );

    if (!usuario) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    res.json(usuario.configuracion);
  } catch (error) {
    console.error('Error al actualizar configuración:', error);
    res.status(500).json({ message: 'Error al actualizar configuración', error: error.message });
  }
});

// Cambiar contraseña
router.put('/:id/password', async (req, res) => {
  try {
    const { passwordActual, nuevoPassword } = req.body;
    const usuario = await Usuario.findById(req.params.id);

    if (!usuario) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    // Descifrar y verificar contraseña actual
    const passwordDescifrada = descifrarVigenere(
      usuario.password,
      process.env.VIGENERE_KEY || "ClaveSecreta123"
    );

    if (passwordActual !== passwordDescifrada) {
      return res.status(400).json({ message: 'Contraseña actual incorrecta' });
    }

    // Validar nueva contraseña
    if (nuevoPassword.length < 8) {
      return res.status(400).json({ message: 'La contraseña debe tener al menos 8 caracteres' });
    }

    // Cifrar y guardar nueva contraseña
    const passwordCifrada = cifrarVigenere(
      nuevoPassword,
      process.env.VIGENERE_KEY || "ClaveSecreta123"
    );

    usuario.password = passwordCifrada;
    await usuario.save();

    res.json({ message: 'Contraseña actualizada correctamente' });
  } catch (error) {
    console.error('Error al cambiar contraseña:', error);
    res.status(500).json({ message: 'Error al cambiar contraseña', error: error.message });
  }
});

module.exports = router;
