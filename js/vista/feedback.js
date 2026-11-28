// realimentacion: lee estado.eventos de cada cuadro y los convierte en sonidos,
// clases de CSS (flash de daño, brillo al evolucionar, aro del especial) y avisos cortos.
// solo lee el estado. los efectos duran un rato despues del evento, por eso se guarda
// hasta cuando dura cada uno; asi el golpe de cada cuadro no reinicia el flash.

import { ETAPAS } from '../config.js';

/** @typedef {import('../estado.js').EstadoJuego} EstadoJuego */
/** @typedef {import('../estado.js').Evento} Evento */

/** Cuanto sigue el flash despues del ultimo golpe, en ms. */
const DURACION_GOLPE = 200;
/** Cuanto se queda apretado el boton del especial, en ms. */
const DURACION_LANZADO = 150;
/** Cuanto dura el brillo del panel al evolucionar, en ms (igual que la animacion del CSS). */
const DURACION_EVOLUCION = 1200;
/** Cuanto se ve un aviso, en ms. */
const DURACION_MENSAJE = 2500;

/**
 * Sonido hecho con notas cortas, sin archivos de audio.
 * @typedef {object} Sonido
 * @property {number[]} notas Frecuencias en Hz, una despues de otra.
 * @property {number} duracion Segundos de cada nota.
 * @property {number} volumen De 0 a 1, bajito para que no canse.
 */

/** @type {Record<string, Sonido>} */
const SONIDOS = {
  recolecto: { notas: [880], duracion: 0.04, volumen: 0.03 },
  especial: { notas: [660, 330], duracion: 0.07, volumen: 0.05 },
  golpe: { notas: [140], duracion: 0.1, volumen: 0.08 },
  evoluciono: { notas: [523, 659, 784, 1047], duracion: 0.1, volumen: 0.05 },
  elimino: { notas: [784, 1047], duracion: 0.12, volumen: 0.05 },
};

/**
 * Elementos y tiempos de la realimentacion. Es de la vista, no de la partida.
 * @typedef {object} VistaFeedback
 * @property {HTMLElement} partida El main: lleva la clase del flash de daño.
 * @property {HTMLElement} panel Panel de tu Digimon: lleva la clase del brillo.
 * @property {HTMLElement} boton Botón del especial: lleva la clase de lanzado.
 * @property {HTMLElement} mensaje Aviso corto, es un role="status".
 * @property {AudioContext|null} audio Se crea con la primera tecla o toque.
 * @property {Record<'golpe'|'lanzado'|'evolucion'|'mensaje', number>} hasta
 *   Hasta cuando (performance.now) dura cada efecto.
 */

/**
 * Toca un sonido. Si el audio todavia no esta activo no hace nada.
 * @param {VistaFeedback} vista Realimentacion.
 * @param {Sonido} sonido Sonido a tocar.
 */
function sonar(vista, sonido) {
  const { audio } = vista;
  if (!audio || audio.state !== 'running') return;
  sonido.notas.forEach((frecuencia, indice) => {
    const inicio = audio.currentTime + indice * sonido.duracion;
    const oscilador = new OscillatorNode(audio, { type: 'square', frequency: frecuencia });
    const volumen = new GainNode(audio);
    volumen.gain.setValueAtTime(sonido.volumen, inicio);
    volumen.gain.exponentialRampToValueAtTime(0.0001, inicio + sonido.duracion);
    oscilador.connect(volumen).connect(audio.destination);
    oscilador.start(inicio);
    oscilador.stop(inicio + sonido.duracion);
  });
}

/**
 * Muestra un aviso corto. El role="status" hace que el lector de pantalla lo lea.
 * @param {VistaFeedback} vista Realimentacion.
 * @param {string} texto Aviso.
 * @param {number} ahora Tiempo actual (performance.now).
 */
function avisar(vista, texto, ahora) {
  vista.mensaje.textContent = texto;
  vista.hasta.mensaje = ahora + DURACION_MENSAJE;
}

/**
 * Nombre de un jugador por id.
 * @param {EstadoJuego} estado Estado de la partida.
 * @param {number} id Id del jugador.
 * @returns {string} Nickname.
 */
function nombreDe(estado, id) {
  return estado.jugadores.find((jugador) => jugador.id === id)?.nombre ?? '';
}

/**
 * Golpe al jugador local: suena al empezar el contacto y alarga el flash mientras siga.
 * @param {VistaFeedback} vista Realimentacion.
 * @param {number} ahora Tiempo actual (performance.now).
 */
function alRecibirGolpe(vista, ahora) {
  if (ahora >= vista.hasta.golpe) sonar(vista, SONIDOS.golpe);
  vista.hasta.golpe = ahora + DURACION_GOLPE;
}

