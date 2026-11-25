import { Router } from 'express';
import type { GetWeather } from '../../core/usecases/GetWeather';
import type { components } from '../../generated/api';

type WeatherResponse = components['schemas']['Weather'];

function header(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

/** Cloudflare puede enviar la ciudad codificada ("S%C3%A3o%20Paulo"); si no se puede decodificar, se usa tal cual. */
function decodeCity(value: string | undefined): string | undefined {
  if (!value) return undefined;
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

/**
 * Clima del visitante (spec.md, HU-25). La ubicación aproximada viene de las cabeceras que añade Cloudflare
 * ("Add visitor location headers"); con ?lat=&lon=, de lo que el navegador compartió con permiso.
 */
export function weatherRoutes(getWeather: GetWeather): Router {
  const router = Router();

  router.get('/', async (request, response) => {
    const report = await getWeather.execute({
      browser: { lat: request.query['lat'], lon: request.query['lon'] },
      network: {
        lat: header(request.headers['cf-iplatitude']),
        lon: header(request.headers['cf-iplongitude']),
        city: decodeCity(header(request.headers['cf-ipcity'])),
      },
    });
    const body: WeatherResponse = report;
    // Depende de quién pregunta: solo el navegador de esa persona puede guardarla, y poco tiempo
    response.setHeader('Cache-Control', 'private, max-age=600');
    response.json(body);
  });

  return router;
}
