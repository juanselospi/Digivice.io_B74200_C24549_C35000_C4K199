// vista del HUD: cambia los valores de ejemplo de juego.html por los de la partida.
// solo lee el estado. cada valor se escribe solo si cambio, asi no se toca el DOM
// 60 veces por segundo con lo mismo.

import { CANTIDAD_JUGADORES, ETAPAS, META_EVOLUCION } from '../config.js';
import { jugadorLocal } from '../estado.js';
import { clasificacion, jugadoresVivos } from '../partida.js';
import { tiempoParaCerrar } from '../zona.js';

/** @typedef {import('../estado.js').EstadoJuego} EstadoJuego */
/** @typedef {import('../estado.js').Jugador} Jugador */

/**
 * Elementos del HUD que cambian durante la partida.
 * @typedef {object} ElementosHud
 * @property {HTMLElement} partida El main, donde vive la variable --progreso del aro.
 * @property {HTMLElement} jugadores "6 de 6 jugadores" del encabezado.
 * @property {HTMLElement} nombre Nombre del Digimon según la etapa.
 * @property {HTMLElement} tipo Tipo de data que lo hace evolucionar.
 * @property {HTMLElement} etapa Nombre de la etapa.
 * @property {HTMLElement} puntaje Puntaje / HP.
 * @property {HTMLProgressElement} barra Barra de evolución (para lectores de pantalla).
 * @property {Text} textoBarra Texto que va después de la barra ("13/20 Vaccine").
 * @property {HTMLElement} ataque Porcentaje de ataque por contacto.
 * @property {HTMLElement} especial Costo del especial.
 * @property {Text} textoBoton Costo que sale en el botón del especial.
 * @property {HTMLTimeElement} reloj Tiempo restante.
 * @property {HTMLElement} zona Aviso del siguiente cierre de la zona.
 * @property {HTMLElement} vivos "Vivos 5/6" del leaderboard.
 * @property {HTMLOListElement} lista Lista del leaderboard.
 */

/**
 * Cambia el texto de un nodo solo si es distinto al que tiene.
 * @param {Node} nodo Elemento o nodo de texto.
 * @param {string} texto Texto nuevo.
 */
function poner(nodo, texto) {
  if (nodo.textContent !== texto) nodo.textContent = texto;
}

/**
 * Puntaje redondeado y con espacio de miles, como en el diseño ("1 265").
 * @param {number} valor Puntaje.
 * @returns {string} Puntaje para mostrar.
 */
export function formatearPuntaje(valor) {
  return String(Math.round(valor)).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
}

/**
 * Segundos como "m:ss", redondeando hacia arriba para que llegue a 0:00 justo al final.
 * @param {number} segundos Segundos que faltan.
 * @returns {string} Tiempo para mostrar.
 */
export function formatearTiempo(segundos) {
  const total = Math.ceil(segundos);
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;
}

/**
 * Pone un tiempo en un elemento time, con su datetime ("PT3M27S").
 * @param {HTMLTimeElement} elemento Elemento time.
 * @param {number} segundos Segundos que faltan.
 * @param {string} texto Lo que se ve.
 */
export function ponerTiempo(elemento, segundos, texto) {
  const total = Math.ceil(segundos);
  elemento.dateTime = `PT${Math.floor(total / 60)}M${total % 60}S`;
  poner(elemento, texto);
}

/**
 * Pone la primera letra en mayúscula ("vaccine" → "Vaccine").
 * @param {string} texto Texto a cambiar.
 * @returns {string} Texto con mayúscula inicial.
 */