/**
 * Evolucion del jugador local: sonido, brillo del panel y aviso.
 * @param {VistaFeedback} vista Realimentacion.
 * @param {EstadoJuego} estado Estado de la partida.
 * @param {number} ahora Tiempo actual (performance.now).
 */
function alEvolucionar(vista, estado, ahora) {
  const jugador = estado.jugadores.find((uno) => uno.id === estado.jugadorLocalId);
  sonar(vista, SONIDOS.evoluciono);
  vista.hasta.evolucion = ahora + DURACION_EVOLUCION;
  avisar(vista, `¡Evolucionaste a ${ETAPAS[jugador.etapa].digimon}!`, ahora);
}

/**
 * Aviso de quien quedo eliminado. El del jugador local no, porque ahi sale el modal.
 * Sin otroId fue la zona (ojo: el local es el id 0, por eso se compara con undefined).
 * @param {VistaFeedback} vista Realimentacion.
 * @param {EstadoJuego} estado Estado de la partida.
 * @param {Evento} evento Evento 'eliminado'.
 * @param {number} ahora Tiempo actual (performance.now).
 */
function alEliminar(vista, estado, evento, ahora) {
  const local = estado.jugadorLocalId;
  if (evento.jugadorId === local) return;
  const victima = nombreDe(estado, evento.jugadorId);
  if (evento.otroId === undefined) {
    avisar(vista, `${victima} quedó fuera de la zona`, ahora);
  } else if (evento.otroId === local) {
    sonar(vista, SONIDOS.elimino);
    avisar(vista, `¡Eliminaste a ${victima}!`, ahora);
  } else {
    avisar(vista, `${nombreDe(estado, evento.otroId)} eliminó a ${victima}`, ahora);
  }
}

/**
 * Reacciona a un evento del cuadro. Salvo las eliminaciones, solo importan los del local.
 * @param {VistaFeedback} vista Realimentacion.
 * @param {EstadoJuego} estado Estado de la partida.
 * @param {Evento} evento Evento a convertir en realimentacion.
 * @param {number} ahora Tiempo actual (performance.now).
 */
function reaccionar(vista, estado, evento, ahora) {
  if (evento.tipo === 'eliminado') {
    alEliminar(vista, estado, evento, ahora);
    return;
  }
  if (evento.jugadorId !== estado.jugadorLocalId) return;
  if (evento.tipo === 'golpe') alRecibirGolpe(vista, ahora);
  if (evento.tipo === 'evoluciono') alEvolucionar(vista, estado, ahora);
  if (evento.tipo === 'recolecto') sonar(vista, SONIDOS.recolecto);
  if (evento.tipo === 'especial') {
    sonar(vista, SONIDOS.especial);
    vista.hasta.lanzado = ahora + DURACION_LANZADO;
  }
}

/**
 * Prende o apaga cada clase segun si su efecto sigue durando, y borra el aviso viejo.
 * @param {VistaFeedback} vista Realimentacion.
 * @param {number} ahora Tiempo actual (performance.now).
 */
function aplicarEfectos(vista, ahora) {
  const { hasta } = vista;
  vista.partida.classList.toggle('partida--golpe', ahora < hasta.golpe);
  vista.panel.classList.toggle('digimon--evoluciono', ahora < hasta.evolucion);
  vista.boton.classList.toggle('ataque__boton--lanzado', ahora < hasta.lanzado);
  if (ahora >= hasta.mensaje && vista.mensaje.textContent) vista.mensaje.textContent = '';
}

/**
 * Crea el audio con la primera tecla o toque, porque el navegador no deja sonar antes.
 * @param {VistaFeedback} vista Realimentacion.
 */
function activarAudioAlInteractuar(vista) {
  const activar = () => {
    vista.audio ??= new AudioContext();
  };
  window.addEventListener('keydown', activar, { once: true });
  window.addEventListener('pointerdown', activar, { once: true });
}

/**
 * Busca los elementos, prepara el audio y devuelve el paso de vista de la realimentacion.
 * @param {Document} documento Página del juego.
 * @returns {(estado: EstadoJuego) => void} Paso de vista que consume estado.eventos.
 */
export function crearVistaFeedback(documento) {
  const vista = {
    partida: documento.querySelector('.partida'),
    panel: documento.querySelector('.digimon'),
    boton: documento.querySelector('.ataque__boton'),
    mensaje: documento.querySelector('.mensaje'),
    audio: null,
    hasta: { golpe: 0, lanzado: 0, evolucion: 0, mensaje: 0 },
  };
  activarAudioAlInteractuar(vista);
  return (estado) => {
    const ahora = performance.now();
    for (const evento of estado.eventos) reaccionar(vista, estado, evento, ahora);
    aplicarEfectos(vista, ahora);
  };
}
