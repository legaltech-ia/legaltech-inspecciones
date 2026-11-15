# La SPA compilada y servida por nginx. Dos etapas: node solo construye, la
# imagen final no lleva toolchain ni node_modules.

FROM node:22-alpine AS build
WORKDIR /app

# El lock vigente lo escribio npm 11 y node:22-alpine trae npm 10, que lo
# declara fuera de sincronia (pide @emnapi/runtime y esbuild 0.28). Se alinea la
# version del gestor, no se regenera el lock.
RUN npm install -g npm@11.6.2

# package-lock.json primero: la capa de dependencias se reutiliza mientras el
# lock no cambie. npm ci (no install) respeta el lock al pie de la letra.
COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# Vite incrusta las VITE_* en el bundle al construir: no son configurables en
# runtime, hay que fijarlas aqui. /api es relativo, asi que el navegador pega
# contra el mismo origen y lo proxea el nginx de esta misma imagen.
ENV VITE_API_BASE_URL=/api
ENV VITE_ENABLE_MOCKS=false

# "npm run build" encadena "tsc -b && vite build": empaquetar vuelve a ser la
# puerta de tipos del repo. Es la unica que hay — no hay CI, ni hooks, y
# "npm test" es vitest, que transpila con esbuild sin mirar tipos — asi que no
# se degrada a "npx vite build" para desbloquear un build roto: se arreglan los
# tipos.
RUN npm run build

FROM nginx:alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
