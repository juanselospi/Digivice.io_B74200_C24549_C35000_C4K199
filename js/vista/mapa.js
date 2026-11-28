// vista del mapa: dibuja en el canvas la zona, la cuadricula, los orbes, los proyectiles
// y los digimon, con la camara siguiendo al jugador local. solo lee el estado.
// los colores salen de tokens.css, asi el canvas y el CSS usan la misma paleta.

import { ETAPAS, MAPA, RADIO_ORBE, RADIO_PROYECTIL } from '../config.js';
import { jugadorLocal } from '../estado.js';
import { jugadoresVivos } from '../partida.js';
import { radioJugador } from '../progreso.js';

/** @typedef {import('../estado.js').EstadoJuego} EstadoJuego */
/** @typedef {import('../estado.js').Jugador} Jugador */
/** @typedef {import('../estado.js').Orbe} Orbe */
/** @typedef {import('../estado.js').Proyectil} Proyectil */
/** @typedef {import('../estado.js').Zona} Zona */
/** @typedef {import('../estado.js').TipoData} TipoData */

/** Lado de una celda de la cuadricula, en unidades del mapa. */
const CELDA = 100;
/** Unidades del mapa que se ven en el lado corto de la pantalla con un jugador de radio 0. */
const VISTA_BASE = 700;
/** Cuanto se aleja la camara por cada unidad de radio, para que un jugador grande no tape todo. */
const ALEJAMIENTO = 4;
/** Largo de la estela punteada del proyectil, en unidades del mapa. */
const ESTELA = 120;
/** Tamaño de letra de los nombres, en px de pantalla. */
const LETRA_NOMBRE = 13;
/** Grosor del borde de la zona segura, en px de pantalla. */
const GROSOR_ZONA = 3;

/** Carpeta de la linea de Agumon, con los espacios ya codificados. */
const CARPETA_SPRITES = 'assets/digishell/3%20-%20Agumon%20EX/';
/**
 * Sprite de cada Digimon (el nombre es el de ETAPAS). Los png son de 192x192 con mucho
 * espacio vacio; el recorte [x, y, lado] es el cuadrado donde esta el Digimon, asi llena
 * el circulo del jugador. El tamaño lo da el hp, no la etapa.
 */
const SPRITES = {
  Botamon: { archivo: 'Botamon/c0187_0.png', recorte: [54, 111, 81] },
  Koromon: { archivo: 'Koromon/c0188_0.png', recorte: [54, 105, 87] },
  Agumon: { archivo: 'Agumon/c0189_0.png', recorte: [42, 87, 105] },
};

/**
 * Colores y fuente del mapa, leidos de tokens.css.
 * @typedef {object} Colores
 * @property {string} afuera Fondo fuera de la zona segura.
 * @property {string} adentro Fondo dentro de la zona segura.
 * @property {string} cuadricula Lineas de la cuadricula.
 * @property {string} borde Borde de la zona segura.
 * @property {string} texto Nombre del jugador local.
 * @property {string} textoSuave Nombre de los rivales.
 * @property {string} proyectil Proyectil del especial y su estela.
 * @property {string} fuente Familia de letra de los nombres.
 * @property {Record<TipoData, string>} orbes Color de cada tipo de data.
 */

/**
 * Lo que necesita la vista para dibujar. Es de la vista, no de la partida.
 * @typedef {object} VistaMapa
 * @property {HTMLCanvasElement} lienzo Canvas del mapa.
 * @property {CanvasRenderingContext2D} pincel Contexto 2d del canvas.
 * @property {Colores} colores Paleta del mapa.
 * @property {Record<string, HTMLImageElement>} sprites Imagen de cada Digimon.
 */

/**
 * Lee la paleta del mapa de las variables de tokens.css.
 * @returns {Colores} Colores del mapa.
 */
function leerColores() {
  const estilos = getComputedStyle(document.documentElement);
  const variable = (nombre) => estilos.getPropertyValue(nombre).trim();
  return {
    afuera: variable('--color-mapa'),
    adentro: variable('--color-fondo'),
    cuadricula: variable('--color-borde'),
    borde: variable('--color-acento'),
    texto: variable('--color-texto'),
    textoSuave: variable('--color-texto-suave'),
    proyectil: variable('--orbe-data'),
    fuente: variable('--fuente-titulo'),
    orbes: {
      data: variable('--orbe-data'),
      vaccine: variable('--orbe-vaccine'),
      virus: variable('--orbe-virus'),
      free: variable('--orbe-free'),
    },
  };
}

/**
 * Ruta del sprite quieto de un Digimon, para usarlo en un img o en el canvas.
 * @param {string} digimon Nombre del Digimon (el de ETAPAS).
 * @returns {string} Ruta relativa a la página.
 */
export function rutaSprite(digimon) {
  return CARPETA_SPRITES + SPRITES[digimon].archivo;
}

