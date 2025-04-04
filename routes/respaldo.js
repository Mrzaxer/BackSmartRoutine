const express = require("express");
const mongoose = require("mongoose");
const router = express.Router();
const archiver = require("archiver");
const fs = require("fs");
const path = require("path");

router.get("/", async (req, res) => {
  try {
    // 1. Configurar el archivo ZIP
    const archive = archiver('zip', {
      zlib: { level: 9 } // Máxima compresión
    });

    // 2. Configurar los headers de la respuesta
    res.attachment('mongo-backup-' + new Date().toISOString().split('T')[0] + '.zip');
    archive.pipe(res);

    // 3. Obtener todas las colecciones
    const collections = await mongoose.connection.db.listCollections().toArray();
    
    // 4. Procesar cada colección
    for (let collection of collections) {
      const collectionName = collection.name;
      
      // Excluir colecciones del sistema (opcional)
      if (collectionName.startsWith('system.')) continue;
      
      const data = await mongoose.connection.db
        .collection(collectionName)
        .find()
        .toArray();

      // Agregar al ZIP como archivo JSON
      archive.append(JSON.stringify(data, null, 2), { 
        name: `${collectionName}.json` 
      });
    }

    // 5. Agregar metadatos (opcional)
    const metadata = {
      date: new Date().toISOString(),
      dbName: mongoose.connection.name,
      collections: collections.map(c => c.name)
    };
    archive.append(JSON.stringify(metadata, null, 2), { name: 'metadata.json' });

    // 6. Finalizar el archivo ZIP
    archive.finalize();

  } catch (error) {
    console.error("Error al generar el respaldo:", error);
    res.status(500).json({ 
      error: "Error al generar el respaldo",
      details: error.message 
    });
  }
});

module.exports = router;