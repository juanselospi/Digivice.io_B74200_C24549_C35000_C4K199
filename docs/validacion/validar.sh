# Script de validación de la W3C hecho con Claude :P

#!/usr/bin/env bash
# Pasa todas las paginas .html de la raiz del repo por el validador de la W3C
# (https://validator.w3.org/nu/) y guarda el resultado de cada una en
# docs/validacion/resultados/<pagina>.txt
#
# Uso (desde cualquier carpeta):
#   bash docs/validacion/validar.sh
#
# Devuelve codigo de salida 1 si alguna pagina tiene errores.

set -euo pipefail

raiz="$(cd "$(dirname "$0")/../.." && pwd)"
salida="$raiz/docs/validacion/resultados"
mkdir -p "$salida"

validador="https://validator.w3.org/nu/?out=json"
hubo_errores=0

for pagina in "$raiz"/*.html; do
  nombre="$(basename "$pagina")"
  # la plantilla no es una pagina del sitio
  [ "$nombre" = "plantilla.html" ] && continue

  json="$(curl -sS -H "Content-Type: text/html; charset=utf-8" \
               -A "Digivice.io validacion" \
               --data-binary @"$pagina" "$validador")"

  resumen="$(NOMBRE="$nombre" python3 -c '
import json, os, sys, datetime
datos = json.load(sys.stdin)
mensajes = datos.get("messages", [])
errores = [m for m in mensajes if m.get("type") == "error"]
avisos = [m for m in mensajes if m.get("type") == "info" and m.get("subType") == "warning"]
print("Pagina: " + os.environ["NOMBRE"])
print("Validador: https://validator.w3.org/nu/ (entrada directa)")
print("Fecha: " + datetime.datetime.now().strftime("%Y-%m-%d %H:%M"))
print("Errores: %d" % len(errores))
print("Advertencias: %d" % len(avisos))
for m in errores + avisos:
    tipo = "ERROR" if m.get("type") == "error" else "ADVERTENCIA"
    print("- %s linea %s: %s" % (tipo, m.get("lastLine", "?"), m.get("message", "")))
if not errores:
    print("Resultado: Document checking completed. No errors or warnings to show." if not avisos else "Resultado: sin errores.")
' <<< "$json")"

  printf '%s\n' "$resumen" > "$salida/${nombre%.html}.txt"
  printf '%s\n\n' "$resumen"

  if ! grep -q '^Errores: 0$' <<< "$resumen"; then
    hubo_errores=1
  fi

  # el validador pide no mandar muchas solicitudes seguidas
  sleep 1
done

exit "$hubo_errores"
