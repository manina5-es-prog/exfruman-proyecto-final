import React, {useEffect, useRef, useState} from 'react';
import {crearEmpacadora, estaciones} from './empacadora.mjs';
import './recorrido.css';

const movimientos = [
  ['KeyW', '↑', 'Avanzar'],
  ['KeyA', '←', 'Caminar a la izquierda'],
  ['KeyS', '↓', 'Retroceder'],
  ['KeyD', '→', 'Caminar a la derecha'],
];

const descripciones = {
  empaque: 'Las cajas pasan de la línea de empaque a los pallets. El tablero permite consultar cuántas se registraron durante la semana.',
  oficina: 'Usa el monitor para comparar la producción registrada con el pronóstico. La selección se aplica a todo el recorrido.',
  despacho: 'El pronóstico sirve para estimar el volumen de carga. Con el dato real, el equipo puede ajustar el espacio previsto para el despacho.',
};

function DatosEstacion({id, fila, numero}) {
  if (id === 'empaque') return <dl className="recorrido-datos">
    <div><dt>Cajas registradas</dt><dd>{numero(fila.cajas_reales)}</dd></div>
  </dl>;

  if (id === 'oficina') return <dl className="recorrido-datos">
    <div><dt>Producción real</dt><dd>{numero(fila.cajas_reales)}</dd></div>
    <div><dt>Pronóstico</dt><dd>{numero(fila.cajas_pronosticadas)}</dd></div>
    <div><dt>Diferencia</dt><dd>{numero(fila.diferencia)}</dd></div>
  </dl>;

  let interpretacion = 'La producción real coincide con el volumen previsto.';
  if (fila.diferencia === null) {
    interpretacion = 'La planificación puede partir del pronóstico. El ajuste queda pendiente hasta que se registre la producción.';
  } else if (fila.diferencia !== 0) {
    const direccion = fila.diferencia < 0 ? 'menos' : 'más';
    interpretacion = 'Se registraron ' + numero(Math.abs(fila.diferencia)) + ' cajas ' + direccion + ' de las previstas.';
  }
  return <>
    <dl className="recorrido-datos">
      <div><dt>Volumen previsto</dt><dd>{numero(fila.cajas_pronosticadas)}</dd></div>
      <div><dt>Cajas registradas</dt><dd>{numero(fila.cajas_reales)}</dd></div>
    </dl>
    <p>{interpretacion}</p>
  </>;
}

export default function Recorrido({consulta, filtros, numero, cerrar}) {
  const marco = useRef(null);
  const motor = useRef(null);
  const [sinEscena, setSinEscena] = useState(false);
  const [cercana, setCercana] = useState(null);
  const [seleccionada, setSeleccionada] = useState(null);
  const {fila, tipo, mensaje, filtros: periodo} = consulta;
  const periodoTexto = periodo.codigo + ' · ' + periodo.anio + ' · Semana ' + periodo.semana;
  const estacion = estaciones.find(({id}) => id === seleccionada);
  const estacionCercana = estaciones.find(({id}) => id === cercana);
  const interactuar = (id) => {
    motor.current?.detener();
    setSeleccionada(id);
  };

  useEffect(() => {
    let escena;
    try {
      escena = crearEmpacadora(marco.current, setCercana, (id) => {
        escena.detener();
        setSeleccionada(id);
      });
      motor.current = escena;
    } catch {
      setSinEscena(true);
    }
    return () => {
      escena?.cerrar();
      motor.current = null;
    };
  }, []);

  useEffect(() => {
    const pendiente = tipo === 'carga' ? 'Consultando…' : 'Sin resultado';
    motor.current?.actualizarMonitor(
      periodoTexto,
      fila ? numero(fila.cajas_reales) : pendiente,
      fila ? numero(fila.cajas_pronosticadas) : pendiente,
    );
  }, [fila, tipo, periodoTexto, numero]);

  return <section className="recorrido panel" aria-labelledby="titulo-recorrido">
    <div className="recorrido-cabecera">
      <div>
        <h2 id="titulo-recorrido">Recorrido de la empacadora</h2>
        <p>{periodoTexto}</p>
      </div>
      <button type="button" className="secundario" onClick={cerrar}>Cerrar recorrido</button>
    </div>

    <nav className="recorrido-estaciones" aria-label="Estaciones del recorrido">
      {estaciones.map(({id, nombre}) => <button
        type="button" key={id} aria-pressed={seleccionada === id}
        onClick={() => {motor.current?.enfocarEstacion(id); interactuar(id);}}
      >{nombre}</button>)}
    </nav>

    <div className="recorrido-cuerpo">
      <div className="recorrido-vista">
        <div ref={marco} className={sinEscena ? 'recorrido-lienzo recorrido-oculto' : 'recorrido-lienzo'} />
        {sinEscena ? <p className="recorrido-aviso">La escena 3D no está disponible en este navegador. Puedes abrir las estaciones con los botones.</p>
          : <>
            <div className="recorrido-indicaciones">
              <span><kbd>W A S D</kbd> para caminar · Arrastra para mirar</span>
              <button type="button" onClick={() => motor.current?.enfocarLienzo()}>Enfocar escena</button>
            </div>
            <div className="recorrido-movimiento" aria-label="Controles de movimiento">
              {movimientos.map(([tecla, simbolo, etiqueta]) => <button
                type="button" key={tecla} aria-label={etiqueta}
                onPointerDown={(evento) => {
                  evento.currentTarget.setPointerCapture(evento.pointerId);
                  motor.current?.mover(tecla, true);
                }}
                onLostPointerCapture={() => motor.current?.mover(tecla, false)}
                onKeyDown={(evento) => {
                  if (evento.key === ' ' || evento.key === 'Enter') {
                    evento.preventDefault();
                    motor.current?.mover(tecla, true);
                  }
                }}
                onKeyUp={() => motor.current?.mover(tecla, false)}
                onBlur={() => motor.current?.mover(tecla, false)}
              >{simbolo}</button>)}
            </div>
            {estacionCercana && <button
              type="button" className="recorrido-interactuar" onClick={() => interactuar(cercana)}
            ><kbd>E</kbd> {cercana === 'oficina' ? 'Abrir monitor' : 'Consultar estación'}</button>}
          </>}
      </div>

      <aside className="recorrido-panel" aria-label="Información de la estación">
        {estacion ? <>
          <h3>{estacion.nombre}</h3>
          <p>{descripciones[seleccionada]}</p>
          {seleccionada === 'oficina' && filtros}
          <div aria-live="polite">
            {fila ? <DatosEstacion id={seleccionada} fila={fila} numero={numero} />
              : <p>{tipo === 'carga' ? 'Consultando producción…' : mensaje}</p>}
          </div>
        </> : <>
          <h3>De la línea de empaque al despacho</h3>
          <p>Recorre la nave y pulsa <kbd>E</kbd> al acercarte a una estación. También puedes ir directamente a cualquiera de las tres paradas.</p>
        </>}
      </aside>
    </div>
  </section>;
}
