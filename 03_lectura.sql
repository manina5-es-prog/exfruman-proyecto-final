BEGIN;

CREATE ROLE exfruman_lector NOLOGIN;
GRANT USAGE ON SCHEMA public TO exfruman_lector;
GRANT SELECT ON public.empacadoras, public.produccion_semanal, public.pronosticos
TO exfruman_lector;

CREATE POLICY lectura_empacadoras ON public.empacadoras FOR SELECT TO exfruman_lector USING (true);
CREATE POLICY lectura_produccion ON public.produccion_semanal FOR SELECT TO exfruman_lector USING (true);
CREATE POLICY lectura_pronosticos ON public.pronosticos FOR SELECT TO exfruman_lector USING (true);

COMMIT;
