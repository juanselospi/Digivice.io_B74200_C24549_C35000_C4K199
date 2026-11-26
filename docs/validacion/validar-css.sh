#!/usr/bin/env bash
# Sube cada hoja de css/ al validador de la W3C y corre stylelint, guarda todo en resultados/css/
# Uso: bash docs/validacion/validar-css.sh (pide npm install antes)

set -euo pipefail

raiz="$(cd "$(dirname "$0")/../.." && pwd)"
salida="$raiz/docs/validacion/resultados/css"
mkdir -p "$salida"
hubo_errores=0

for hoja in "$raiz"/css/*.css; do
  nombre="$(basename "$hoja")"

  # se sube el archivo y no la URL porque el PR no se fusiona
  json="$(curl -sS -A "Digivice.io validacion" -F "file=@$hoja;type=text/css" \
               -F profile=css3svg -F output=json -F warning=1 -F lang=es \
               "https://jigsaw.w3.org/css-validator/validator")"

  resumen="$(NOMBRE="$nombre" python3 -c '
import json, os, sys, datetime
v = json.load(sys.stdin)["cssvalidation"]
errores = v.get("errors", [])
avisos = v.get("warnings", [])
print("Hoja: " + os.environ["NOMBRE"])
print("Validador: https://jigsaw.w3.org/css-validator/ (subida de archivo, perfil css3svg)")
print("Fecha: " + datetime.datetime.now().strftime("%Y-%m-%d %H:%M"))
print("Errores: %d" % len(errores))
print("Advertencias: %d" % len(avisos))
for m in errores:
    print("- ERROR linea %s: %s %s" % (m.get("line", "?"), m.get("context", ""), " ".join(m.get("message", "").split())))
for m in avisos:
    print("- ADVERTENCIA linea %s: %s" % (m.get("line", "?"), " ".join(m.get("message", "").split())))
' <<< "$json")"

  printf '%s\n' "$resumen" > "$salida/${nombre%.css}.txt"
  printf '%s\n\n' "$resumen"
  grep -q '^Errores: 0$' <<< "$resumen" || hubo_errores=1

  # el validador pide no mandar muchas solicitudes seguidas
  sleep 2
done

cd "$raiz"
if node_modules/.bin/stylelint "css/**/*.css" > "$salida/stylelint.txt" 2>&1; then
  echo "Sin errores." >> "$salida/stylelint.txt"
else
  hubo_errores=1
fi
cat "$salida/stylelint.txt"

exit "$hubo_errores"
