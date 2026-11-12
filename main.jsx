import React, {useEffect, useRef, useState} from 'react';
import {createRoot} from 'react-dom/client';
import './styles.css';

const inicial = {codigo: 'E01', anio: '2026', semana: '35'};
const formato = new Intl.NumberFormat('de-DE', {minimumGroupingDigits: 1});
const numero = (valor) => valor === null ? 'Pendiente' : formato.format(valor).replace(/^-/, '−');
const campos = [
  ['cajas_reales', 'Cajas reales', 'Producción registrada'],
  ['cajas_pronosticadas', 'Pronóstico', 'Estimación semanal'],
  ['diferencia', 'Diferencia', 'Real menos pronóstico'],
];

function Grafico({fila}) {
  const lienzo = useRef(null);
  const [estado, setEstado] = useState('cargando');
  const [controles, setControles] = useState(null);
  useEffect(() => {
    let cancelado = false;
    let limpiar = () => {};
    import('./grafico.mjs').then(({dibujar}) => {
      if (cancelado) return;
      limpiar = dibujar(lienzo.current, [fila.cajas_reales, fila.cajas_pronosticadas], setControles);
      setEstado('listo');
    }).catch(() => {if (!cancelado) setEstado('error');});
    return () => {cancelado = true; limpiar();};
  }, [fila]);
  return <div className="scene">
    {estado === 'listo' && <div className="scene-barra">
      <ul className="scene-leyenda" aria-label="Series del gráfico">
        <li><span aria-hidden="true" /> Reales <strong>{numero(fila.cajas_reales)}</strong></li>
        <li><span aria-hidden="true" /> Pronóstico <strong>{numero(fila.cajas_pronosticadas)}</strong></li>
      </ul>
      {controles && <div className="scene-controles" role="group" aria-label="Controles del gráfico 3D">
        <button type="button" onClick={() => controles.vista('frente')}>Vista frontal</button>
        <button type="button" onClick={() => controles.vista('orbital')}>Restablecer vista</button>
        <button type="button" aria-label="Acercar" onClick={() => controles.zoom(0.8)}>+</button>
        <button type="button" aria-label="Alejar" onClick={() => controles.zoom(1.25)}>−</button>
      </div>}
    </div>}
    <div ref={lienzo} className={estado === 'error' ? 'scene-oculta' : 'scene-lienzo'} />
    {estado === 'cargando' && <p>Cargando gráfico 3D…</p>}
    {estado === 'error' && <p>El gráfico 3D no está disponible. Puedes consultar los valores en el detalle.</p>}
    {controles && estado === 'listo' && <p className="scene-ayuda">
      <span>Ratón: arrastra para girar, usa la rueda para acercar y arrastra con clic derecho para desplazar.</span>
      <span>Táctil: gira con un dedo. Pellizca o arrastra con dos dedos para acercar o desplazar.</span>
      <span>Teclado: enfoca la escena y usa las flechas para desplazar. Mantén Mayús para girar.</span>
    </p>}
  </div>;
}

function App() {
  const [filtros, setFiltros] = useState(inicial);
  const [consulta, setConsulta] = useState({tipo: 'carga', filtros: inicial});
  const [verGrafico, setVerGrafico] = useState(false);
  const pendiente = useRef(null);

  async function consultar(valores) {
    pendiente.current?.abort();
    const ctrl = new AbortController();
    pendiente.current = ctrl;
    setConsulta({tipo: 'carga', filtros: valores});
    setVerGrafico(false);
    try {
      const res = await fetch('/api/comparacion?' + new URLSearchParams(valores), {signal: ctrl.signal});
      const fila = await res.json();
      if (ctrl.signal.aborted) return;
      if (res.ok) setConsulta({tipo: 'listo', fila, filtros: valores});
      else setConsulta({tipo: res.status === 404 ? 'vacio' : 'error', mensaje: fila.detalle, filtros: valores});
    } catch {
      if (!ctrl.signal.aborted) setConsulta({tipo: 'error', mensaje: 'No se pudo consultar. Intenta nuevamente.', filtros: valores});
    }
  }
  useEffect(() => {consultar(inicial); return () => pendiente.current?.abort();}, []);
  const actualizar = ({target}) => setFiltros((f) => ({...f, [target.name]: target.value}));
  const {fila, tipo, mensaje} = consulta;
  const seleccion = consulta.filtros;
  return <>
    <header><div className="shell top">
      <span className="brand"><i aria-hidden="true">E</i> EXFRUMAN</span>
      <span className="tag">PROTOTIPO ACADÉMICO</span>
    </div></header>
    <main className="shell">
      <section className="intro">
        <p className="eyebrow">OPERACIONES / ANÁLISIS SEMANAL</p>
        <h1>Producción semanal</h1>
        <p>Compara las cajas de plátano producidas con el pronóstico de cada empacadora.</p>
      </section>
      <form className="panel filtros" onSubmit={(event) => {event.preventDefault(); consultar(filtros);}}>
        <label>Empacadora<select name="codigo" value={filtros.codigo} onChange={actualizar}><option>E01</option><option>E02</option></select></label>
        <label>Año<input name="anio" type="number" min="2000" max="2099" required value={filtros.anio} onChange={actualizar}/></label>
        <label>Semana ISO<input name="semana" type="number" min="1" max="53" required value={filtros.semana} onChange={actualizar}/></label>
        <button type="submit">Consultar</button>
      </form>
      <section aria-live="polite" aria-busy={tipo === 'carga'}>
        <p className="periodo">{seleccion.codigo} · Año {seleccion.anio} · Semana {seleccion.semana}</p>
        {tipo === 'carga' && <p className="panel mensaje">Cargando consulta…</p>}
        {(tipo === 'vacio' || tipo === 'error') && <p className="panel mensaje">{mensaje}</p>}
        {tipo === 'listo' && <>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {campos.map(([clave,titulo,nota]) => <article className="panel indicador" key={clave}>
              <h2>{titulo}</h2><strong>{numero(fila[clave])}</strong><p>{nota}</p>
            </article>)}
          </div>
          <section className="panel detalle">
            <div className="detalle-cabecera">
              <div><p className="eyebrow">REGISTRO DE LA SEMANA</p><h2>Detalle de la consulta</h2></div>
              <button className="secundario" type="button" aria-expanded={verGrafico} onClick={() => setVerGrafico(!verGrafico)}>
                {verGrafico ? 'Ocultar gráfico 3D' : 'Ver gráfico 3D'}
              </button>
            </div>
            <dl>{campos.map(([clave,titulo]) => <div key={clave}><dt>{titulo}</dt><dd>{numero(fila[clave])}</dd></div>)}</dl>
            {verGrafico && <Grafico fila={fila}/>}
          </section>
        </>}
      </section>
      <footer>Datos ficticios de demostración · Casos verificados en la Tarea 3</footer>
    </main>
  </>;
}

createRoot(document.getElementById('root')).render(<App/>);
