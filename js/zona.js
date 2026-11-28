// zona segura: se cierra por escalones cada INTERVALO_ZONA segundos y hace daño a quien quede afuera.
// en cada escalon se va encogiendo poco a poco hasta el radio que toca, no de golpe

import {
  DANO_ZONA, DURACION_PARTIDA, INTERVALO_ZONA, RADIO_ZONA_INICIAL, RADIO_ZONA_MINIMO,
  VELOCIDAD_CIERRE_ZONA,
} from './config.js';
import { aplicarDano } from './eliminacion.js';
import { distancia } from './geometria.js';
import { jugadoresVivos, tiempoTranscurrido } from './partida.js';

/** @typedef {import('./estado.js').EstadoJuego} EstadoJuego */
/** @typedef {import('./estado.js').Jugador} Jugador */
/** @typedef {import('./estado.js').Zona} Zona */

/** Veces que se cierra la zona. Con 300 s y 60 s son 4: llega al minimo en el ultimo minuto. */
const ESCALONES = Math.floor(DURACION_PARTIDA / INTERVALO_ZONA) - 1;

/**
 * Cuantas veces se ha cerrado la zona hasta ahora.
 * @param {EstadoJuego} estado Estado de la partida.
 * @returns {number} Escalon actual, de 0 a ESCALONES.
 */
function escalonActual(estado) {
  return Math.min(Math.floor(tiempoTranscurrido(estado) / INTERVALO_ZONA), ESCALONES);
}

/**
 * Radio al que tiene que llegar la zona en el escalon actual.
 * @param {EstadoJuego} estado Estado de la partida.
 * @returns {number} Radio objetivo.
 */
function radioObjetivo(estado) {
  const avance = escalonActual(estado) / ESCALONES;
  return RADIO_ZONA_INICIAL - (RADIO_ZONA_INICIAL - RADIO_ZONA_MINIMO) * avance;
}

/**
 * Segundos que faltan para el siguiente cierre, para el HUD.
 * @param {EstadoJuego} estado Estado de la partida.
 * @returns {number|null} Segundos, o null si ya no se va a cerrar mas.
 */
export function tiempoParaCerrar(estado) {
  if (escalonActual(estado) >= ESCALONES) return null;
  return INTERVALO_ZONA - (tiempoTranscurrido(estado) % INTERVALO_ZONA);
}

/**
 * Revisa si el jugador esta afuera de la zona segura (se mide desde su centro).
 * @param {Jugador} jugador Jugador a revisar.
 * @param {Zona} zona Zona segura.
 * @returns {boolean} Si esta afuera.
 */
export function estaAfuera(jugador, zona) {
  return distancia(jugador, zona) > zona.radio;
}

/**
 * Encoge la zona hacia el radio del escalon actual sin pasarse.
 * @param {EstadoJuego} estado Estado de la partida.
 * @param {number} dt Segundos desde el cuadro anterior.
 */
function cerrarZona(estado, dt) {
  const radio = estado.zona.radio - VELOCIDAD_CIERRE_ZONA * dt;
  estado.zona.radio = Math.max(radio, radioObjetivo(estado));
}

/**
 * Le quita vida a los que estan afuera: DANO_ZONA de su puntaje maximo por segundo.
 * No hay atacante, asi que esa eliminacion no se le suma a nadie.
 * @param {EstadoJuego} estado Estado de la partida.
 * @param {number} dt Segundos desde el cuadro anterior.
 */
function danarAfuera(estado, dt) {
  for (const jugador of jugadoresVivos(estado)) {
    if (estaAfuera(jugador, estado.zona)) {
      aplicarDano(estado, jugador, DANO_ZONA * jugador.puntajeMaximo * dt);
    }
  }
}

/**
 * Paso de logica: cierra la zona y le hace daño a los que quedaron afuera.
 * @param {EstadoJuego} estado Estado de la partida.
 * @param {number} dt Segundos desde el cuadro anterior.
 */
export function actualizarZona(estado, dt) {
  cerrarZona(estado, dt);
  danarAfuera(estado, dt);
}
