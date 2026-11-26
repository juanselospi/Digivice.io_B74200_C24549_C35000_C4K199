// modelo de estado del juego: un solo objeto con todo lo que define la partida.
// la logica recibe (estado, dt) y solo cambia el estado, la vista solo lo lee y dibuja.

import {
  CANTIDAD_JUGADORES, DURACION_PARTIDA, HP_INICIAL, MAPA, NOMBRES_BOTS,
  RADIO_APARICION, RADIO_ZONA_INICIAL, TIPOS_DATA, TIPO_JUGADOR_LOCAL,
} from './config.js';

/** @typedef {'data'|'vaccine'|'virus'|'free'} TipoData */

/**
 * Lo que un jugador quiere hacer en este cuadro. El local la llena con el teclado
 * o el tap, los bots con su IA.
 * @typedef {object} Intencion
 * @property {number} dx Dirección horizontal, de -1 a 1.
 * @property {number} dy Dirección vertical, de -1 a 1.
 * @property {boolean} especial Si quiere lanzar el ataque especial en este cuadro.
 */

/**
 * @typedef {object} Jugador
 * @property {number} id
 * @property {string} nombre Nickname que sale en el leaderboard.
 * @property {boolean} esBot
 * @property {number} x
 * @property {number} y
 * @property {number} hp Puntos de vida, también es el puntaje.
 * @property {number} puntajeMaximo El HP más alto que tuvo (para el modal de fin).
 * @property {TipoData} tipoEvolucion El único tipo de orbe que llena su barra.
 * @property {1|2|3} etapa
 * @property {number} progresoEvolucion Orbes del tipo correcto en la etapa actual.
 * @property {boolean} vivo
 * @property {number} eliminaciones
 * @property {number|null} eliminadoEn Segundo de la partida en que quedó eliminado.
 * @property {Intencion} intencion
 */

/**
 * @typedef {object} Orbe
 * @property {number} id
 * @property {number} x
 * @property {number} y
 * @property {TipoData} tipo
 */

/**
 * @typedef {object} Proyectil
 * @property {number} id
 * @property {number} duenoId Id del jugador que lo lanzó.
 * @property {number} x
 * @property {number} y
 * @property {number} dx
 * @property {number} dy
 * @property {number} dano
 */

/**
 * @typedef {object} Zona
 * @property {number} x Centro.
 * @property {number} y Centro.
 * @property {number} radio
 */

/**
 * Algo que pasó en este cuadro, para que feedback.js lo convierta en sonido,
 * animación o mensaje. Se borran al empezar el siguiente cuadro.
 * @typedef {object} Evento
 * @property {'recolecto'|'evoluciono'|'golpe'|'especial'|'eliminado'|'fin'} tipo
 * @property {number} [jugadorId] A quién le pasó.
 * @property {number} [otroId] El otro involucrado (quien golpeó, quien eliminó...).
 */

/**
 * @typedef {object} EstadoJuego
 * @property {'jugando'|'terminada'} fase
 * @property {number} tiempoRestante Segundos que faltan.
 * @property {Zona} zona
 * @property {Jugador[]} jugadores
 * @property {Orbe[]} orbes
 * @property {Proyectil[]} proyectiles
 * @property {number} jugadorLocalId Id del jugador de este dispositivo.
 * @property {Intencion} entrada Lo que está tocando el jugador local (teclado/tap).
 * @property {Evento[]} eventos
 * @property {number|null} ganadorId
 * @property {number} siguienteId Contador para dar ids únicos a orbes y proyectiles.
 */

/**
 * Crea una intención quieta, sin moverse ni atacar.
 * @returns {Intencion} Intención en cero.
 */
export function crearIntencion() {
  return { dx: 0, dy: 0, especial: false };
}

/**
 * Calcula dónde aparece un jugador, repartidos en círculo alrededor del centro.
 * @param {number} indice Posición del jugador en la lista.
 * @returns {{x: number, y: number}} Coordenadas de aparición.
 */
function posicionInicial(indice) {
  const angulo = (indice / CANTIDAD_JUGADORES) * Math.PI * 2;
  return {
    x: MAPA.ancho / 2 + Math.cos(angulo) * RADIO_APARICION,
    y: MAPA.alto / 2 + Math.sin(angulo) * RADIO_APARICION,
  };
}

/**
 * Crea un jugador con los valores de inicio.
 * @param {number} id Id y posición en la lista.
 * @param {string} nombre Nickname.
 * @param {boolean} esBot Si lo controla la compu.
 * @param {TipoData} tipoEvolucion Tipo de orbe que lo hace evolucionar.
 * @returns {Jugador} Jugador nuevo.
 */
function crearJugador(id, nombre, esBot, tipoEvolucion) {
  return {
    id, nombre, esBot, tipoEvolucion,
    ...posicionInicial(id),
    hp: HP_INICIAL,
    puntajeMaximo: HP_INICIAL,
    etapa: 1,
    progresoEvolucion: 0,
    vivo: true,
    eliminaciones: 0,
    eliminadoEn: null,
    intencion: crearIntencion(),
  };
}

/**
 * Crea la lista de jugadores: el local (id 0) y los bots.
 * @param {string} nombreLocal Nickname del jugador local.
 * @returns {Jugador[]} Todos los jugadores.
 */
function crearJugadores(nombreLocal) {
  const jugadores = [crearJugador(0, nombreLocal, false, TIPO_JUGADOR_LOCAL)];
  for (let id = 1; id < CANTIDAD_JUGADORES; id++) {
    const tipo = TIPOS_DATA[id % TIPOS_DATA.length];
    jugadores.push(crearJugador(id, NOMBRES_BOTS[id - 1], true, tipo));
  }
  return jugadores;
}

/**
 * Crea el estado de una partida nueva. Es la única fuente de verdad del juego.
 * @param {string} nombreLocal Nickname del jugador local.
 * @returns {EstadoJuego} Estado inicial.
 */
export function crearEstadoInicial(nombreLocal) {
  return {
    fase: 'jugando',
    tiempoRestante: DURACION_PARTIDA,
    zona: { x: MAPA.ancho / 2, y: MAPA.alto / 2, radio: RADIO_ZONA_INICIAL },
    jugadores: crearJugadores(nombreLocal),
    orbes: [],
    proyectiles: [],
    jugadorLocalId: 0,
    entrada: crearIntencion(),
    eventos: [],
    ganadorId: null,
    siguienteId: 1,
  };
}

/**
 * Da un id nuevo para un orbe o proyectil.
 * @param {EstadoJuego} estado Estado de la partida.
 * @returns {number} Id que no se ha usado.
 */
export function nuevoId(estado) {
  const id = estado.siguienteId;
  estado.siguienteId++;
  return id;
}

/**
 * Busca el jugador de este dispositivo.
 * @param {EstadoJuego} estado Estado de la partida.
 * @returns {Jugador} Jugador local.
 */
export function jugadorLocal(estado) {
  return estado.jugadores.find((jugador) => jugador.id === estado.jugadorLocalId);
}

/**
 * Anota un evento para la realimentación (sonido, animación o mensaje).
 * @param {EstadoJuego} estado Estado de la partida.
 * @param {Evento['tipo']} tipo Qué pasó.
 * @param {number} [jugadorId] A quién le pasó.
 * @param {number} [otroId] El otro involucrado.
 */
export function registrarEvento(estado, tipo, jugadorId, otroId) {
  estado.eventos.push({ tipo, jugadorId, otroId });
}
