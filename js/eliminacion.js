// todo el daño pasa por aca: combate, especial y zona llaman a aplicarDano.
// asi la eliminacion, el contador del atacante y los eventos quedan en un solo lugar

import { registrarEvento } from './estado.js';
import { tiempoTranscurrido } from './partida.js';

/** @typedef {import('./estado.js').EstadoJuego} EstadoJuego */
/** @typedef {import('./estado.js').Jugador} Jugador */

/**
 * Busca un jugador por id.
 * @param {EstadoJuego} estado Estado de la partida.
 * @param {number} id Id del jugador.
 * @returns {Jugador|undefined} El jugador, o undefined si no existe.
 */
function buscarJugador(estado, id) {
  return estado.jugadores.find((jugador) => jugador.id === id);
}

/**
 * Saca al jugador de la partida y le suma la eliminacion al que lo elimino.
 * Si fue la zona no hay atacante y no se le suma a nadie.
 * @param {EstadoJuego} estado Estado de la partida.
 * @param {Jugador} victima Jugador que llego a 0.
 * @param {number} [atacanteId] Quien lo elimino.
 */
function eliminar(estado, victima, atacanteId) {
  victima.hp = 0;
  victima.vivo = false;
  victima.eliminadoEn = tiempoTranscurrido(estado);
  const atacante = atacanteId === undefined ? undefined : buscarJugador(estado, atacanteId);
  if (atacante) atacante.eliminaciones++;
  registrarEvento(estado, 'eliminado', victima.id, atacanteId);
}

/**
 * Le quita hp a un jugador y lo elimina si llega a 0. A los que ya estan
 * eliminados no les hace nada.
 * @param {EstadoJuego} estado Estado de la partida.
 * @param {Jugador} victima Quien recibe el daño.
 * @param {number} cantidad Hp que pierde.
 * @param {number} [atacanteId] Quien hizo el daño, sin atacante si fue la zona.
 */
export function aplicarDano(estado, victima, cantidad, atacanteId) {
  if (!victima.vivo || cantidad <= 0) return;
  victima.hp -= cantidad;
  registrarEvento(estado, 'golpe', victima.id, atacanteId);
  if (victima.hp <= 0) eliminar(estado, victima, atacanteId);
}
