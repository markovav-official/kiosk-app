FROM node:20-alpine AS builder

WORKDIR /app
ARG VITE_API_URL=http://localhost:8000
ARG VITE_WS_URL=ws://localhost:8000/kiosk-api/ws/monitor
ARG VITE_AUTH_TOKEN=
ENV VITE_API_URL=$VITE_API_URL VITE_WS_URL=$VITE_WS_URL VITE_AUTH_TOKEN=$VITE_AUTH_TOKEN
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
RUN echo 'server { root /usr/share/nginx/html; index index.html; location = /monitor { return 301 /monitor/; } location /monitor/ { alias /usr/share/nginx/html/; try_files $uri $uri/ /monitor/index.html; } }' > /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
