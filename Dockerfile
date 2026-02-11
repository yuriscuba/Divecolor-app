# 1. Usar Node 18 Alpine (ligero y rápido)
FROM node:18-alpine

# 2. Crear directorio de trabajo
WORKDIR /app

# 3. Copiar archivos de dependencias
COPY package.json ./

# 4. Instalar dependencias (incluyendo Express que añadimos antes)
RUN npm install

# 5. Copiar el resto del código del proyecto
COPY . .

# 6. ¡PASO CLAVE!: Construir la aplicación (Generar la carpeta /dist)
# Sin esto, verás el error de "file or directory not found"
RUN npm run build

# 7. Exponer el puerto que configuramos en server.js (3000)
EXPOSE 3000

# 8. Arrancar el servidor de Express que tiene los encabezados de seguridad
CMD ["node", "server.js"]

