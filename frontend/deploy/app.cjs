// Arranque del frontend (SSR) en cPanel (Setup Node.js App → "Application startup file": app.cjs).
// Passenger carga este archivo con require(); el servidor de Angular es un módulo ES, así que se importa aquí.
import('./server/server.mjs').catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
