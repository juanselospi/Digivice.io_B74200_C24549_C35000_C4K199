// ataque especial: cobra el costo en hp, crea el proyectil, lo mueve y aplica el impacto.
// sale hacia donde se esta moviendo el jugador, y si esta quieto hacia el rival mas cercano

import {
  ETAPAS, MAPA, MULTIPLICADOR_ESPECIAL, RADIO_PROYECTIL, VELOCIDAD_PROYECTIL,
} from './config.js';
import { aplicarDano } from './eliminacion.js';
import { nuevoId, registrarEvento } from './estado.js';
import { direccionHacia, distancia, normalizar } from './geometria.js';
import { jugadoresVivos } from './partida.js';
import { radioJugador } from './progreso.js';

/** @typedef {import('./estado.js').EstadoJuego} EstadoJuego */
/** @typedef {import('./estado.js').Jugador} Jugador */
/** @typedef {import('./estado.js').Proyectil} Proyectil */

/**
 * Rival vivo mas cercano al jugador.
 * @param {EstadoJuego} estado Estado de la partida.
 * @param {Jugador} jugador Desde donde se mide.
 * @returns {Jugador|undefined} El mas cercano, o undefined si no queda nadie.
 */
function rivalMasCercano(estado, jugador) {
  const rivales = jugadoresVivos(estado).filter((rival) => rival !== jugador);
  rivales.sort((uno, otro) => distancia(jugador, uno) - distancia(jugador, otro));
  return rivales[0];
}

/**
 * Hacia donde sale el proyectil: hacia donde se mueve, o al rival mas cercano si esta quieto.
 * @param {EstadoJuego} estado Estado de la partida.
 * @param {Jugador} jugador Quien lo tira.
 * @returns {{dx: number, dy: number}|null} Direccion, o null si no hay a donde tirarlo.
 */
function direccionDisparo(estado, jugador) {
  const { dx, dy } = jugador.intencion;
  if (dx !== 0 || dy !== 0) return normalizar(dx, dy);
  const rival = rivalMasCercano(estado, jugador);
  return rival ? direccionHacia(jugador, rival) : null;
}

/**
 * Cobra el costo del especial: el porcentaje de su etapa sobre su propio hp.
 * No pasa por aplicarDano porque gastarse vida no es un golpe y nunca llega a 0.
 * @param {Jugador} jugador Quien lo tira.
 * @returns {number} Hp que le costo.
 */
function cobrarCosto(jugador) {
  const costo = ETAPAS[jugador.etapa].costoEspecial * jugador.hp;
  jugador.hp -= costo;
  return costo;
}

/**
 * Crea el proyectil en el borde del digimon, para que no salga desde adentro.
 * @param {EstadoJuego} estado Estado de la partida.
 * @param {Jugador} jugador Quien lo tira.
 * @param {{dx: number, dy: number}} direccion Hacia donde va.
 * @param {number} dano Hp que quita al pegar.
 * @returns {Proyectil} Proyectil nuevo.
 */
function crearProyectil(estado, jugador, direccion, dano) {
  const radio = radioJugador(jugador);
  return {
    id: nuevoId(estado),
    duenoId: jugador.id,
    x: jugador.x + direccion.dx * radio,
    y: jugador.y + direccion.dy * radio,
    dx: direccion.dx,
    dy: direccion.dy,
    dano,
  };
}

/**
 * Tira el especial del jugador si tiene a donde apuntar.
 * @param {EstadoJuego} estado Estado de la partida.
 * @param {Jugador} jugador Quien lo tira.
 */
function lanzarEspecial(estado, jugador) {
  const direccion = direccionDisparo(estado, jugador);
  if (!direccion) return;
  const costo = cobrarCosto(jugador);
  estado.proyectiles.push(crearProyectil(estado, jugador, direccion, costo * MULTIPLICADOR_ESPECIAL));
  registrarEvento(estado, 'especial', jugador.id);
}

/**
 * Avanza el proyectil en linea recta.
 * @param {Proyectil} proyectil Proyectil a mover.
 * @param {number} dt Segundos desde el cuadro anterior.
 */
function moverProyectil(proyectil, dt) {
  proyectil.x += proyectil.dx * VELOCIDAD_PROYECTIL * dt;
  proyectil.y += proyectil.dy * VELOCIDAD_PROYECTIL * dt;
}

/**
 * Revisa si el proyectil ya salio del mapa.
 * @param {Proyectil} proyectil Proyectil a revisar.
 * @returns {boolean} Si esta afuera.
 */
function fueraDelMapa(proyectil) {
  return proyectil.x < 0 || proyectil.y < 0 || proyectil.x > MAPA.ancho || proyectil.y > MAPA.alto;
}

/**
 * Primer rival vivo que toca el proyectil. Al que lo tiro no le pega.
 * @param {EstadoJuego} estado Estado de la partida.
 * @param {Proyectil} proyectil Proyectil a revisar.
 * @returns {Jugador|undefined} A quien le pego, o undefined si a nadie.
 */
function blancoAlcanzado(estado, proyectil) {
  return jugadoresVivos(estado).find((jugador) => jugador.id !== proyectil.duenoId
    && distancia(jugador, proyectil) < radioJugador(jugador) + RADIO_PROYECTIL);
}

/**
 * Mueve el proyectil y aplica el impacto si le pega a alguien.
 * @param {EstadoJuego} estado Estado de la partida.
 * @param {Proyectil} proyectil Proyectil a actualizar.
 * @param {number} dt Segundos desde el cuadro anterior.
 * @returns {boolean} Si sigue volando (no pego ni salio del mapa).
 */
function actualizarProyectil(estado, proyectil, dt) {
  moverProyectil(proyectil, dt);
  const blanco = blancoAlcanzado(estado, proyectil);
  if (blanco) aplicarDano(estado, blanco, proyectil.dano, proyectil.duenoId);
  return !blanco && !fueraDelMapa(proyectil);
}

/**
 * Paso de logica: tira los especiales pedidos en este cuadro y despues mueve
 * todos los proyectiles, quitando los que pegaron o salieron del mapa.
 * @param {EstadoJuego} estado Estado de la partida.
 * @param {number} dt Segundos desde el cuadro anterior.
 */
export function actualizarEspeciales(estado, dt) {
  for (const jugador of jugadoresVivos(estado)) {
    if (jugador.intencion.especial) lanzarEspecial(estado, jugador);
  }
  estado.proyectiles = estado.proyectiles.filter((proyectil) => actualizarProyectil(estado, proyectil, dt));
}
