import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// ACTIVACIÓN DE FFMPEG: Encabezados de aislamiento de origen cruzado
app.use((req, res, next) => {
  res.header("Cross-Origin-Opener-Policy", "same-origin");
  res.header("Cross-Origin-Embedder-Policy", "require-corp");
  // Permite que recursos de otros dominios carguen si tienen CORS
  res.header("Cross-Origin-Resource-Policy", "cross-origin");
  next();
});

// Servir la carpeta generada por el build de Vite
app.use(express.static(path.join(__dirname, 'dist')));

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`🚀 DiveColor Pro listo en puerto ${port}`);
});
