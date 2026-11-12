BEGIN;
INSERT INTO public.empacadoras (codigo, nombre)
VALUES ('E01', 'Empacadora de prueba 01'), ('E02', 'Empacadora de prueba 02')
ON CONFLICT (codigo) DO NOTHING;

INSERT INTO public.produccion_semanal (id_empacadora, anio, semana, cajas_reales)
SELECT e.id_empacadora, v.anio, v.semana, v.cajas
FROM (VALUES ('E01', 2026, 35, 1200), ('E02', 2026, 35, 900)) AS v(codigo, anio, semana, cajas)
JOIN public.empacadoras AS e ON e.codigo = v.codigo
ON CONFLICT (id_empacadora, anio, semana) DO NOTHING;

INSERT INTO public.pronosticos (id_empacadora, anio, semana, cajas_pronosticadas)
SELECT e.id_empacadora, v.anio, v.semana, v.cajas
FROM (VALUES ('E01', 2026, 35, 1250), ('E01', 2026, 36, 1280),
             ('E02', 2026, 35, 940)) AS v(codigo, anio, semana, cajas)
JOIN public.empacadoras AS e ON e.codigo = v.codigo
ON CONFLICT (id_empacadora, anio, semana) DO NOTHING;
COMMIT;