function capitalizar(texto) {
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

/**
 * Porcentaje sin decimales ("0.08" → "8%").
 * @param {number} fraccion Fracción de 0 a 1.
 * @returns {string} Porcentaje para mostrar.
 */
function porcentaje(fraccion) {
  return `${Math.round(fraccion * 100)}%`;
}

/**
 * Nombre, tipo, etapa y puntaje del Digimon del jugador local.
 * @param {ElementosHud} elementos Elementos del HUD.
 * @param {Jugador} jugador Jugador local.
 */
function actualizarDigimon(elementos, jugador) {
  poner(elementos.nombre, ETAPAS[jugador.etapa].digimon);
  poner(elementos.tipo, capitalizar(jugador.tipoEvolucion));
  poner(elementos.etapa, ETAPAS[jugador.etapa].nombre);
  poner(elementos.puntaje, formatearPuntaje(jugador.hp));
}

/**
 * Barra de evolución: el progress, el texto y el aro (variable --progreso).
 * @param {ElementosHud} elementos Elementos del HUD.
 * @param {Jugador} jugador Jugador local.
 */
function actualizarEvolucion(elementos, jugador) {
  const { barra } = elementos;
  const progreso = jugador.progresoEvolucion;
  if (barra.value !== progreso) barra.value = progreso;
  poner(barra, `${progreso} de ${META_EVOLUCION}`);
  poner(elementos.textoBarra, ` ${progreso}/${META_EVOLUCION} ${capitalizar(jugador.tipoEvolucion)}`);
  const { style } = elementos.partida;
  const aro = porcentaje(progreso / META_EVOLUCION);
  if (style.getPropertyValue('--progreso') !== aro) style.setProperty('--progreso', aro);
}

/**
 * Ataque por contacto y costo del especial según la etapa, en el HUD y en el botón.
 * @param {ElementosHud} elementos Elementos del HUD.
 * @param {Jugador} jugador Jugador local.
 */
function actualizarAtaque(elementos, jugador) {
  const { ataque, costoEspecial } = ETAPAS[jugador.etapa];
  poner(elementos.ataque, porcentaje(ataque));
  poner(elementos.especial, `−${porcentaje(costoEspecial)} HP`);
  poner(elementos.textoBoton, ` −${porcentaje(costoEspecial)} HP`);
}

/**
 * Reloj de la partida y aviso del siguiente cierre de la zona.
 * @param {ElementosHud} elementos Elementos del HUD.
 * @param {EstadoJuego} estado Estado de la partida.
 */
function actualizarTiempo(elementos, estado) {
  const reloj = formatearTiempo(estado.tiempoRestante).padStart(5, '0');
  ponerTiempo(elementos.reloj, estado.tiempoRestante, reloj);
  const cierre = tiempoParaCerrar(estado);
  const aviso = elementos.zona.querySelector('time');
  if (cierre === null || !aviso) {
    poner(elementos.zona, 'Zona segura: ya no se reduce más');
    return;
  }
  ponerTiempo(aviso, cierre, formatearTiempo(cierre));
}

/**
 * Llena una fila del leaderboard: nombre, puntaje o "eliminado", y marca la del jugador local.
 * @param {HTMLLIElement} fila Fila a llenar (un texto y un data).
 * @param {Jugador} jugador Jugador de esa fila.
 * @param {boolean} esLocal Si es el jugador de este dispositivo.
 */
function actualizarFila(fila, jugador, esLocal) {
  const [nombre, dato] = /** @type {[Text, HTMLDataElement]} */ (fila.childNodes);
  poner(nombre, `${jugador.nombre}${esLocal ? ' (tú)' : ''} `);
  const puntaje = String(Math.round(jugador.hp));
  if (dato.value !== puntaje) dato.value = puntaje;
  poner(dato, jugador.vivo ? formatearPuntaje(jugador.hp) : 'eliminado');
  fila.classList.toggle('leaderboard__eliminado', !jugador.vivo);
  if (esLocal) fila.setAttribute('aria-current', 'true');
  else fila.removeAttribute('aria-current');
}

/**
 * Leaderboard ordenado por puesto y el contador de vivos.
 * @param {ElementosHud} elementos Elementos del HUD.
 * @param {EstadoJuego} estado Estado de la partida.
 */
function actualizarLeaderboard(elementos, estado) {
  const filas = elementos.lista.children;
  clasificacion(estado).forEach((jugador, puesto) => {
    const fila = /** @type {HTMLLIElement} */ (filas[puesto]);
    actualizarFila(fila, jugador, jugador.id === estado.jugadorLocalId);
  });
  poner(elementos.vivos, `Vivos ${jugadoresVivos(estado).length}/${estado.jugadores.length}`);
  poner(elementos.jugadores, `${estado.jugadores.length} de ${CANTIDAD_JUGADORES} jugadores`);
}

/**
 * Cambia las filas de ejemplo del leaderboard por una vacía por jugador, cada una
 * con un texto para el nombre y un data para el puntaje.
 * @param {HTMLOListElement} lista Lista del leaderboard.
 * @param {number} cantidad Cuántos jugadores hay.
 */
function prepararLista(lista, cantidad) {
  const documento = lista.ownerDocument;
  const filas = Array.from({ length: cantidad }, () => {
    const fila = documento.createElement('li');
    fila.append(documento.createTextNode(''), documento.createElement('data'));
    return fila;
  });
  lista.replaceChildren(...filas);
}

/**
 * Busca en la página los elementos del HUD.
 * @param {Document} documento Página del juego.
 * @returns {ElementosHud} Elementos del HUD.
 */
function buscarElementos(documento) {
  const buscar = (selector) => documento.querySelector(selector);
  const [ataque, especial] = documento.querySelectorAll('dd.digimon__stat');
  const barra = buscar('#evolucion');
  return {
    partida: buscar('.partida'),
    jugadores: buscar('.encabezado__dato--suave'),
    nombre: buscar('.digimon__nombre'),
    tipo: buscar('.digimon__tipo'),
    etapa: buscar('.digimon__etapa'),
    puntaje: buscar('.digimon__puntaje'),
    barra,
    textoBarra: barra.nextSibling,
    ataque,
    especial,
    textoBoton: buscar('.ataque__boton').lastChild,
    reloj: buscar('.tiempo__reloj time'),
    zona: buscar('.tiempo__zona'),
    vivos: buscar('.leaderboard__vivos'),
    lista: buscar('.leaderboard__lista'),
  };
}

/**
 * Actualiza todo el HUD con el estado de este cuadro.
 * @param {ElementosHud} elementos Elementos del HUD.
 * @param {EstadoJuego} estado Estado de la partida.
 */
function dibujarHud(elementos, estado) {
  const jugador = jugadorLocal(estado);
  actualizarDigimon(elementos, jugador);
  actualizarEvolucion(elementos, jugador);
  actualizarAtaque(elementos, jugador);
  actualizarTiempo(elementos, estado);
  actualizarLeaderboard(elementos, estado);
}

/**
 * Busca los elementos del HUD, prepara el leaderboard y devuelve el paso de vista.
 * @param {Document} documento Página del juego.
 * @returns {(estado: EstadoJuego) => void} Paso de vista que actualiza el HUD.
 */
export function crearVistaHud(documento) {
  const elementos = buscarElementos(documento);
  prepararLista(elementos.lista, CANTIDAD_JUGADORES);
  return (estado) => dibujarHud(elementos, estado);
}
