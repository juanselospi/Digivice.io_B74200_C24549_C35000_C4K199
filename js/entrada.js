// entrada del jugador local: flechas/WASD, barra espaciadora y tap en movil.
// todo se guarda en estado.entrada y cada cuadro se pasa a la intencion del jugador local.

import { jugadorLocal } from './estado.js';

/** @typedef {import('./estado.js').EstadoJuego} EstadoJuego */

/** Dirección [dx, dy] de cada tecla de movimiento (event.code). */
const DIRECCION_TECLA = {
  ArrowUp: [0, -1], KeyW: [0, -1],
  ArrowDown: [0, 1], KeyS: [0, 1],
  ArrowLeft: [-1, 0], KeyA: [-1, 0],
  ArrowRight: [1, 0], KeyD: [1, 0],
};

/** Distancia mínima en px del centro del mapa para que el tap mueva. */
const ZONA_MUERTA_TAP = 10;

/**
 * Hace que el vector mida 1 (o 0), asi en diagonal no se va mas rapido.
 * @param {number} dx Componente horizontal.
 * @param {number} dy Componente vertical.
 * @returns {{dx: number, dy: number}} Vector normalizado.
 */
function normalizar(dx, dy) {
  const largo = Math.hypot(dx, dy);
  return largo === 0 ? { dx: 0, dy: 0 } : { dx: dx / largo, dy: dy / largo };
}

/**
 * Guarda en el estado la dirección que suman las teclas apretadas.
 * @param {EstadoJuego} estado Estado de la partida.
 * @param {Set<string>} teclas Códigos de las teclas de movimiento apretadas.
 */
function actualizarDireccionTeclado(estado, teclas) {
  let dx = 0;
  let dy = 0;
  for (const tecla of teclas) {
    dx += DIRECCION_TECLA[tecla][0];
    dy += DIRECCION_TECLA[tecla][1];
  }
  Object.assign(estado.entrada, normalizar(dx, dy));
}

/**
 * Guarda la dirección desde el centro del mapa (donde está el jugador) hacia el dedo.
 * @param {EstadoJuego} estado Estado de la partida.
 * @param {HTMLCanvasElement} lienzo Canvas del mapa.
 * @param {PointerEvent} evento Evento del tap o del mouse.
 */
function apuntarHacia(estado, lienzo, evento) {
  const caja = lienzo.getBoundingClientRect();
  const dx = evento.clientX - (caja.left + caja.width / 2);
  const dy = evento.clientY - (caja.top + caja.height / 2);
  const cerca = Math.hypot(dx, dy) < ZONA_MUERTA_TAP;
  Object.assign(estado.entrada, cerca ? { dx: 0, dy: 0 } : normalizar(dx, dy));
}

/**
 * Escucha el teclado: movimiento con flechas/WASD y especial con espacio.
 * @param {EstadoJuego} estado Estado de la partida.
 */
function escucharTeclado(estado) {
  const teclas = new Set();
  window.addEventListener('keydown', (evento) => {
    if (evento.code in DIRECCION_TECLA) {
      evento.preventDefault();
      teclas.add(evento.code);
      actualizarDireccionTeclado(estado, teclas);
    } else if (evento.code === 'Space') {
      evento.preventDefault();
      if (!evento.repeat) estado.entrada.especial = true;
    }
  });
  window.addEventListener('keyup', (evento) => {
    if (!teclas.delete(evento.code)) return;
    actualizarDireccionTeclado(estado, teclas);
  });
  // si se sale de la ventana con una tecla apretada, que no se quede pegada
  window.addEventListener('blur', () => {
    teclas.clear();
    actualizarDireccionTeclado(estado, teclas);
  });
}

/**
 * Escucha el tap (o arrastrar con el mouse) sobre el mapa para moverse hacia ese punto.
 * @param {EstadoJuego} estado Estado de la partida.
 * @param {HTMLCanvasElement} lienzo Canvas del mapa.
 */
function escucharTap(estado, lienzo) {
  const soltar = () => Object.assign(estado.entrada, { dx: 0, dy: 0 });
  lienzo.addEventListener('pointerdown', (evento) => {
    lienzo.setPointerCapture(evento.pointerId);
    apuntarHacia(estado, lienzo, evento);
  });
  lienzo.addEventListener('pointermove', (evento) => {
    if (lienzo.hasPointerCapture(evento.pointerId)) apuntarHacia(estado, lienzo, evento);
  });
  lienzo.addEventListener('pointerup', soltar);
  lienzo.addEventListener('pointercancel', soltar);
}

/**
 * Conecta todos los controles del jugador local con el estado.
 * @param {EstadoJuego} estado Estado de la partida.
 * @param {HTMLCanvasElement} lienzo Canvas del mapa.
 * @param {HTMLButtonElement} botonEspecial Botón del ataque especial (para tap en móvil).
 */
export function configurarEntrada(estado, lienzo, botonEspecial) {
  escucharTeclado(estado);
  escucharTap(estado, lienzo);
  botonEspecial.addEventListener('click', () => {
    estado.entrada.especial = true;
  });
}

/**
 * Paso de lógica: copia la entrada a la intención del jugador local. El especial
 * se apaga después de copiarlo, así cada toque lanza un solo ataque.
 * @param {EstadoJuego} estado Estado de la partida.
 */
export function aplicarEntrada(estado) {
  Object.assign(jugadorLocal(estado).intencion, estado.entrada);
  estado.entrada.especial = false;
}
