import * as THREE from 'three';

export function dibujar(contenedor, valores) {
  const escena = new THREE.Scene();
  escena.background = new THREE.Color('#edf4ee');
  const camara = new THREE.PerspectiveCamera(38, 1, 0.1, 40);
  camara.position.set(5, 5, 8);
  camara.lookAt(0, 1.3, 0);
  const renderer = new THREE.WebGLRenderer({antialias: true});
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  contenedor.replaceChildren(renderer.domElement);
  const escala = Math.max(1500, ...valores.filter(v => v !== null));
  const recursos = [];
  function caja(ancho, alto, fondo, color, x, y) {
    const geo = new THREE.BoxGeometry(ancho, alto, fondo);
    const mat = new THREE.MeshStandardMaterial({color});
    const malla = new THREE.Mesh(geo, mat);
    malla.position.set(x, y, 0);
    escena.add(malla);
    recursos.push(geo, mat);
  }
  caja(4, 0.1, 2, '#b8c8bc', 0, -0.05);
  valores.forEach((v,i) => {
    if (v === null || v === 0) return;
    const h = 3 * v / escala;
    caja(0.85, h, 0.85, ['#236046', '#94be64'][i], i ? 0.85 : -0.85, h / 2);
  });
  escena.add(new THREE.HemisphereLight('#ffffff', '#8a9d90', 2));
  const luz = new THREE.DirectionalLight('#ffffff', 2);
  luz.position.set(3, 6, 5);
  escena.add(luz);
  function render() {
    const width = Math.max(1, contenedor.clientWidth);
    const height = Math.min(260, Math.round(width * 0.72));
    camara.aspect = width / height;
    camara.updateProjectionMatrix();
    renderer.setSize(width, height);
    renderer.render(escena, camara);
  }
  const observer = new ResizeObserver(render);
  observer.observe(contenedor);
  render();
  return () => {
    observer.disconnect();
    recursos.forEach((r) => r.dispose());
    renderer.dispose();
    renderer.domElement.remove();
  };
}
