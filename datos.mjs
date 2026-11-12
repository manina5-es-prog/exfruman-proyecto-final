import {readFile} from 'node:fs/promises';
import pg from 'pg';

const registros = [
  {codigo: 'E01', anio: 2026, semana: 35, cajas_reales: 1200, cajas_pronosticadas: 1250},
  {codigo: 'E01', anio: 2026, semana: 36, cajas_reales: null, cajas_pronosticadas: 1280},
  {codigo: 'E02', anio: 2026, semana: 35, cajas_reales: 900, cajas_pronosticadas: 940},
];

const {DATABASE_URL} = process.env;
if (DATABASE_URL !== undefined && !DATABASE_URL.trim()) {
  throw new Error('DATABASE_URL está definida pero vacía.');
}

// La cadena de Supabase se mantiene como secreto de entorno. El certificado se
// carga por separado para que Node valide el servidor también en Render.
const conexionSegura = DATABASE_URL ? new URL(DATABASE_URL) : null;
conexionSegura?.searchParams.delete('sslmode');
conexionSegura?.searchParams.delete('sslrootcert');
const certificado = conexionSegura
  ? await readFile(process.env.DATABASE_CA_PATH || '/etc/secrets/supabase-ca.crt', 'utf8')
  : null;
const pool = DATABASE_URL ? new pg.Pool({
  connectionString: conexionSegura.toString(),
  ssl: {ca: certificado, rejectUnauthorized: true},
  max: 5,
  connectionTimeoutMillis: 5000,
  statement_timeout: 5000,
}) : null;
pool?.on('error', (error) => console.error('Conexión PostgreSQL inactiva:', error.code));
const consulta = pool ? await readFile(new URL('./comparacion.sql', import.meta.url), 'utf8') : null;

export async function buscarComparacion(codigo, anio, semana) {
  if (pool) {
    const {rows} = await pool.query(consulta, [codigo, anio, semana]);
    return rows[0];
  }
  return registros.find((fila) => fila.codigo === codigo && fila.anio === anio && fila.semana === semana);
}
