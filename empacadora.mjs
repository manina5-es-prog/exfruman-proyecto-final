import * as THREE from 'three';

export const estaciones = [
  {id: 'empaque', nombre: 'Zona de empaque', posicion: [-4.4, 3.6], objetivo: [-7.8, 1, 0.8]},
  {id: 'oficina', nombre: 'Oficina de planificación', posicion: [5.2, 2.4], objetivo: [8.1, 1.35, 0.3]},
  {id: 'despacho', nombre: 'Muelle de despacho', posicion: [0.5, -5.3], objetivo: [2, 1.2, -9.3]},
];

const controles = {
  KeyW: [0, 1], ArrowUp: [0, 1], KeyS: [0, -1], ArrowDown: [0, -1],
  KeyA: [-1, 0], KeyD: [1, 0],
};

export function crearEmpacadora(contenedor, alAcercarse, alInteractuar) {
  const escena = new THREE.Scene();
  escena.background = new THREE.Color('#adc9ce');
  escena.fog = new THREE.Fog('#adc9ce', 30, 62);
  const camara = new THREE.PerspectiveCamera(62, 1, 0.06, 85);
  camara.rotation.order = 'YXZ';
  const renderer = new THREE.WebGLRenderer({antialias: true});
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
  const canvas = renderer.domElement;
  canvas.tabIndex = 0;
  canvas.setAttribute('aria-label', 'Interior de la empacadora. Usa W, A, S y D para caminar, y E para interactuar.');
  contenedor.append(canvas);

  const recursos = new Set();
  const materiales = new Map();
  const obstaculos = [];
  const unidad = new THREE.BoxGeometry(1, 1, 1);
  recursos.add(unidad);
  function material(color) {
    if (!materiales.has(color)) {
      const nuevo = new THREE.MeshStandardMaterial({color, roughness: 0.8});
      materiales.set(color, nuevo);
      recursos.add(nuevo);
    }
    return materiales.get(color);
  }

  function pieza(x, y, z, ancho, alto, fondo, color, solida = false) {
    const malla = new THREE.Mesh(unidad, material(color));
    malla.position.set(x, y, z);
    malla.scale.set(ancho, alto, fondo);
    escena.add(malla);
    if (solida) obstaculos.push({x, z, ancho: ancho / 2, fondo: fondo / 2});
    return malla;
  }

  function superficie(x, y, z, ancho, alto, giro = 0) {
    const imagen = document.createElement('canvas');
    imagen.width = 768;
    imagen.height = Math.round(768 * alto / ancho);
    const ctx = imagen.getContext('2d');
    const mapa = new THREE.CanvasTexture(imagen);
    mapa.colorSpace = THREE.SRGBColorSpace;
    const geometria = new THREE.PlaneGeometry(ancho, alto);
    const frente = new THREE.MeshBasicMaterial({map: mapa, side: THREE.DoubleSide});
    const plano = new THREE.Mesh(geometria, frente);
    plano.position.set(x, y, z);
    plano.rotation.y = giro;
    escena.add(plano);
    [mapa, geometria, frente].forEach((recurso) => recursos.add(recurso));
    return {ctx, mapa, ancho: imagen.width, alto: imagen.height};
  }

  function rotulo(x, y, z, texto, giro = 0) {
    const {ctx, mapa, ancho, alto} = superficie(x, y, z, 3.35, 0.52, giro);
    ctx.fillStyle = '#163e33';
    ctx.fillRect(0, 0, ancho, alto);
    ctx.fillStyle = '#c5eb87';
    ctx.fillRect(0, 0, 18, alto);
    ctx.fillStyle = '#ffffff';
    ctx.font = '700 44px system-ui';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(texto, ancho / 2 + 6, alto / 2, ancho - 68);
    mapa.needsUpdate = true;
  }

  function caja(x, y, z, color = '#bc874c') {
    pieza(x, y, z, 0.64, 0.42, 0.49, color);
    pieza(x, y, z + 0.248, 0.22, 0.10, 0.01, '#e4d3a3');
    pieza(x, y + 0.213, z, 0.075, 0.008, 0.50, '#dcb376');
  }

  function pallet(x, z, pisos) {
    for (let i = -2; i <= 2; i++) pieza(x, 0.12, z + i * 0.22, 1.55, 0.14, 0.17, '#836043');
    for (let piso = 0; piso < pisos; piso++) {
      for (const dx of [-0.34, 0.34]) {
        for (const dz of [-0.26, 0.26]) caja(x + dx, 0.41 + piso * 0.43, z + dz, piso % 2 ? '#ca9a62' : '#ba864e');
      }
    }
    obstaculos.push({x, z, ancho: 0.78, fondo: 0.57});
  }

  const pared = '#d2dfdb';
  const acero = '#3e6261';
  const verde = '#28725b';
  const piso = '#687e7a';
  pieza(0, -0.11, 0, 25, 0.22, 25, piso);
  pieza(0, 5.9, 0, 25, 0.18, 25, '#a4bdb7');
  pieza(-12, 2.9, 0, 0.24, 5.8, 24, pared);
  pieza(12, 2.9, 0, 0.24, 5.8, 24, pared);
  pieza(0, 2.9, 12, 24, 5.8, 0.24, pared);
  pieza(-6.9, 2.9, -12, 10.2, 5.8, 0.24, pared);
  pieza(8.1, 2.9, -12, 7.8, 5.8, 0.24, pared);
  pieza(1.2, 5.35, -12, 6, 0.9, 0.24, pared);
  pieza(1.2, -0.12, -17, 12, 0.2, 10, '#819795');
  for (const z of [-10, -5, 0, 5, 10]) {
    for (const x of [-11.8, 11.8]) pieza(x, 2.9, z, 0.28, 5.8, 0.34, acero);
    pieza(0, 5.5, z, 24, 0.24, 0.28, acero);
    for (const x of [-6, 0, 6]) pieza(x, 5.34, z, 3.2, 0.08, 0.22, '#edf9ed');
    for (const x of [-11.84, 11.84]) pieza(x, 4.12, z + 1.6, 0.04, 1.02, 2.6, '#a8d3dc');
  }
  for (const x of [-2.2, 2.2]) pieza(x, 0.008, 0, 0.10, 0.012, 23.5, '#e2c369');
  for (let z = -10; z <= 10; z += 2) pieza(0, 0.009, z, 0.10, 0.013, 0.84, '#aebdb2');
  for (let x = -10; x <= 10; x += 2.5) pieza(x, 0.006, 0, 0.015, 0.012, 24, '#5c726f');

  // Línea de clasificación y embalaje.
  pieza(-7.6, 0.07, 1, 6.4, 0.07, 6.7, '#53766b');
  pieza(-7.7, 0.84, 0.9, 1.65, 0.16, 5.5, acero, true);
  for (const x of [-8.4, -7]) {
    for (const z of [-1.5, 3.2]) pieza(x, 0.43, z, 0.12, 0.86, 0.12, acero);
  }
  for (let z = -1.66; z < 3.55; z += 0.19) pieza(-7.7, 0.96, z, 1.46, 0.07, 0.11, '#9bb5ad');
  const fruta = new THREE.TorusGeometry(0.18, 0.053, 6, 12, 2.5);
  recursos.add(fruta);
  for (let i = 0; i < 8; i++) {
    const platano = new THREE.Mesh(fruta, material(i % 2 ? '#eac64a' : '#b4cc56'));
    platano.position.set(-7.7 + (i % 3 - 1) * 0.25, 1.04, -0.9 + i * 0.46);
    platano.rotation.set(-Math.PI / 2, 0, i * 0.7);
    escena.add(platano);
  }
  pallet(-10, 0.4, 3);
  pallet(-9.9, 3.1, 2);
  caja(-7.65, 1.20, -1.46);
  rotulo(-7.7, 2.6, -1.95, '01   ZONA DE EMPAQUE');

  // Oficina con ventana, mesa, silla y pantalla del tablero.
  pieza(8.8, 0.04, 0.2, 5.1, 0.06, 5.1, '#49695c');
  pieza(9.1, 1.35, -2.6, 5.4, 2.7, 0.16, '#87a99c', true);
  pieza(9.2, 0.5, 2.75, 4.7, 1, 0.14, '#87a99c', true);
  for (const x of [6.85, 11.55]) pieza(x, 1.45, 2.75, 0.12, 2.9, 0.16, acero);
  pieza(9.2, 2.9, 2.75, 4.8, 0.16, 0.16, acero);
  pieza(8.3, 0.9, 0, 2.55, 0.13, 1.25, '#be9d71', true);
  for (const x of [7.25, 9.35]) pieza(x, 0.44, 0, 0.17, 0.88, 1.04, '#425c56');
  pieza(8.45, 0.54, -1.08, 0.62, 0.14, 0.60, verde, true);
  pieza(8.45, 0.87, -1.32, 0.62, 0.58, 0.12, verde);
  pieza(8.15, 1.08, 0, 0.12, 0.26, 0.12, '#183b31');
  pieza(8.15, 1.42, 0, 1.26, 0.72, 0.10, '#183b31');
  const monitor = superficie(8.15, 1.42, 0.056, 1.15, 0.61);
  rotulo(8.35, 3.36, 2.88, '02   PLANIFICACIÓN');

  // Andén y vehículo de carga junto a los pallets.
  for (const x of [-1.9, 4.3]) pieza(x, 2.4, -11.82, 0.23, 4.8, 0.33, '#d6ab54');
  pieza(1.2, 4.78, -11.82, 6.4, 0.2, 0.36, '#d6ab54');
  pieza(1.45, 0.75, -10.7, 2.8, 0.25, 4.6, '#2e4e4a', true);
  pieza(1.45, 2.18, -10.7, 2.75, 2.74, 4.48, '#c9ddd5');
  pieza(1.45, 2.18, -8.45, 2.63, 2.55, 0.055, '#91b2a7');
  pieza(1.45, 2.15, -8.414, 0.028, 2.5, 0.03, '#567b70');
  pieza(1.45, 1.48, -13.8, 2.62, 2.15, 1.72, verde);
  pieza(1.45, 2.04, -14.68, 2.38, 0.72, 0.04, '#7eabb9');
  const rueda = new THREE.CylinderGeometry(0.48, 0.48, 0.38, 18);
  recursos.add(rueda);
  for (const x of [0.17, 2.73]) {
    for (const z of [-9.1, -12.35, -14.02]) {
      const llanta = new THREE.Mesh(rueda, material('#243332'));
      llanta.position.set(x, 0.49, z);
      llanta.rotation.z = Math.PI / 2;
      escena.add(llanta);
    }
  }
  pallet(-3.8, -8.2, 3);
  pallet(-5.8, -8.2, 2);
  pallet(4.9, -8.3, 2);
  rotulo(1.2, 4.1, -8.4, '03   MUELLE DE DESPACHO');

  escena.add(new THREE.HemisphereLight('#f0fff6', '#5d7773', 2.1));
  const luz = new THREE.DirectionalLight('#fff1cd', 2);
  luz.position.set(4, 9, 6);
  escena.add(luz);

  function actualizarMonitor(periodo, reales, pronostico) {
    const {ctx, mapa, ancho, alto} = monitor;
    ctx.fillStyle = '#14382f';
    ctx.fillRect(0, 0, ancho, alto);
    ctx.fillStyle = '#c5eb87';
    ctx.font = '700 58px system-ui';
    ctx.fillText('EXFRUMAN', 34, 85);
    ctx.fillStyle = '#f5faf5';
    ctx.font = '500 30px system-ui';
    ctx.fillText(periodo, 34, 135, ancho - 68);
    ctx.font = '600 38px system-ui';
    ctx.fillText('Reales  ' + reales, 34, 240, ancho - 68);
    ctx.fillText('Pronóstico  ' + pronostico, 34, 315, ancho - 68);
    mapa.needsUpdate = true;
    render();
  }

  const teclas = new Set();
  let cercana;
  let arrastre;
  let anterior = performance.now();

  function render() {
    renderer.render(escena, camara);
  }

  function comprobarEstacion() {
    const estacion = estaciones.find(({posicion: [x, z]}) => Math.hypot(x - camara.position.x, z - camara.position.z) < 2.45);
    if (estacion?.id !== cercana) {
      cercana = estacion?.id;
      alAcercarse(cercana);
    }
  }

  function mirar(desplazamientoX, desplazamientoY) {
    camara.rotation.y -= desplazamientoX * 0.004;
    camara.rotation.x = THREE.MathUtils.clamp(camara.rotation.x - desplazamientoY * 0.004, -1.05, 1.05);
    render();
  }

  function enfocar(posicion, objetivo) {
    teclas.clear();
    camara.position.set(posicion[0], 1.68, posicion[1]);
    camara.lookAt(...objetivo);
    comprobarEstacion();
    render();
  }

  function libre(x, z) {
    return Math.abs(x) < 11.5 && Math.abs(z) < 11.5 && obstaculos.every(
      (objeto) => Math.abs(x - objeto.x) > objeto.ancho + 0.28 || Math.abs(z - objeto.z) > objeto.fondo + 0.28,
    );
  }

  function cuadro(ahora) {
    const tiempo = Math.min(0.045, (ahora - anterior) / 1000);
    anterior = ahora;
    let lateral = 0;
    let avance = 0;
    for (const tecla of teclas) {
      const [x, z] = controles[tecla];
      lateral += x;
      avance += z;
    }
    if (!lateral && !avance) return;
    const paso = 3.8 * tiempo / Math.hypot(lateral, avance);
    const seno = Math.sin(camara.rotation.y);
    const coseno = Math.cos(camara.rotation.y);
    const {x, z} = camara.position;
    const destinoX = x + (lateral * coseno - avance * seno) * paso;
    const destinoZ = z - (avance * coseno + lateral * seno) * paso;
    if (libre(destinoX, z)) camara.position.x = destinoX;
    if (libre(camara.position.x, destinoZ)) camara.position.z = destinoZ;
    comprobarEstacion();
    render();
  }

  function alPulsar(evento) {
    if (evento.code in controles) {
      evento.preventDefault();
      teclas.add(evento.code);
    } else if (evento.code === 'ArrowLeft' || evento.code === 'ArrowRight') {
      evento.preventDefault();
      mirar(evento.code === 'ArrowLeft' ? -28 : 28, 0);
    } else if (evento.code === 'KeyE' && !evento.repeat && cercana) {
      alInteractuar(cercana);
    }
  }
  const alSoltar = (evento) => teclas.delete(evento.code);
  const detener = () => teclas.clear();
  function comenzarArrastre(evento) {
    if (evento.button !== 0 || arrastre !== undefined) return;
    canvas.focus({preventScroll: true});
    canvas.setPointerCapture(evento.pointerId);
    arrastre = {id: evento.pointerId, x: evento.clientX, y: evento.clientY};
  }
  function duranteArrastre(evento) {
    if (evento.pointerId !== arrastre?.id) return;
    mirar(evento.clientX - arrastre.x, evento.clientY - arrastre.y);
    arrastre = {id: evento.pointerId, x: evento.clientX, y: evento.clientY};
  }
  function terminarArrastre(evento) {
    if (evento.pointerId === arrastre?.id) arrastre = undefined;
  }

  canvas.addEventListener('keydown', alPulsar);
  canvas.addEventListener('keyup', alSoltar);
  canvas.addEventListener('blur', detener);
  window.addEventListener('blur', detener);
  canvas.addEventListener('pointerdown', comenzarArrastre);
  canvas.addEventListener('pointermove', duranteArrastre);
  canvas.addEventListener('lostpointercapture', terminarArrastre);

  function ajustar() {
    const ancho = Math.max(1, contenedor.clientWidth);
    const alto = Math.max(1, contenedor.clientHeight);
    camara.aspect = ancho / alto;
    camara.updateProjectionMatrix();
    renderer.setSize(ancho, alto, false);
    render();
  }
  const observador = new ResizeObserver(ajustar);
  observador.observe(contenedor);
  enfocar([0, 9.8], [-1.3, 1.1, -4]);
  ajustar();
  renderer.setAnimationLoop(cuadro);

  return {
    actualizarMonitor,
    enfocarEstacion(id) {
      const estacion = estaciones.find((item) => item.id === id);
      if (estacion) enfocar(estacion.posicion, estacion.objetivo);
    },
    mover(tecla, activa) {
      if (activa) teclas.add(tecla);
      else teclas.delete(tecla);
    },
    detener,
    enfocarLienzo() { canvas.focus({preventScroll: true}); },
    cerrar() {
      renderer.setAnimationLoop(null);
      observador.disconnect();
      window.removeEventListener('blur', detener);
      recursos.forEach((recurso) => recurso.dispose());
      renderer.dispose();
      renderer.forceContextLoss();
      canvas.remove();
    },
  };
}