/**
 * Empieza a cargar el sprite de cada Digimon. Mientras no carguen se dibuja un circulo.
 * @returns {Record<string, HTMLImageElement>} Imagen de cada Digimon.
 */
function cargarSprites() {
  const sprites = {};
  for (const digimon of Object.keys(SPRITES)) {
    sprites[digimon] = new Image();
    sprites[digimon].src = rutaSprite(digimon);
  }
  return sprites;
}

/**
 * Ajusta la resolucion del canvas a su tamaño en pantalla y a la densidad de pixeles.
 * @param {HTMLCanvasElement} lienzo Canvas del mapa.
 */
function ajustarLienzo(lienzo) {
  const densidad = window.devicePixelRatio || 1;
  const ancho = Math.round(lienzo.clientWidth * densidad);
  const alto = Math.round(lienzo.clientHeight * densidad);
  if (lienzo.width !== ancho) lienzo.width = ancho;
  if (lienzo.height !== alto) lienzo.height = alto;
}

/**
 * Pinta todo el canvas con el color de afuera de la zona.
 * @param {VistaMapa} vista Canvas y paleta.
 */
function limpiar(vista) {
  const { lienzo, pincel, colores } = vista;
  pincel.setTransform(1, 0, 0, 1, 0, 0);
  pincel.fillStyle = colores.afuera;
  pincel.fillRect(0, 0, lienzo.width, lienzo.height);
}

/**
 * Centra la camara en el jugador local y la aleja segun su tamaño.
 * @param {VistaMapa} vista Canvas y paleta.
 * @param {Jugador} jugador Jugador que sigue la camara.
 * @returns {number} Pixeles de pantalla (CSS) por unidad del mapa.
 */
function colocarCamara(vista, jugador) {
  const { lienzo, pincel } = vista;
  const ladoCorto = Math.min(lienzo.clientWidth, lienzo.clientHeight);
  const escala = ladoCorto / (VISTA_BASE + radioJugador(jugador) * ALEJAMIENTO);
  const total = escala * (lienzo.width / lienzo.clientWidth);
  const corrimientoX = lienzo.width / 2 - jugador.x * total;
  const corrimientoY = lienzo.height / 2 - jugador.y * total;
  pincel.setTransform(total, 0, 0, total, corrimientoX, corrimientoY);
  return escala;
}

/**
 * Hace un circulo en el camino actual del pincel.
 * @param {CanvasRenderingContext2D} pincel Contexto 2d.
 * @param {number} x Centro.
 * @param {number} y Centro.
 * @param {number} radio Radio.
 */
function circulo(pincel, x, y, radio) {
  pincel.beginPath();
  pincel.arc(x, y, radio, 0, Math.PI * 2);
}

/**
 * Pinta el adentro de la zona segura.
 * @param {VistaMapa} vista Canvas y paleta.
 * @param {Zona} zona Zona segura.
 */
function dibujarZona(vista, zona) {
  circulo(vista.pincel, zona.x, zona.y, zona.radio);
  vista.pincel.fillStyle = vista.colores.adentro;
  vista.pincel.fill();
}

/**
 * Dibuja la cuadricula del mapa, que tambien marca sus limites.
 * @param {VistaMapa} vista Canvas y paleta.
 * @param {number} escala Pixeles por unidad del mapa.
 */
function dibujarCuadricula(vista, escala) {
  const { pincel, colores } = vista;
  pincel.beginPath();
  for (let x = 0; x <= MAPA.ancho; x += CELDA) {
    pincel.moveTo(x, 0);
    pincel.lineTo(x, MAPA.alto);
  }
  for (let y = 0; y <= MAPA.alto; y += CELDA) {
    pincel.moveTo(0, y);
    pincel.lineTo(MAPA.ancho, y);
  }
  pincel.strokeStyle = colores.cuadricula;
  pincel.lineWidth = 1 / escala;
  pincel.stroke();
}

/**
 * Dibuja el borde naranja de la zona segura.
 * @param {VistaMapa} vista Canvas y paleta.
 * @param {Zona} zona Zona segura.
 * @param {number} escala Pixeles por unidad del mapa.
 */
function dibujarBordeZona(vista, zona, escala) {
  circulo(vista.pincel, zona.x, zona.y, zona.radio);
  vista.pincel.strokeStyle = vista.colores.borde;
  vista.pincel.lineWidth = GROSOR_ZONA / escala;
  vista.pincel.stroke();
}

/**
 * Dibuja cada orbe con el color de su tipo.
 * @param {VistaMapa} vista Canvas y paleta.
 * @param {Orbe[]} orbes Orbes del mapa.
 */
function dibujarOrbes(vista, orbes) {
  for (const orbe of orbes) {
    circulo(vista.pincel, orbe.x, orbe.y, RADIO_ORBE);
    vista.pincel.fillStyle = vista.colores.orbes[orbe.tipo];
    vista.pincel.fill();
  }
}

