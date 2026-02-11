const express = require('express');
const path = require('path');
const app = express();

// Encabezados de seguridad para FFmpeg.wasm
app.use((req, res, next) => {
  res.header("Cross-Origin-Opener-Policy", "same-origin");
  res.header("Cross-Origin-Embedder-Policy", "require-corp");
  next();
});

// Sirve los archivos estáticos de la carpeta 'dist' (la que genera Vite)
app.use(express.static(path.join(__dirname, 'dist')));

// Maneja cualquier ruta devolviendo el index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`DiveColor Pro corriendo en puerto ${port}`);
});
