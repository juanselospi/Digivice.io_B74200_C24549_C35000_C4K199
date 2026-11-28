// ia de los bots: cada cuadro deciden su intencion viendo el estado
// orden: volver a la zona, huir del mas fuerte, perseguir al mas debil o ir por orbes
// si estan parejos no se persiguen, si no se quedan pegados y nadie come

import { MARGEN_ZONA_BOT, PESO_ORBE_PROPIO, PROBABILIDAD_ESPECIAL_BOT, VISION_BOT } from './config.js';
import { direccionHacia, distancia } from './geometria.js';
import { jugadoresVivos } from './partida.js';

/** @typedef {import('./estado.js').EstadoJuego} EstadoJuego */
/** @typedef {import('./estado.js').Jugador} Jugador */
/** @typedef {import('./estado.js').Orbe} Orbe */

/**
 * El elemento de la lista con menor costo.
 * @template T
 * @param {T[]} lista Elementos a comparar.
 * @param {(elemento: T) => number} costo Que tan malo es cada uno.
 * @returns {T|null} El de menor costo, o null si la lista esta vacia.
 */
function elMenor(lista, costo) {
  let elegido = null;
  for (const elemento of lista) {
    if (elegido === null || costo(elemento) < costo(elegido)) elegido = elemento;
  }
  return elegido;
}

/**
 * Rival vivo mas cercano que el bot alcanza a ver.
 * @param {EstadoJuego} estado Estado de la partida.
 * @param {Jugador} bot Bot que esta decidiendo.
 * @returns {Jugador|null} Rival mas cercano, o null si no ve a nadie.
 */
function rivalCercano(estado, bot) {
  const visibles = jugadoresVivos(estado)
    .filter((rival) => rival !== bot && distancia(bot, rival) < VISION_BOT);
  return elMenor(visibles, (rival) => distancia(bot, rival));
}

/**
 * Que tan lejos siente el bot un orbe. Los de su tipo los siente mas cerca.
 * @param {Jugador} bot Bot que esta decidiendo.
 * @param {Orbe} orbe Orbe a medir.
 * @returns {number} Distancia con el peso aplicado.
 */
function costoOrbe(bot, orbe) {
  const lejania = distancia(bot, orbe);
  return orbe.tipo === bot.tipoEvolucion ? lejania * PESO_ORBE_PROPIO : lejania;
}

/**
 * Revisa si un rival le gana al bot: primero por etapa (pega mas) y si empatan por hp.
 * @param {Jugador} rival Rival a comparar.
 * @param {Jugador} bot Bot que esta decidiendo.
 * @returns {boolean} Si el rival es mas fuerte.
 */
function esMasFuerte(rival, bot) {
  if (rival.etapa !== bot.etapa) return rival.etapa > bot.etapa;
  return rival.hp > bot.hp;
}

/**
 * Revisa si el bot esta afuera de la zona o muy pegado al borde.
 * @param {EstadoJuego} estado Estado de la partida.
 * @param {Jugador} bot Bot que esta decidiendo.
 * @returns {boolean} Si tiene que volver a la zona.
 */
function fueraDeZona(estado, bot) {
  return distancia(bot, estado.zona) > estado.zona.radio - MARGEN_ZONA_BOT;
}

/**
 * Direccion contraria a un rival, para huir.
 * @param {Jugador} bot Bot que huye.
 * @param {Jugador} rival De quien huye.
 * @returns {{dx: number, dy: number}} Direccion para alejarse.
 */
function alejarseDe(bot, rival) {
  const hacia = direccionHacia(bot, rival);
  return { dx: -hacia.dx, dy: -hacia.dy };
}

/**
 * Elige hacia donde se mueve el bot en este cuadro.
 * @param {EstadoJuego} estado Estado de la partida.
 * @param {Jugador} bot Bot que esta decidiendo.
 * @param {Jugador|null} rival Rival mas cercano que ve.
 * @returns {{dx: number, dy: number}} Direccion elegida.
 */
function elegirDireccion(estado, bot, rival) {
  if (fueraDeZona(estado, bot)) return direccionHacia(bot, estado.zona);
  if (rival && esMasFuerte(rival, bot)) return alejarseDe(bot, rival);
  if (rival && esMasFuerte(bot, rival)) return direccionHacia(bot, rival);
  const orbe = elMenor(estado.orbes, (candidato) => costoOrbe(bot, candidato));
  return orbe ? direccionHacia(bot, orbe) : { dx: 0, dy: 0 };
}

/**
 * Decide si tira el especial: solo cuando persigue a uno mas debil y de vez en cuando.
 * @param {Jugador} bot Bot que esta decidiendo.
 * @param {Jugador|null} rival Rival mas cercano que ve.
 * @param {number} dt Segundos desde el cuadro anterior.
 * @returns {boolean} Si lo tira en este cuadro.
 */
function vaAtacar(bot, rival, dt) {
  if (!rival || !esMasFuerte(bot, rival)) return false;
  return Math.random() < PROBABILIDAD_ESPECIAL_BOT * dt;
}

/**
 * Llena la intencion del bot para este cuadro.
 * @param {EstadoJuego} estado Estado de la partida.
 * @param {Jugador} bot Bot que esta decidiendo.
 * @param {number} dt Segundos desde el cuadro anterior.
 */
function decidirIntencion(estado, bot, dt) {
  const rival = rivalCercano(estado, bot);
  Object.assign(bot.intencion, elegirDireccion(estado, bot, rival));
  bot.intencion.especial = vaAtacar(bot, rival, dt);
}

/**
 * Paso de logica: cada bot vivo decide que hacer. Solo cambia su intencion,
 * el movimiento y el especial los aplican sus modulos.
 * @param {EstadoJuego} estado Estado de la partida.
 * @param {number} dt Segundos desde el cuadro anterior.
 */
export function actualizarBots(estado, dt) {
  for (const jugador of jugadoresVivos(estado)) {
    if (jugador.esBot) decidirIntencion(estado, jugador, dt);
  }
}