/**
 * Dibuja un proyectil con su estela punteada hacia atras.
 * @param {VistaMapa} vista Canvas y paleta.
 * @param {Proyectil} proyectil Proyectil a dibujar.
 * @param {number} escala Pixeles por unidad del mapa.
 */
function dibujarProyectil(vista, proyectil, escala) {
  const { pincel, colores } = vista;
  pincel.beginPath();
  pincel.moveTo(proyectil.x - proyectil.dx * ESTELA, proyectil.y - proyectil.dy * ESTELA);
  pincel.lineTo(proyectil.x, proyectil.y);
  pincel.setLineDash([8 / escala, 6 / escala]);
  pincel.strokeStyle = colores.proyectil;
  pincel.lineWidth = 3 / escala;
  pincel.stroke();
  pincel.setLineDash([]);
  circulo(pincel, proyectil.x, proyectil.y, RADIO_PROYECTIL);
  pincel.fillStyle = colores.proyectil;
  pincel.fill();
}

/**
 * Dibuja el Digimon de la etapa del jugador llenando su circulo. Si el sprite
 * todavia no carga, dibuja un circulo del color de su tipo.
 * @param {VistaMapa} vista Canvas y paleta.
 * @param {Jugador} jugador Jugador a dibujar.
 */
function dibujarDigimon(vista, jugador) {
  const { pincel, colores, sprites } = vista;
  const radio = radioJugador(jugador);
  const digimon = ETAPAS[jugador.etapa].digimon;
  const imagen = sprites[digimon];
  if (!imagen.complete || imagen.naturalWidth === 0) {
    circulo(pincel, jugador.x, jugador.y, radio);
    pincel.fillStyle = colores.orbes[jugador.tipoEvolucion];
    pincel.fill();
    return;
  }
  const [recorteX, recorteY, lado] = SPRITES[digimon].recorte;
  pincel.imageSmoothingEnabled = false;
  pincel.drawImage(imagen, recorteX, recorteY, lado, lado,
    jugador.x - radio, jugador.y - radio, radio * 2, radio * 2);
}

/**
 * Escribe el nombre debajo del Digimon, con el mismo tamaño en pantalla siempre.
 * @param {VistaMapa} vista Canvas y paleta.
 * @param {Jugador} jugador Jugador a nombrar.
 * @param {boolean} esLocal Si es el jugador de este dispositivo.
 * @param {number} escala Pixeles por unidad del mapa.
 */
function dibujarNombre(vista, jugador, esLocal, escala) {
  const { pincel, colores } = vista;
  pincel.font = `${esLocal ? 700 : 500} ${LETRA_NOMBRE / escala}px ${colores.fuente}`;
  pincel.textAlign = 'center';
  pincel.textBaseline = 'top';
  pincel.fillStyle = esLocal ? colores.texto : colores.textoSuave;
  const nombre = esLocal ? `${jugador.nombre} (tú)` : jugador.nombre;
  pincel.fillText(nombre, jugador.x, jugador.y + radioJugador(jugador) + 4 / escala);
}

/**
 * Dibuja a los jugadores vivos, el local al final para que quede encima.
 * @param {VistaMapa} vista Canvas y paleta.
 * @param {EstadoJuego} estado Estado de la partida.
 * @param {number} escala Pixeles por unidad del mapa.
 */
function dibujarJugadores(vista, estado, escala) {
  const esLocal = (jugador) => jugador.id === estado.jugadorLocalId;
  const vivos = jugadoresVivos(estado).sort((uno, otro) => esLocal(uno) - esLocal(otro));
  for (const jugador of vivos) {
    dibujarDigimon(vista, jugador);
    dibujarNombre(vista, jugador, esLocal(jugador), escala);
  }
}

/**
 * Dibuja un cuadro completo del mapa.
 * @param {VistaMapa} vista Canvas y paleta.
 * @param {EstadoJuego} estado Estado de la partida.
 */
function dibujarMapa(vista, estado) {
  ajustarLienzo(vista.lienzo);
  limpiar(vista);
  const escala = colocarCamara(vista, jugadorLocal(estado));
  dibujarZona(vista, estado.zona);
  dibujarCuadricula(vista, escala);
  dibujarBordeZona(vista, estado.zona, escala);
  dibujarOrbes(vista, estado.orbes);
  for (const proyectil of estado.proyectiles) dibujarProyectil(vista, proyectil, escala);
  dibujarJugadores(vista, estado, escala);
}

/**
 * Prepara el canvas, la paleta y los sprites, y devuelve el paso de vista del mapa.
 * @param {HTMLCanvasElement} lienzo Canvas del mapa.
 * @returns {(estado: EstadoJuego) => void} Paso de vista que dibuja el mapa.
 */
export function crearVistaMapa(lienzo) {
  const vista = {
    lienzo,
    pincel: lienzo.getContext('2d'),
    colores: leerColores(),
    sprites: cargarSprites(),
  };
  return (estado) => dibujarMapa(vista, estado);
}
