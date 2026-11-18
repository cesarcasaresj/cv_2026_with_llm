// Arranque del backend en cPanel (Setup Node.js App → "Application startup file": app.cjs).
// Passenger carga este archivo con require(); el servidor compilado es un módulo ES, así que se importa aquí.
// Si algo falla al arrancar (por ejemplo, falta una variable de entorno), el mensaje queda en el log de la app.
import('./dist/server.mjs').catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
