// vista del fin de partida: llena el modal de victoria o de derrota y lo abre con showModal().
// la derrota sale apenas eliminan al jugador local, aunque los demas sigan jugando atras.
// la victoria sale cuando termina la partida y el ganador es el local. se abre uno solo.

import { ETAPAS } from '../config.js';
import { jugadorLocal } from '../estado.js';
import { clasificacion, jugadoresVivos, tiempoTranscurrido } from '../partida.js';
import { formatearPuntaje, formatearTiempo, ponerTiempo } from './hud.js';
import { rutaSprite } from './mapa.js';

/** @typedef {import('../estado.js').EstadoJuego} EstadoJuego */
/** @typedef {import('../estado.js').Jugador} Jugador */
/** @typedef {'victoria'|'derrota'} Resultado */

/**
 * Los dos modales y si ya se abrió alguno. Es de la vista, no de la partida.
 * @typedef {object} VistaFin
 * @property {Record<Resultado, HTMLDialogElement>} modales Modal de cada resultado.
 * @property {boolean} abierto Si ya se mostró el fin.
 */

/**
 * Decide si ya hay que mostrar el fin y cuál.
 * @param {EstadoJuego} estado Estado de la partida.
 * @returns {Resultado|null} El resultado, o null si el jugador local sigue jugando.
 */
function resultadoLocal(estado) {
  const jugador = jugadorLocal(estado);
  if (!jugador.vivo) return 'derrota';
  if (estado.fase !== 'terminada') return null;
  return estado.ganadorId === jugador.id ? 'victoria' : 'derrota';
}

/**
 * Cómo le fue a cada jugador, para la última columna de la tabla.
 * @param {EstadoJuego} estado Estado de la partida.
 * @param {Jugador} jugador Jugador de la fila.
 * @returns {string} Ganador, Eliminado, Sobrevivió o En juego.
 */
function estadoJugador(estado, jugador) {
  if (jugador.id === estado.ganadorId) return 'Ganador';
  if (!jugador.vivo) return 'Eliminado';
  return estado.fase === 'terminada' ? 'Sobrevivió' : 'En juego';
}

/**
 * Arma una fila de la tabla de resultados.
 * @param {EstadoJuego} estado Estado de la partida.
 * @param {Jugador} jugador Jugador de la fila.
 * @param {number} puesto Puesto en la clasificación, desde 1.
 * @returns {HTMLTableRowElement} Fila lista.
 */
function crearFila(estado, jugador, puesto) {
  const esLocal = jugador.id === estado.jugadorLocalId;
  const fila = document.createElement('tr');
  const celda = (etiqueta, texto) => {
    const elemento = document.createElement(etiqueta);
    elemento.textContent = texto;
    return elemento;
  };
  const nombre = celda('th', esLocal ? `${jugador.nombre} (tú)` : jugador.nombre);
  nombre.scope = 'row';
  fila.append(celda('td', String(puesto)), nombre,
    celda('td', formatearPuntaje(jugador.hp)), celda('td', estadoJugador(estado, jugador)));
  if (esLocal) fila.setAttribute('aria-current', 'true');
  return fila;
}

/**
 * Llena la tabla con la clasificación actual.
 * @param {HTMLDialogElement} modal Modal a llenar.
 * @param {EstadoJuego} estado Estado de la partida.
 */
function llenarTabla(modal, estado) {
  const filas = clasificacion(estado).map((jugador, indice) => crearFila(estado, jugador, indice + 1));
  modal.querySelector('.fin__tabla tbody').replaceChildren(...filas);
}

/**
 * Pone el sprite de la etapa a la que llegó el jugador.
 * @param {HTMLDialogElement} modal Modal a llenar.
 * @param {Jugador} jugador Jugador local.
 */
function llenarSprite(modal, jugador) {
  const sprite = /** @type {HTMLImageElement} */ (modal.querySelector('.fin__sprite'));
  const { digimon } = ETAPAS[jugador.etapa];
  sprite.src = rutaSprite(digimon);
  sprite.alt = `Sprite de ${digimon}`;
}

/**
 * Llena los datos de arriba de la tabla. El último siempre es un tiempo.
 * @param {HTMLDialogElement} modal Modal a llenar.
 * @param {string[]} valores Textos de los primeros datos, en orden.
 * @param {number} segundos Segundos del último dato.
 */
function llenarDatos(modal, valores, segundos) {
  const datos = modal.querySelectorAll('.fin__datos dd');
  valores.forEach((valor, indice) => {
    datos[indice].textContent = valor;
  });
  const tiempo = datos[valores.length].querySelector('time');
  ponerTiempo(tiempo, segundos, formatearTiempo(segundos).padStart(5, '0'));
}

/**
 * Datos de la derrota: puesto, puntaje máximo, etapa y tiempo sobrevivido.
 * @param {HTMLDialogElement} modal Modal de derrota.
 * @param {EstadoJuego} estado Estado de la partida.
 */
function llenarDerrota(modal, estado) {
  const jugador = jugadorLocal(estado);
  const puesto = clasificacion(estado).indexOf(jugador) + 1;
  const sobrevivido = jugador.eliminadoEn ?? tiempoTranscurrido(estado);
  llenarDatos(modal, [
    `${puesto} de ${estado.jugadores.length}`,
    formatearPuntaje(jugador.puntajeMaximo),
    ETAPAS[jugador.etapa].nombre,
  ], sobrevivido);
}

/**
 * Datos de la victoria: puntaje, etapa, eliminaciones, duración y el mensaje.
 * @param {HTMLDialogElement} modal Modal de victoria.
 * @param {EstadoJuego} estado Estado de la partida.
 */
function llenarVictoria(modal, estado) {
  const jugador = jugadorLocal(estado);
  llenarDatos(modal, [
    formatearPuntaje(jugador.hp),
    ETAPAS[jugador.etapa].nombre,
    String(jugador.eliminaciones),
  ], tiempoTranscurrido(estado));
  const ultimoEnPie = jugadoresVivos(estado).length === 1;
  modal.querySelector('.fin__mensaje').textContent = ultimoEnPie
    ? 'Tu Digimon fue el último en pie'
    : 'Tu Digimon terminó con el mayor puntaje';
}

/**
 * Si ya terminó para el jugador local, llena el modal que toca y lo abre.
 * @param {VistaFin} vista Modales y si ya se abrió alguno.
 * @param {EstadoJuego} estado Estado de la partida.
 */
function mostrarFin(vista, estado) {
  const resultado = resultadoLocal(estado);
  if (vista.abierto || !resultado) return;
  const modal = vista.modales[resultado];
  if (resultado === 'victoria') llenarVictoria(modal, estado);
  else llenarDerrota(modal, estado);
  llenarSprite(modal, jugadorLocal(estado));
  llenarTabla(modal, estado);
  modal.showModal();
  vista.abierto = true;
}

/**
 * Busca los modales de fin y devuelve el paso de vista que los abre.
 * @param {Document} documento Página del juego.
 * @returns {(estado: EstadoJuego) => void} Paso de vista del fin de partida.
 */
export function crearVistaFin(documento) {
  const vista = {
    modales: {
      victoria: /** @type {HTMLDialogElement} */ (documento.getElementById('fin-victoria')),
      derrota: /** @type {HTMLDialogElement} */ (documento.getElementById('fin-derrota')),
    },
    abierto: false,
  };
  return (estado) => mostrarFin(vista, estado);
}
