// constantes de las reglas del juego. cada quien agrega aca las suyas en su seccion,
// asi los numeros no quedan regados por el codigo.

/** @typedef {import('./estado.js').TipoData} TipoData */

/**
 * Poder de cada etapa de evolución.
 * @typedef {object} Etapa
 * @property {string} nombre Nombre de la etapa (lo que muestra el HUD).
 * @property {string} digimon Digimon de esa etapa (para elegir el sprite).
 * @property {number} ataque Daño por contacto, fracción de HP (0.08 = 8 %).
 * @property {number} costoEspecial Lo que cuesta el especial, fracción del HP propio.
 */

// ---- partida ----
/** Duración de la partida en segundos. */
export const DURACION_PARTIDA = 300;
/** Jugadores por partida: el local y el resto bots. */
export const CANTIDAD_JUGADORES = 6;
/** Nombres de los bots, sacados del diseño. */
export const NOMBRES_BOTS = ['Rival_02', 'Tamer77', 'xX_Koji', 'Mimi_ai', 'Taichi'];
/** Nombre del jugador local si no viene en la URL. */
export const NOMBRE_POR_DEFECTO = 'Jugador';
/** El dt máximo por cuadro, para que no se salte todo al volver a la pestaña. */
export const DT_MAXIMO = 0.1;

// ---- mapa ----
/** Tamaño del mapa en unidades del juego. */
export const MAPA = { ancho: 3000, alto: 3000 };
/** Distancia del centro a la que aparecen los jugadores. */
export const RADIO_APARICION = 900;

// ---- jugadores y evolucion ----
/** HP (= puntaje) con el que empieza cada jugador. */
export const HP_INICIAL = 100;
/** Orbes del tipo correcto que llenan la barra de evolución. */
export const META_EVOLUCION = 20;
/** Etapa máxima. */
export const ETAPA_MAXIMA = 3;
/** Tipos de data que existen. */
export const TIPOS_DATA = /** @type {TipoData[]} */ (['data', 'vaccine', 'virus', 'free']);
/** Tipo de evolución del jugador local (Agumon es Vaccine). */
export const TIPO_JUGADOR_LOCAL = /** @type {TipoData} */ ('vaccine');

/**
 * Reglas por etapa, se usa como ETAPAS[jugador.etapa].
 * @type {Record<1|2|3, Etapa>}
 */
export const ETAPAS = {
  1: { nombre: 'Baby', digimon: 'Botamon', ataque: 0.08, costoEspecial: 0.04 },
  2: { nombre: 'In-Training', digimon: 'Koromon', ataque: 0.12, costoEspecial: 0.08 },
  3: { nombre: 'Rookie', digimon: 'Agumon', ataque: 0.16, costoEspecial: 0.12 },
};

// ---- zona ----
/** Radio de la zona segura al empezar (cubre casi todo el mapa). */
export const RADIO_ZONA_INICIAL = 1500;
/** Radio mínimo al que llega la zona al final de la partida. */
export const RADIO_ZONA_MINIMO = 200;

// ---- orbes ----
/** Orbes que hay en el mapa al mismo tiempo. */
export const CANTIDAD_ORBES = 300;
/** Radio de cada orbe. */
export const RADIO_ORBE = 8;
/** HP que da cualquier orbe, sin importar el tipo. */
export const HP_POR_ORBE = 10;

// ---- tamaño y movimiento ----
/** Radio de un jugador con 0 de hp. */
export const RADIO_BASE = 20;
/** Cuanto crece el radio con la raiz del hp. */
export const FACTOR_RADIO = 2;
/** Velocidad de los jugadores en unidades por segundo. */
export const VELOCIDAD = 250;
/** Radio maximo de un jugador, para que nunca sea mas grande que el mapa. */
export const RADIO_MAXIMO = 300;

// ---- bots ----
/** Distancia a la que un bot ve a los rivales. */
export const VISION_BOT = 600;
/** Veces por segundo (en promedio) que un bot tira el especial si tiene a alguien cerca. */
export const PROBABILIDAD_ESPECIAL_BOT = 0.5;
/** Los orbes de su tipo los ve a esta fraccion de la distancia real. */
export const PESO_ORBE_PROPIO = 0.5;
/** Que tan adentro del borde de la zona se quiere mantener un bot. */
export const MARGEN_ZONA_BOT = 100;
/** Cuantas veces mas hp tiene que tener alguien para que el bot lo vea mas fuerte. */
export const VENTAJA_HP_BOT = 1.2;

// ---- combate, especial y zona ----
// el ataque de ETAPAS (8/12/16 %) se cobra cada segundo de contacto sobre el puntaje
// maximo del que lo recibe. asi el daño depende de la etapa del que pega y no del tamaño,
// y aunque alguien sea muy grande igual llega a 0
/** Velocidad del proyectil del especial, en unidades por segundo. */
export const VELOCIDAD_PROYECTIL = 700;
/** Radio del proyectil para los choques. */
export const RADIO_PROYECTIL = 12;
/** El proyectil quita esta cantidad de veces lo que le costo al que lo tiro. */
export const MULTIPLICADOR_ESPECIAL = 2;
/** Cada cuantos segundos se cierra la zona un escalon. */
export const INTERVALO_ZONA = 60;
/** Que tan rapido se encoge la zona cuando se esta cerrando, en unidades por segundo. */
export const VELOCIDAD_CIERRE_ZONA = 40;
/** Fraccion del puntaje maximo que se pierde por segundo afuera de la zona. */
export const DANO_ZONA = 0.05;
