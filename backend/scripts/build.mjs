// Compila el backend para producción en un solo archivo, dist/server.mjs, con todas sus dependencias dentro.
// En un hosting compartido así no hace falta `npm install` en el servidor: se sube el archivo y las migraciones.
// Uso: npm run build
import { build } from 'esbuild';

await build({
  entryPoints: ['src/main.ts'],
  outfile: 'dist/server.mjs',
  bundle: true,
  platform: 'node',
  format: 'esm',
  target: 'node20',
  sourcemap: true,
  // pg intenta cargar su versión nativa opcional; no se usa
  external: ['pg-native'],
  // Algunas dependencias (express, pg) son CommonJS y usan require(): en un módulo ES hay que recrearlo
  banner: {
    js: "import { createRequire as __createRequire } from 'node:module'; const require = __createRequire(import.meta.url);",
  },
  logLevel: 'info',
});
