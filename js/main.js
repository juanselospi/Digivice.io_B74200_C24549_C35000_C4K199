// punto de entrada: arma el estado, conecta los eventos y corre el loop del juego.
// cada cuadro corre los pasos de logica y despues los de vista, en orden.

import { DT_MAXIMO, NOMBRE_POR_DEFECTO } from './config.js';
import { crearEstadoInicial } from './estado.js';
import { aplicarEntrada, configurarEntrada } from './entrada.js';
import { actualizarPartida } from './partida.js';
import { actualizarBots } from './bots.js';
import { moverJugadores } from './movimiento.js';
import { actualizarOrbes } from './orbes.js';
import { actualizarZona } from './zona.js';
import { actualizarCombate } from './combate.js';
import { actualizarEspeciales } from './especial.js';
import { crearVistaMapa } from './vista/mapa.js';
import { crearVistaHud } from './vista/hud.js';
import { crearVistaFin } from './vista/fin.js';
import { crearVistaFeedback } from './vista/feedback.js';

/** @typedef {import('./estado.js').EstadoJuego} EstadoJuego */

/**
 * Pasos de lógica, (estado, dt) => void. Solo cambian el estado, nunca el DOM.
 * Para sumar uno se importa y se pone en su lugar de la lista.
 * @type {Array<(estado: EstadoJuego, dt: number) => void>}
 */
const PASOS_LOGICA = [
  aplicarEntrada,
  actualizarBots,
  moverJugadores,
  actualizarOrbes,
  actualizarZona,
  actualizarCombate,
  actualizarEspeciales,
  actualizarPartida,
];

/** @typedef {(estado: EstadoJuego) => void} PasoVista */

/**
 * Arma los pasos de vista, (estado) => void. Solo leen el estado y dibujan.
 * Se arman en el setup porque necesitan los elementos de la página.
 * @param {HTMLCanvasElement} lienzo Canvas del mapa.
 * @returns {PasoVista[]} Pasos de vista en orden.
 */
function crearPasosVista(lienzo) {
  return [
    crearVistaMapa(lienzo),
    crearVistaHud(document),
    crearVistaFin(document),
    crearVistaFeedback(document),
    // persona 4: feedback
  ];
}

/**
 * Corre un cuadro: borra los eventos viejos, aplica la lógica y dibuja.
 * @param {EstadoJuego} estado Estado de la partida.
 * @param {number} dt Segundos desde el cuadro anterior.
 * @param {PasoVista[]} pasosVista Pasos de vista a correr después de la lógica.
 */
function correrCuadro(estado, dt, pasosVista) {
  estado.eventos.length = 0;
  for (const paso of PASOS_LOGICA) paso(estado, dt);
  for (const dibujar of pasosVista) dibujar(estado);
}

/**
 * Arranca el loop con requestAnimationFrame. Se detiene después del cuadro en
 * que termina la partida, así la vista alcanza a mostrar el fin.
 * @param {EstadoJuego} estado Estado de la partida.
 * @param {PasoVista[]} pasosVista Pasos de vista de cada cuadro.
 */
function iniciarLoop(estado, pasosVista) {
  let anterior = performance.now();
  const cuadro = (ahora) => {
    const dt = Math.min((ahora - anterior) / 1000, DT_MAXIMO);
    anterior = ahora;
    correrCuadro(estado, dt, pasosVista);
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
  iniciarLoop(estado, crearPasosVista(lienzo));
}

// el script es async, puede correr antes de que termine de cargar la pagina
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', iniciarJuego);
} else {
  iniciarJuego();
}
