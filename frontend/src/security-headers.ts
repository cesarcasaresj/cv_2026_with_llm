import { randomBytes } from 'node:crypto';
import type { RequestHandler } from 'express';
import helmet from 'helmet';

/**
 * Cabeceras de seguridad de las páginas (no de la API: esa las pone el backend).
 *
 * Content-Security-Policy con nonce: Angular escribe en el HTML tres scripts en línea (el contrato de
 * eventos para la hidratación, su arranque y el que activa la hoja de estilos crítica). Cada respuesta
 * genera un nonce nuevo y `addScriptNonce` se lo pone a esos scripts; cualquier otro script en línea
 * (por ejemplo, uno inyectado por un XSS) no lo tiene y el navegador no lo ejecuta.
 *
 * - style-src 'unsafe-inline': Angular inserta los estilos de cada componente en <style> en tiempo de ejecución.
 * - img-src data: blob:: texturas de three.js y SVG en línea.
 * - frame-ancestors 'none' + X-Frame-Options: nadie puede meter el sitio (ni /login) en un iframe (clickjacking).
 * - HSTS lo pone Caddy, que es quien sirve HTTPS (deploy/vps/Caddyfile).
 */
export function securityHeaders(options: { dev: boolean }): RequestHandler[] {
  const assignNonce: RequestHandler = (_req, res, next) => {
    res.locals['cspNonce'] = randomBytes(16).toString('base64');
    next();
  };

  const headers = helmet({
    contentSecurityPolicy: {
      useDefaults: false,
      directives: {
        defaultSrc: ["'self'"],
        // helmet tipa `res` como la respuesta de Node; en Express es la misma, con `locals`
        scriptSrc: ["'self'", (_req, res) => `'nonce-${(res as unknown as { locals: Record<string, string> }).locals['cspNonce']}'`],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:', 'blob:'],
        fontSrc: ["'self'", 'data:'],
        // En desarrollo, Vite recarga la página por WebSocket
        connectSrc: options.dev ? ["'self'", 'ws:', 'wss:'] : ["'self'"],
        workerSrc: ["'self'", 'blob:'],
        manifestSrc: ["'self'"],
        objectSrc: ["'none'"],
        baseUri: ["'self'"],
        formAction: ["'self'"],
        frameAncestors: ["'none'"],
      },
    },
    strictTransportSecurity: false,
    xFrameOptions: { action: 'deny' },
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
    // Los enlaces a GitHub o LinkedIn abren otra pestaña: con same-origin-allow-popups siguen funcionando
    crossOriginOpenerPolicy: { policy: 'same-origin-allow-popups' },
  });

  // Permissions-Policy: el sitio no usa cámara, micrófono, pagos, USB… La ubicación solo la pide
  // este mismo origen (el clima de la cabecera, si el visitante lo acepta); nunca un iframe ajeno.
  const permissions: RequestHandler = (_req, res, next) => {
    res.setHeader(
      'Permissions-Policy',
      'camera=(), microphone=(), geolocation=(self), payment=(), usb=(), serial=(), bluetooth=(), magnetometer=(), gyroscope=(), accelerometer=(), browsing-topics=()',
    );
    next();
  };

  return [assignNonce, headers, permissions];
}

/** Añade el nonce a los <script> del HTML que aún no lo tienen (los de Angular, los de datos y el bundle). */
export function addScriptNonce(html: string, nonce: string): string {
  return html.replace(/<script\b(?![^>]*\snonce=)/g, `<script nonce="${nonce}"`);
}
