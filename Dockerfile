# 1. EL MOTOR: Dile al chef que use la estufa de "Node" versión 18.
FROM node:18-alpine

# 2. EL ESPACIO: Crea una mesa de trabajo llamada "app" dentro de la nube.
WORKDIR /app

# 3. LA LISTA: Copia el archivo 'package.json' (tu lista de ingredientes).
COPY package.json ./

# 4. PREPARACIÓN: Instala todas las herramientas que tu app necesita.
RUN npm install

# 5. EL PRODUCTO: Copia todo lo demás que tienes en tu carpeta (tus códigos y el .env).
COPY . .

# 6. ENCENDIDO: ¡Dale al botón de "Start" para que la app empiece a funcionar!
CMD ["npm", "start"]
