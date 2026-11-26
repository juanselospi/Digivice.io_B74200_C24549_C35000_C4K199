// mueve a cada jugador segun su intencion, sin salirse del mapa

import { MAPA, VELOCIDAD } from './config.js';
import { limitar } from './geometria.js';
import { jugadoresVivos } from './partida.js';
import { radioJugador } from './progreso.js';

/** @typedef {import('./estado.js').EstadoJuego} EstadoJuego */
/** @typedef {import('./estado.js').Jugador} Jugador */

/**
 * Avanza al jugador hacia donde apunta su intencion.
 * @param {Jugador} jugador Jugador a mover.
 * @param {number} dt Segundos desde el cuadro anterior.
 */
function moverJugador(jugador, dt) {
  jugador.x += jugador.intencion.dx * VELOCIDAD * dt;
  jugador.y += jugador.intencion.dy * VELOCIDAD * dt;
}

/**
 * Lo devuelve adentro del mapa si se paso del borde.
 * @param {Jugador} jugador Jugador a revisar.
 */
function limitarAlMapa(jugador) {
  const radio = radioJugador(jugador);
  jugador.x = limitar(jugador.x, radio, MAPA.ancho - radio);
  jugador.y = limitar(jugador.y, radio, MAPA.alto - radio);
}

/**
 * Paso de logica: mueve a todos los jugadores vivos.
 * @param {EstadoJuego} estado Estado de la partida.
 * @param {number} dt Segundos desde el cuadro anterior.
 */
export function moverJugadores(estado, dt) {
  for (const jugador of jugadoresVivos(estado)) {
    moverJugador(jugador, dt);
    limitarAlMapa(jugador);
  }
}
