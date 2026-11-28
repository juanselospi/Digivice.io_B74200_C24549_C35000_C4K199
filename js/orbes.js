// orbes del mapa: salen adentro de la zona segura y se recogen al tocarlos

import { CANTIDAD_ORBES, MAPA, RADIO_ORBE, TIPOS_DATA } from './config.js';
import { nuevoId } from './estado.js';
import { distancia, limitar, puntoEnCirculo } from './geometria.js';
import { jugadoresVivos } from './partida.js';
import { aplicarOrbe, radioJugador } from './progreso.js';
import { estaAfuera } from './zona.js';

/** @typedef {import('./estado.js').EstadoJuego} EstadoJuego */
/** @typedef {import('./estado.js').Jugador} Jugador */
/** @typedef {import('./estado.js').Orbe} Orbe */
/** @typedef {import('./estado.js').TipoData} TipoData */

/**
 * Tipo de data al azar.
 * @returns {TipoData} Uno de los tipos de TIPOS_DATA.
 */
function tipoAleatorio() {
  return TIPOS_DATA[Math.floor(Math.random() * TIPOS_DATA.length)];
}

/**
 * Crea un orbe en un lugar al azar de la zona segura, sin salirse del mapa.
 * @param {EstadoJuego} estado Estado de la partida.
 * @returns {Orbe} Orbe nuevo.
 */
function crearOrbe(estado) {
  const punto = puntoEnCirculo(estado.zona);
  return {
    id: nuevoId(estado),
    x: limitar(punto.x, RADIO_ORBE, MAPA.ancho - RADIO_ORBE),
    y: limitar(punto.y, RADIO_ORBE, MAPA.alto - RADIO_ORBE),
    tipo: tipoAleatorio(),
  };
}

/**
 * Crea orbes hasta que haya CANTIDAD_ORBES. En el primer cuadro llena el mapa.
 * @param {EstadoJuego} estado Estado de la partida.
 */
function reponerOrbes(estado) {
  while (estado.orbes.length < CANTIDAD_ORBES) {
    estado.orbes.push(crearOrbe(estado));
  }
}

/**
 * Revisa si un jugador esta tocando un orbe.
 * @param {Jugador} jugador Jugador a revisar.
 * @param {Orbe} orbe Orbe a revisar.
 * @returns {boolean} Si se tocan.
 */
function tocaOrbe(jugador, orbe) {
  return distancia(jugador, orbe) < radioJugador(jugador) + RADIO_ORBE;
}

/**
 * Le da cada orbe tocado al jugador que lo toca y lo quita del mapa.
 * @param {EstadoJuego} estado Estado de la partida.
 */
function recolectarOrbes(estado) {
  const vivos = jugadoresVivos(estado);
  const quedan = [];
  for (const orbe of estado.orbes) {
    const jugador = vivos.find((vivo) => tocaOrbe(vivo, orbe));
    if (jugador) aplicarOrbe(estado, jugador, orbe);
    else quedan.push(orbe);
  }
  estado.orbes = quedan;
}

/**
 * Paso de logica: recoge los orbes tocados y repone los que faltan.
 * @param {EstadoJuego} estado Estado de la partida.
 */
export function actualizarOrbes(estado) {
  estado.orbes = estado.orbes.filter((orbe) => !estaAfuera(orbe, estado.zona));
  recolectarOrbes(estado);
  reponerOrbes(estado);
}
