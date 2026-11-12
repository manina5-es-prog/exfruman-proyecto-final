import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';

const colores = ['#30c494', '#d3e870'];
const formato = new Intl.NumberFormat('es-BO');

export function dibujar(contenedor, valores, configurar = () => {}) {
  const escena = new THREE.Scene();
  escena.background = new THREE.Color('#112c26');
  const camara = new THREE.PerspectiveCamera(38, 1, 0.1, 60);
  const renderer = new THREE.WebGLRenderer({antialias: true});
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  const lienzo = renderer.domElement;
  lienzo.tabIndex = 0;
  lienzo.setAttribute('aria-label', 'Escena 3D de producción. Usa Mayús y las flechas para girar.');
  contenedor.replaceChildren(lienzo);

  const controles = new OrbitControls(camara, lienzo);
  controles.minDistance = 3.2;
  controles.maxDistance = 19;
  controles.minPolarAngle = 0.08;
  controles.maxPolarAngle = Math.PI / 2 - 0.025;
  controles.cursor.set(0, 1.4, 0);
  controles.maxTargetRadius = 3;
  controles.listenToKeyEvents(lienzo);

  const recursos = [];
  const maximo = Math.max(1500, ...valores.filter(Number.isFinite));
  const paso = 500 * Math.ceil(maximo / 1500);
  const altura = (cajas) => cajas / paso;

  function caja(ancho, alto, fondo, color, x, y) {
    const geometria = new THREE.BoxGeometry(ancho, alto, fondo);
    const material = new THREE.MeshStandardMaterial({color, roughness: 0.42});
    const malla = new THREE.Mesh(geometria, material);
    malla.position.set(x, y, 0);
    escena.add(malla);
    recursos.push(geometria, material);
    return malla;
  }

  function etiqueta(texto, x, y, z) {
    const imagen = document.createElement('canvas');
    imagen.width = 256;
    imagen.height = 80;
    const contexto = imagen.getContext('2d');
    contexto.font = '600 46px system-ui, sans-serif';
    contexto.textAlign = 'center';
    contexto.textBaseline = 'middle';
    contexto.fillStyle = '#dbece2';
    contexto.fillText(texto, 128, 40);
    const textura = new THREE.CanvasTexture(imagen);
    textura.colorSpace = THREE.SRGBColorSpace;
    const material = new THREE.SpriteMaterial({map: textura, depthTest: false});
    const sprite = new THREE.Sprite(material);
    sprite.position.set(x, y, z);
    sprite.scale.set(0.82, 0.26, 1);
    escena.add(sprite);
    recursos.push(textura, material);
  }

  caja(4.8, 0.12, 3.2, '#294d40', 0, -0.06);
  const cuadricula = new THREE.GridHelper(4.8, 12, '#4a7766', '#355b4d');
  cuadricula.scale.z = 3.2 / 4.8;
  cuadricula.position.y = 0.008;
  escena.add(cuadricula);
  recursos.push(cuadricula.geometry, cuadricula.material);

  const puntos = [];
  for (let nivel = 0; nivel <= 3; nivel++) {
    puntos.push(new THREE.Vector3(-2.35, nivel, -1.5), new THREE.Vector3(2.35, nivel, -1.5));
    etiqueta(formato.format(nivel * paso), -2.7, nivel, -1.5);
  }
  puntos.push(new THREE.Vector3(-2.35, 0, -1.5), new THREE.Vector3(-2.35, 3, -1.5));
  const guias = new THREE.BufferGeometry().setFromPoints(puntos);
  const materialGuias = new THREE.LineBasicMaterial({color: '#55796a'});
  escena.add(new THREE.LineSegments(guias, materialGuias));
  recursos.push(guias, materialGuias);

  valores.forEach((valor, indice) => {
    if (valor === null) return;
    const x = indice === 0 ? -0.92 : 0.92;
    const h = altura(valor);
    const barra = caja(1, Math.max(h, 0.045), 1, colores[indice], x, Math.max(h, 0.045) / 2);
    const bordes = new THREE.EdgesGeometry(barra.geometry);
    const materialBordes = new THREE.LineBasicMaterial({color: '#e4f7d8', transparent: true, opacity: 0.42});
    barra.add(new THREE.LineSegments(bordes, materialBordes));
    recursos.push(bordes, materialBordes);
    etiqueta(formato.format(valor), x, h + 0.24, 0);
  });

  escena.add(new THREE.HemisphereLight('#e8fff5', '#345044', 1.9));
  const luz = new THREE.DirectionalLight('#fff7da', 2.2);
  luz.position.set(4, 7, 5);
  escena.add(luz);

  const objetivo = new THREE.Vector3(0, 1.42, 0);
  function render() {
    renderer.render(escena, camara);
  }

  function vista(tipo) {
    controles.target.copy(objetivo);
    if (tipo === 'frente') camara.position.set(0, 2.65, 9.4);
    else camara.position.set(5.8, 4.7, 7.5);
    controles.update();
    render();
  }

  function zoom(factor) {
    const desplazamiento = camara.position.clone().sub(controles.target);
    const distancia = THREE.MathUtils.clamp(
      desplazamiento.length() * factor, controles.minDistance, controles.maxDistance,
    );
    camara.position.copy(controles.target).add(desplazamiento.setLength(distancia));
    controles.update();
    render();
  }

  function ajustarLienzo() {
    const ancho = Math.max(1, contenedor.clientWidth);
    const alto = Math.max(1, contenedor.clientHeight);
    camara.aspect = ancho / alto;
    camara.fov = camara.aspect < 1.15
      ? THREE.MathUtils.radToDeg(2 * Math.atan(Math.tan(THREE.MathUtils.degToRad(21)) / camara.aspect))
      : 38;
    camara.updateProjectionMatrix();
    renderer.setSize(ancho, alto, false);
    render();
  }

  controles.addEventListener('change', render);
  vista('orbital');
  ajustarLienzo();
  const observer = new ResizeObserver(ajustarLienzo);
  observer.observe(contenedor);
  configurar({vista, zoom});

  return () => {
    observer.disconnect();
    controles.dispose();
    recursos.forEach((recurso) => recurso.dispose());
    renderer.dispose();
    lienzo.remove();
  };
}
