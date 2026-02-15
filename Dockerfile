# Usa Node 18 para compatibilidad con ESM
FROM node:18-alpine

WORKDIR /app

# Instala dependencias primero para aprovechar el caché de Docker
COPY package.json ./
RUN npm install

# INSTALAR EXPRESS EXPLÍCITAMENTE (faltaba en tu package.json)
RUN npm install express

# Copia el código y construye la carpeta /dist
COPY . .
RUN npm run build

# Usa el puerto que asigna Render (no hardcodear 3000)
ENV PORT=10000
EXPOSE 10000

# Ejecuta el servidor de Express
CMD ["node", "server.js"]
