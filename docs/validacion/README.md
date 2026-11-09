# Validación W3C

Evidencia de que todas las páginas del sitio son HTML válido según el [validador de la W3C](https://validator.w3.org/nu/).

## Resultados

| Página | Captura | Resultado (entrada directa) | Validar versión publicada |
| :---- | :---- | :---- | :---- |
| Inicio | [index.png](index.png) | [resultados/index.txt](resultados/index.txt) | [Validar](https://validator.w3.org/nu/?doc=https%3A%2F%2Fjuanselospi.github.io%2FDigivice.io_B74200_C24549_C35000_C4K199%2Findex.html) |
| Lobby | [lobby.png](lobby.png) | [resultados/lobby.txt](resultados/lobby.txt) | [Validar](https://validator.w3.org/nu/?doc=https%3A%2F%2Fjuanselospi.github.io%2FDigivice.io_B74200_C24549_C35000_C4K199%2Flobby.html) |
| Juego | [juego.png](juego.png) | [resultados/juego.txt](resultados/juego.txt) | [Validar](https://validator.w3.org/nu/?doc=https%3A%2F%2Fjuanselospi.github.io%2FDigivice.io_B74200_C24549_C35000_C4K199%2Fjuego.html) |
| Reglas | [reglas.png](reglas.png) | [resultados/reglas.txt](resultados/reglas.txt) | [Validar](https://validator.w3.org/nu/?doc=https%3A%2F%2Fjuanselospi.github.io%2FDigivice.io_B74200_C24549_C35000_C4K199%2Freglas.html) |
| Acerca de | [acerca.png](acerca.png) | [resultados/acerca.txt](resultados/acerca.txt) | [Validar](https://validator.w3.org/nu/?doc=https%3A%2F%2Fjuanselospi.github.io%2FDigivice.io_B74200_C24549_C35000_C4K199%2Facerca.html) |
| Créditos | [creditos.png](creditos.png) | [resultados/creditos.txt](resultados/creditos.txt) | [Validar](https://validator.w3.org/nu/?doc=https%3A%2F%2Fjuanselospi.github.io%2FDigivice.io_B74200_C24549_C35000_C4K199%2Fcreditos.html) |

Los enlaces de la última columna validan directamente la página publicada.

## Cómo volver a validar

correr desde la raíz del repositorio:

```bash
bash docs/validacion/validar.sh
```

El script manda cada `.html` de la raíz (menos `plantilla.html`) al validador y guarda el resultado en `resultados/<pagina>.txt`.

## Validación del CSS

Las hojas se suben como archivo al [validador CSS de la W3C](https://jigsaw.w3.org/css-validator/) (no por URL, porque el PR no se fusiona) y se pasan por stylelint. Resultados en [resultados/css/](resultados/css/).

```bash
npm install
bash docs/validacion/validar-css.sh
```

Las advertencias del validador son todas el aviso de que `var()` no se revisa estáticamente.

| Hoja | Errores W3C | stylelint |
| :---- | :---- | :---- |
| tokens.css | 0 | sin errores |
| common.css | 0 | sin errores |
| index.css | 0 | sin errores |
| juego.css | 0 | sin errores |
| reglas.css | 0 | sin errores |
| creditos.css | 0 | sin errores |
| lobby.css | pendiente, aún no existe | pendiente |
| acerca.css | pendiente, aún no existe | pendiente |

## Revisión de accesibilidad y responsive

Revisión automática en Chromium (axe-core con reglas WCAG A y AA, recorrido con Tab, `prefers-reduced-motion` emulado y anchos de 320, 768 y 1280 px).

| Página | Hoja propia | Violaciones axe | Foco visible | Movimiento reducido | Desborde horizontal |
| :---- | :---- | :---- | :---- | :---- | :---- |
| Inicio | sí | 0 | sí | sin animaciones | 13 px a 320 px, pendiente |
| Juego | sí | 0 | sí | sin animaciones | no |
| Reglas | sí | 0 | sí | sin animaciones | no |
| Créditos | sí | 0 | sí | sin animaciones | no |
| Lobby | pendiente | 0 | sí | sin animaciones | no |
| Acerca de | pendiente | 0 | sí | sin animaciones | no |

Lobby y Acerca de se revisaron sin su hoja, hay que repetir la revisión cuando existan. En Juego (32 elementos) y Lobby (4) axe no pudo determinar el contraste y queda por revisar a mano, igual que la regla de no transmitir información solo con color.
