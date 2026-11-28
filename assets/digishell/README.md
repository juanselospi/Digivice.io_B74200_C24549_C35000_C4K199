# Sprites de los Digimon

Acá van los sprites de todos los Digimon del juego. Son propiedad de Bandai,
los usamos solo para este proyecto académico, sin fines de lucro.

## Cómo está organizado

Una carpeta por línea evolutiva y adentro una carpeta por etapa:

```
assets/digishell/
  3 - Agumon EX/
    Egg/        tamago012_0.png ...
    Botamon/    c0187_0.png ...
    Koromon/    c0188_0.png ...
    Agumon/     c0189_0.png ...   <- este _0 es el que se usa en Inicio
  4 - Gabumon EX/
    Egg/ Punimon/ Tsunomon/ Gabumon/
```

Dentro de cada etapa:

- `cXXXX.png` es la hoja completa con todos los cuadros.
- `cXXXX_0.png` es el Digimon quieto, de frente. Ese es el que va en Inicio.
- Los demás `_N.png` son los cuadros de caminar, atacar, etc. (para el JS del juego).

## Cómo agregar un Digimon nuevo

1. Copiar la carpeta del Digimon acá adentro, con la misma estructura de etapas.
2. En `index.html`, dentro del `fieldset` de "Elegir digimon", copiar un `li`
   completo y cambiar el id, el value, el nombre, el tipo y la ruta del sprite `_0`.
3. Ojo con los espacios en las rutas: en el HTML van como `%20`
   (ej: `assets/digishell/3%20-%20Agumon%20EX/Agumon/c0189_0.png`).
4. Anotar el Digimon nuevo también en `creditos.html`.
