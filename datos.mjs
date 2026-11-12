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
const certificadoSupabase = '-----BEGIN CERTIFICATE-----\nMIIDxDCCAqygAwIBAgIUbLxMod62P2ktCiAkxnKJwtE9VPYwDQYJKoZIhvcNAQEL\nBQAwazELMAkGA1UEBhMCVVMxEDAOBgNVBAgMB0RlbHdhcmUxEzARBgNVBAcMCk5l\ndyBDYXN0bGUxFTATBgNVBAoMDFN1cGFiYXNlIEluYzEeMBwGA1UEAwwVU3VwYWJh\nc2UgUm9vdCAyMDIxIENBMB4XDTIxMDQyODEwNTY1M1oXDTMxMDQyNjEwNTY1M1ow\nazELMAkGA1UEBhMCVVMxEDAOBgNVBAgMB0RlbHdhcmUxEzARBgNVBAcMCk5ldyBD\nYXN0bGUxFTATBgNVBAoMDFN1cGFiYXNlIEluYzEeMBwGA1UEAwwVU3VwYWJhc2Ug\nUm9vdCAyMDIxIENBMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAqQXW\nQyHOB+qR2GJobCq/CBmQ40G0oDmCC3mzVnn8sv4XNeWtE5XcEL0uVih7Jo4Dkx1Q\nDmGHBH1zDfgs2qXiLb6xpw/CKQPypZW1JssOTMIfQppNQ87K75Ya0p25Y3ePS2t2\nGtvHxNjUV6kjOZjEn2yWEcBdpOVCUYBVFBNMB4YBHkNRDa/+S4uywAoaTWnCJLUi\ncvTlHmMw6xSQQn1UfRQHk50DMCEJ7Cy1RxrZJrkXXRP3LqQL2ijJ6F4yMfh+Gyb4\nO4XajoVj/+R4GwywKYrrS8PrSNtwxr5StlQO8zIQUSMiq26wM8mgELFlS/32Uclt\nNaQ1xBRizkzpZct9DwIDAQABo2AwXjALBgNVHQ8EBAMCAQYwHQYDVR0OBBYEFKjX\nuXY32CztkhImng4yJNUtaUYsMB8GA1UdIwQYMBaAFKjXuXY32CztkhImng4yJNUt\naUYsMA8GA1UdEwEB/wQFMAMBAf8wDQYJKoZIhvcNAQELBQADggEBAB8spzNn+4VU\ntVxbdMaX+39Z50sc7uATmus16jmmHjhIHz+l/9GlJ5KqAMOx26mPZgfzG7oneL2b\nVW+WgYUkTT3XEPFWnTp2RJwQao8/tYPXWEJDc0WVQHrpmnWOFKU/d3MqBgBm5y+6\njB81TU/RG2rVerPDWP+1MMcNNy0491CTL5XQZ7JfDJJ9CCmXSdtTl4uUQnSuv/Qx\nCea13BX2ZgJc7Au30vihLhub52De4P/4gonKsNHYdbWjg7OWKwNv/zitGDVDB9Y2\nCMTyZKG3XEu5Ghl1LEnI3QmEKsqaCLv12BnVjbkSeZsMnevJPs1Ye6TjjJwdik5P\no/bKiIz+Fq8=\n-----END CERTIFICATE-----';
const certificado = conexionSegura ? certificadoSupabase : null;
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
