import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Headers para COOP/COEP (para FFmpeg/WASM)
app.use((req, res, next) => {
  res.header("Cross-Origin-Opener-Policy", "same-origin");
  res.header("Cross-Origin-Embedder-Policy", "require-corp");
  res.header("Cross-Origin-Resource-Policy", "cross-origin");
  next();
});

// Servir archivos estáticos de dist
app.use(express.static(path.join(__dirname, 'dist')));

// SPA fallback - todas las rutas a index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

const port = process.env.PORT || 10000;
app.listen(port, () => {
  console.log(`🚀 DiveColor Pro listo en puerto ${port}`);
});
