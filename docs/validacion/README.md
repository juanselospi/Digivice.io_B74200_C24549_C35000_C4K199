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
