# Desarrollo local

Requisitos: Node 22+, Docker Desktop y npm.

1. Copiar `.env.example` a `.env`.
2. Ejecutar `docker compose up -d`.
3. Ejecutar `npm install`.
4. Ejecutar `npm run db:generate`.
5. Ejecutar `npm run db:push`.
6. Ejecutar `npm run dev`.
7. Abrir `http://localhost:3000`.

No utilizar credenciales reales de PAC/CSD en desarrollo local.
