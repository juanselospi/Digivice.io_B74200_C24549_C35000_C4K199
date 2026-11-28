// puntaje, tamaño y evolucion de cada jugador

import {
  ETAPA_MAXIMA, FACTOR_RADIO, HP_POR_ORBE, META_EVOLUCION, RADIO_BASE, RADIO_MAXIMO,
} from './config.js';
import { registrarEvento } from './estado.js';

/** @typedef {import('./estado.js').EstadoJuego} EstadoJuego */
/** @typedef {import('./estado.js').Jugador} Jugador */
/** @typedef {import('./estado.js').Orbe} Orbe */
/** @typedef {import('./estado.js').TipoData} TipoData */

/**
 * Radio del Digimon, sale del hp. Sirve para dibujar y para los choques.
 * @param {Jugador} jugador Jugador a medir.
 * @returns {number} Radio en unidades del mapa.
 */
export function radioJugador(jugador) {
  return Math.min(RADIO_BASE + Math.sqrt(Math.max(0, jugador.hp)) * FACTOR_RADIO, RADIO_MAXIMO);
}

/**
 * Suma el hp del orbe y guarda el puntaje maximo.
 * @param {Jugador} jugador Quien agarro el orbe.
 */
function sumarPuntaje(jugador) {
  jugador.hp += HP_POR_ORBE;
  jugador.puntajeMaximo = Math.max(jugador.puntajeMaximo, jugador.hp);
}

/**
 * Revisa si el orbe le llena la barra: tiene que ser de su tipo y no estar en la ultima etapa.
 * @param {Jugador} jugador Quien agarro el orbe.
 * @param {TipoData} tipo Tipo del orbe.
 * @returns {boolean} Si cuenta para la evolucion.
 */
function llenaEvolucion(jugador, tipo) {
  return tipo === jugador.tipoEvolucion && jugador.etapa < ETAPA_MAXIMA;
}

/**
 * Sube la barra y si se llena pasa a la siguiente etapa.
 * @param {EstadoJuego} estado Estado de la partida.
 * @param {Jugador} jugador Quien agarro el orbe.
 */
function avanzarEvolucion(estado, jugador) {
  jugador.progresoEvolucion++;
  if (jugador.progresoEvolucion < META_EVOLUCION) return;
  jugador.etapa++;
  // en la ultima etapa la barra se queda llena
  jugador.progresoEvolucion = jugador.etapa < ETAPA_MAXIMA ? 0 : META_EVOLUCION;
  registrarEvento(estado, 'evoluciono', jugador.id);
}

/**
 * Lo que pasa cuando un jugador agarra un orbe.
 * @param {EstadoJuego} estado Estado de la partida.
 * @param {Jugador} jugador Quien lo agarro.
 * @param {Orbe} orbe Orbe agarrado.
 */
export function aplicarOrbe(estado, jugador, orbe) {
  sumarPuntaje(jugador);
  if (llenaEvolucion(jugador, orbe.tipo)) avanzarEvolucion(estado, jugador);
  registrarEvento(estado, 'recolecto', jugador.id);
}
