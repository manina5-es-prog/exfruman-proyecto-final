BEGIN;

CREATE TABLE public.empacadoras (
    id_empacadora integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    codigo varchar(12) NOT NULL UNIQUE,
    nombre varchar(100) NOT NULL,
    activa boolean NOT NULL DEFAULT true
);

CREATE TABLE public.produccion_semanal (
    id_produccion integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_empacadora integer NOT NULL REFERENCES public.empacadoras,
    anio integer NOT NULL CHECK (anio BETWEEN 1 AND 9999),
    semana integer NOT NULL,
    cajas_reales integer NOT NULL CHECK (cajas_reales >= 0),
    CONSTRAINT produccion_periodo_unico UNIQUE (id_empacadora, anio, semana),
    CONSTRAINT produccion_semana_iso CHECK (
        semana BETWEEN 1 AND EXTRACT(WEEK FROM make_date(anio, 12, 28))
    )
);

CREATE TABLE public.pronosticos (
    id_pronostico integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_empacadora integer NOT NULL REFERENCES public.empacadoras,
    anio integer NOT NULL CHECK (anio BETWEEN 1 AND 9999),
    semana integer NOT NULL,
    cajas_pronosticadas integer NOT NULL CHECK (cajas_pronosticadas >= 0),
    CONSTRAINT pronostico_periodo_unico UNIQUE (id_empacadora, anio, semana),
    CONSTRAINT pronostico_semana_iso CHECK (
        semana BETWEEN 1 AND EXTRACT(WEEK FROM make_date(anio, 12, 28))
    )
);

ALTER TABLE public.empacadoras ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.produccion_semanal ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pronosticos ENABLE ROW LEVEL SECURITY;

COMMIT;
