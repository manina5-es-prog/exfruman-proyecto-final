SELECT e.codigo, p.anio, p.semana, r.cajas_reales, p.cajas_pronosticadas
FROM public.pronosticos AS p
JOIN public.empacadoras AS e ON e.id_empacadora = p.id_empacadora
LEFT JOIN public.produccion_semanal AS r
  ON r.id_empacadora = p.id_empacadora AND r.anio = p.anio AND r.semana = p.semana
WHERE e.activa AND e.codigo = $1 AND p.anio = $2 AND p.semana = $3
