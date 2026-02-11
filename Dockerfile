# Usa Node 18 para compatibilidad con ESM
FROM node:18-alpine

WORKDIR /app

# Instala dependencias primero para aprovechar el caché de Docker
COPY package.json ./
RUN npm install

# Copia el código y construye la carpeta /dist
COPY . .
RUN npm run build

# Expone el puerto de Render
EXPOSE 3000

# Ejecuta el servidor de Express que configuramos
CMD ["node", "server.js"]
