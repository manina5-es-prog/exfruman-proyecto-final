# Tablero semanal de EXFRUMAN

Prototipo académico que compara la producción real de cajas de plátano con pronósticos ficticios por empacadora, año y semana ISO. Usa React, Vite y Three.js en el frontend, Node.js para la API y PostgreSQL como fuente configurable.

## Ejecutar desde cero

1. Instalar Node.js 22.12 o 24 con npm.
2. Ejecutar `npm ci`, luego `npm run build` y `npm start`.
3. Abrir http://localhost:3000 para ver el tablero y http://localhost:3000/docs para probar Swagger.
4. Consultar `GET /api/comparacion?codigo=E01&anio=2026&semana=36`. Debe devolver 1.280 cajas pronosticadas y valores nulos para producción real y diferencia.

## Configurar Supabase

Crear un proyecto académico vacío. Ejecutar `01_esquema.sql` una sola vez y después `02_datos_demo.sql` en SQL Editor. El esquema conserva las restricciones de las tareas 1 y 3 y activa RLS. La carga puede repetirse sin sobrescribir registros existentes.

Ejecutar una vez 03_lectura.sql para crear un rol de grupo con permiso exclusivo de lectura sobre las tres tablas. Otorgar ese rol a un usuario de conexión de la API mediante GRANT exfruman_lector TO nombre_del_usuario. Configurar la cadena PostgreSQL en la variable de servidor `DATABASE_URL` y reiniciar. Para una red sin IPv6 usar el pooler de sesión. Mantener la verificación TLS y usar un rol con permiso de lectura para el servicio y las políticas RLS correspondientes. No colocar credenciales en el frontend, Vercel ni Git. Si la variable no existe, el servidor usa los tres registros de demostración. Si existe y falla la conexión, responde HTTP 503.

## Desplegar Render y Vercel

- Render. El archivo `render.yaml` define el servicio Node.js y `/health`. Conectar el repositorio, desplegar y comprobar `/docs` y una consulta semanal. Configurar `DATABASE_URL` en Render si se desea habilitar PostgreSQL.
- Vercel. Importar la raíz del proyecto como Vite. Antes de desplegar, sustituir el destino en `vercel.json` por el dominio del servicio Render que se acaba de verificar. La configuración inicial apunta al tablero histórico de la Tarea 5 para permitir una demostración con sus datos ficticios. Confirmar la consulta de la semana 36 desde el dominio de Vercel.

## Resultados esperados

| Caso | HTTP | Resultado |
|---|---:|---|
| E01, 2026, 35 | 200 | 1200 reales, 1250 pronosticadas, diferencia -50 |
| E02, 2026, 35 | 200 | 900 reales, 940 pronosticadas, diferencia -40 |
| E01, 2026, 36 | 200 | 1280 pronosticadas, real y diferencia nulas |
| E01, 2026, 37 | 404 | Periodo sin pronóstico |
| E01, 2025, 53 | 422 | Semana ISO no válida para ese año |



