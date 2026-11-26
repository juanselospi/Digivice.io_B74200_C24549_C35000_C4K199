// punto de entrada: arma el estado, conecta los eventos y corre el loop del juego.
// cada cuadro corre los pasos de logica y despues los de vista, en orden.

import { DT_MAXIMO, NOMBRE_POR_DEFECTO } from './config.js';
import { crearEstadoInicial } from './estado.js';
import { aplicarEntrada, configurarEntrada } from './entrada.js';
import { actualizarPartida } from './partida.js';

/** @typedef {import('./estado.js').EstadoJuego} EstadoJuego */

/**
 * Pasos de lógica, (estado, dt) => void. Solo cambian el estado, nunca el DOM.
 * Para sumar uno se importa y se pone en su lugar de la lista.
 * @type {Array<(estado: EstadoJuego, dt: number) => void>}
 */
const PASOS_LOGICA = [
  aplicarEntrada,
  // persona 2: bots, movimiento, orbes y progreso
  // persona 3: combate, especial y zona
  actualizarPartida,
];

/**
 * Pasos de vista, (estado) => void. Solo leen el estado y dibujan.
 * @type {Array<(estado: EstadoJuego) => void>}
 */
const PASOS_VISTA = [
  // persona 4: mapa, hud, fin y feedback
];

/**
 * Corre un cuadro: borra los eventos viejos, aplica la lógica y dibuja.
 * @param {EstadoJuego} estado Estado de la partida.
 * @param {number} dt Segundos desde el cuadro anterior.
 */
function correrCuadro(estado, dt) {
  estado.eventos.length = 0;
  for (const paso of PASOS_LOGICA) paso(estado, dt);
  for (const dibujar of PASOS_VISTA) dibujar(estado);
}

/**
 * Arranca el loop con requestAnimationFrame. Se detiene después del cuadro en
 * que termina la partida, así la vista alcanza a mostrar el fin.
 * @param {EstadoJuego} estado Estado de la partida.
 */
function iniciarLoop(estado) {
  let anterior = performance.now();
  const cuadro = (ahora) => {
    const dt = Math.min((ahora - anterior) / 1000, DT_MAXIMO);
    anterior = ahora;
    correrCuadro(estado, dt);
    if (estado.fase === 'jugando') requestAnimationFrame(cuadro);
  };
  requestAnimationFrame(cuadro);
}

/**
 * Lee el nickname de la URL (juego.html?nickname=...).
 * @returns {string} Nickname del jugador local.
 */
function leerNickname() {
  const nickname = new URLSearchParams(location.search).get('nickname');
  return nickname?.trim() || NOMBRE_POR_DEFECTO;
}

/**
 * Setup del juego: crea el estado, conecta la entrada y arranca el loop.
 */
function iniciarJuego() {
  const estado = crearEstadoInicial(leerNickname());
  const lienzo = /** @type {HTMLCanvasElement} */ (document.getElementById('mapa'));
  const botonEspecial = /** @type {HTMLButtonElement} */ (document.querySelector('.ataque__boton'));
  configurarEntrada(estado, lienzo, botonEspecial);
  iniciarLoop(estado);
}

// el script es async, puede correr antes de que termine de cargar la pagina
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', iniciarJuego);
} else {
  iniciarJuego();
}
