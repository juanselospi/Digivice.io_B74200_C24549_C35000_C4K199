// combate por contacto: si dos digimon se tocan, los dos se hacen daño mientras sigan pegados.
// el daño sale de la etapa del que pega (8/12/16 %), no del tamaño

import { ETAPAS } from './config.js';
import { aplicarDano } from './eliminacion.js';
import { distancia } from './geometria.js';
import { jugadoresVivos } from './partida.js';
import { radioJugador } from './progreso.js';

/** @typedef {import('./estado.js').EstadoJuego} EstadoJuego */
/** @typedef {import('./estado.js').Jugador} Jugador */

/**
 * Revisa si dos digimon se estan tocando (los circulos se cruzan).
 * @param {Jugador} uno Un jugador.
 * @param {Jugador} otro Otro jugador.
 * @returns {boolean} Si estan en contacto.
 */
export function seTocan(uno, otro) {
  return distancia(uno, otro) < radioJugador(uno) + radioJugador(otro);
}

/**
 * Daño que le hace el atacante a la victima en este cuadro: el ataque de su
 * etapa por segundo, sobre el puntaje maximo de la victima.
 * @param {Jugador} atacante Quien pega.
 * @param {Jugador} victima Quien recibe.
 * @param {number} dt Segundos desde el cuadro anterior.
 * @returns {number} Hp que pierde la victima.
 */
export function danoContacto(atacante, victima, dt) {
  return ETAPAS[atacante.etapa].ataque * victima.puntajeMaximo * dt;
}

/**
 * Los dos se pegan al mismo tiempo. Se calculan ambos daños antes de aplicarlos,
 * asi el orden de la lista no decide quien pega primero.
 * @param {EstadoJuego} estado Estado de la partida.
 * @param {Jugador} uno Un jugador.
 * @param {Jugador} otro Otro jugador.
 * @param {number} dt Segundos desde el cuadro anterior.
 */
function chocar(estado, uno, otro, dt) {
  const danoAOtro = danoContacto(uno, otro, dt);
  const danoAUno = danoContacto(otro, uno, dt);
  aplicarDano(estado, otro, danoAOtro, uno.id);
  aplicarDano(estado, uno, danoAUno, otro.id);
}

/**
 * Paso de logica: revisa cada par de jugadores vivos y aplica el daño a los que se tocan.
 * @param {EstadoJuego} estado Estado de la partida.
 * @param {number} dt Segundos desde el cuadro anterior.
 */
export function actualizarCombate(estado, dt) {
  const vivos = jugadoresVivos(estado);
  // cada par una sola vez: el segundo siempre va despues del primero en la lista
  for (let primero = 0; primero < vivos.length; primero++) {
    for (let segundo = primero + 1; segundo < vivos.length; segundo++) {
      const [uno, otro] = [vivos[primero], vivos[segundo]];
      if (seTocan(uno, otro)) chocar(estado, uno, otro, dt);
    }
  }
}
