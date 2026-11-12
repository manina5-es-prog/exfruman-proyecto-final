import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname } from 'node:path';
import swagger from 'swagger-ui-dist';
import { buscarComparacion } from './datos.mjs';

const mime = {'.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8'};
const documentacion = {
  '/docs': [new URL('./swagger.html', import.meta.url), mime['.html']],
  '/docs/swagger-ui.css': [swagger.getAbsoluteFSPath() + '/swagger-ui.css', mime['.css']],
  '/docs/swagger-ui-bundle.js': [swagger.getAbsoluteFSPath() + '/swagger-ui-bundle.js', mime['.js']],
  '/openapi.json': [new URL('./openapi.json', import.meta.url), 'application/json; charset=utf-8'],
};
const json = (res, status, value) => {
  res.writeHead(status, {'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store'});
  res.end(JSON.stringify(value));
};

async function consultar(params, res) {
  const codigo = params.get('codigo');
  const anio = Number(params.get('anio'));
  const semana = Number(params.get('semana'));
  if (!['E01', 'E02'].includes(codigo) || !Number.isInteger(anio) || anio < 2000 || anio > 2099 ||
      !Number.isInteger(semana) || semana < 1 || semana > 53) {
    return json(res, 422, {detalle: 'Selecciona una empacadora, un año y una semana válidos.'});
  }
  const enero = new Date(Date.UTC(anio, 0, 1)).getUTCDay();
  const bisiesto = new Date(Date.UTC(anio, 1, 29)).getUTCMonth() === 1;
  if (semana === 53 && !(enero === 4 || (enero === 3 && bisiesto))) {
    return json(res, 422, {detalle: 'Ese año no tiene semana 53 en el calendario ISO.'});
  }
  let fila;
  try {
    fila = await buscarComparacion(codigo, anio, semana);
  } catch (error) {
    console.error('Error en consulta semanal:', error.code);
    return json(res, 503, {detalle: 'La fuente de datos no está disponible. Intenta nuevamente.'});
  }
  if (!fila) return json(res, 404, {detalle: 'No hay pronóstico para esta selección.'});
  const diferencia = fila.cajas_reales === null ? null : fila.cajas_reales - fila.cajas_pronosticadas;
  return json(res, 200, {...fila, diferencia});
}

createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost');
  if (req.method !== 'GET') return json(res, 405, {detalle: 'Método no permitido.'});
  if (url.pathname === '/health') return json(res, 200, {estado: 'ok'});
  if (url.pathname === '/api/comparacion') return consultar(url.searchParams, res);
  if (Object.hasOwn(documentacion, url.pathname)) {
    const [ruta, tipo] = documentacion[url.pathname];
    try {
      const contenido = await readFile(ruta);
      res.writeHead(200, {'Content-Type': tipo});
      return res.end(contenido);
    } catch {
      return json(res, 500, {detalle: 'Documentación no disponible.'});
    }
  }
  const archivo = url.pathname === '/' ? '/index.html' : url.pathname;
  if (archivo !== '/index.html' && !/^\/assets\/[\w.-]+$/.test(archivo)) {
    return json(res, 404, {detalle: 'Ruta no encontrada.'});
  }
  try {
    const contenido = await readFile(new URL('./dist' + archivo, import.meta.url));
    res.writeHead(200, {'Content-Type': mime[extname(archivo)] || 'application/octet-stream',
      'Cache-Control': archivo === '/index.html' ? 'no-cache' : 'public, max-age=31536000, immutable'});
    res.end(contenido);
  } catch (error) {
    return json(res, error.code === 'ENOENT' ? 404 : 500, {detalle: 'Recurso no disponible.'});
  }
}).listen(Number(process.env.PORT || 3000), '0.0.0.0');

