// temporizador, fase de la partida, deteccion del fin y calculo del ganador.

import { DURACION_PARTIDA } from './config.js';
import { registrarEvento } from './estado.js';

/** @typedef {import('./estado.js').EstadoJuego} EstadoJuego */
/** @typedef {import('./estado.js').Jugador} Jugador */

/**
 * Jugadores que siguen en la partida.
 * @param {EstadoJuego} estado Estado de la partida.
 * @returns {Jugador[]} Los que están vivos.
 */
export function jugadoresVivos(estado) {
  return estado.jugadores.filter((jugador) => jugador.vivo);
}

/**
 * Segundos que lleva la partida.
 * @param {EstadoJuego} estado Estado de la partida.
 * @returns {number} Tiempo transcurrido.
 */
export function tiempoTranscurrido(estado) {
  return DURACION_PARTIDA - estado.tiempoRestante;
}

/**
 * Compara dos jugadores para la tabla: primero los vivos por HP y después los
 * eliminados, el que duró más va más arriba.
 * @param {Jugador} primero Un jugador.
 * @param {Jugador} segundo Otro jugador.
 * @returns {number} Negativo si primero va antes.
 */
function compararPuesto(primero, segundo) {
  if (primero.vivo !== segundo.vivo) return primero.vivo ? -1 : 1;
  if (primero.vivo) return segundo.hp - primero.hp;
  return (segundo.eliminadoEn ?? 0) - (primero.eliminadoEn ?? 0);
}

/**
 * Jugadores ordenados por puesto, para el leaderboard y los modales de fin.
 * No cambia el estado, devuelve una copia ordenada.
 * @param {EstadoJuego} estado Estado de la partida.
 * @returns {Jugador[]} Jugadores del primero al último.
 */
export function clasificacion(estado) {
  return [...estado.jugadores].sort(compararPuesto);
}

/**
 * Baja el reloj de la partida sin pasarse de 0.
 * @param {EstadoJuego} estado Estado de la partida.
 * @param {number} dt Segundos desde el cuadro anterior.
 */
function avanzarReloj(estado, dt) {
  estado.tiempoRestante = Math.max(0, estado.tiempoRestante - dt);
}

/**
 * La partida termina si se acabó el tiempo o queda uno (o ninguno) vivo.
 * @param {EstadoJuego} estado Estado de la partida.
 * @returns {boolean} Si ya terminó.
 */
function seAcabo(estado) {
  return estado.tiempoRestante === 0 || jugadoresVivos(estado).length <= 1;
}

/**
 * Cierra la partida: cambia la fase, guarda al ganador (el primero de la
 * clasificación) y avisa con el evento 'fin'.
 * @param {EstadoJuego} estado Estado de la partida.
 */
function terminarPartida(estado) {
  estado.fase = 'terminada';
  estado.ganadorId = clasificacion(estado)[0].id;
  registrarEvento(estado, 'fin', estado.ganadorId);
}

/**
 * Paso de lógica: avanza el tiempo y revisa si la partida terminó.
 * Va de último en la lista de pasos, después del combate y la zona.
 * @param {EstadoJuego} estado Estado de la partida.
 * @param {number} dt Segundos desde el cuadro anterior.
 */
export function actualizarPartida(estado, dt) {
  if (estado.fase !== 'jugando') return;
  avanzarReloj(estado, dt);
  if (seAcabo(estado)) terminarPartida(estado);
}
