// cuentas de distancias y direcciones que usan los demas modulos

/**
 * Algo con posicion: un jugador, un orbe o el centro de la zona.
 * @typedef {object} Punto
 * @property {number} x
 * @property {number} y
 */

/**
 * Distancia entre dos puntos.
 * @param {Punto} punto Un punto.
 * @param {Punto} otro Otro punto.
 * @returns {number} Distancia entre los dos.
 */
export function distancia(punto, otro) {
  return Math.hypot(otro.x - punto.x, otro.y - punto.y);
}

/**
 * Deja el vector de largo 1 (o 0 si no tiene direccion).
 * @param {number} dx Componente horizontal.
 * @param {number} dy Componente vertical.
 * @returns {{dx: number, dy: number}} Vector normalizado.
 */
export function normalizar(dx, dy) {
  const largo = Math.hypot(dx, dy);
  return largo === 0 ? { dx: 0, dy: 0 } : { dx: dx / largo, dy: dy / largo };
}

/**
 * Direccion para ir de un punto a otro.
 * @param {Punto} desde Punto de salida.
 * @param {Punto} hacia Punto de llegada.
 * @returns {{dx: number, dy: number}} Direccion normalizada.
 */
export function direccionHacia(desde, hacia) {
  return normalizar(hacia.x - desde.x, hacia.y - desde.y);
}

/**
 * Deja un valor dentro de un rango.
 * @param {number} valor Valor a revisar.
 * @param {number} minimo Lo minimo que puede valer.
 * @param {number} maximo Lo maximo que puede valer.
 * @returns {number} Valor dentro del rango.
 */
export function limitar(valor, minimo, maximo) {
  return Math.min(Math.max(valor, minimo), maximo);
}

/**
 * Punto al azar dentro de un circulo.
 * @param {{x: number, y: number, radio: number}} circulo Centro y radio.
 * @returns {Punto} Punto adentro del circulo.
 */
export function puntoEnCirculo(circulo) {
  const angulo = Math.random() * Math.PI * 2;
  // con la raiz no se amontonan todos en el centro
  const radio = Math.sqrt(Math.random()) * circulo.radio;
  return {
    x: circulo.x + Math.cos(angulo) * radio,
    y: circulo.y + Math.sin(angulo) * radio,
  };
}
