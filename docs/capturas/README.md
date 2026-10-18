# Capturas de wa.comerza.cl

Imágenes reales del sitio en producción, para que cualquier agente (o persona)
vea de qué se está hablando sin tener que abrir un navegador.

**Si no podés ver imágenes, leé [`ascii.md`](./ascii.md)**: tiene las mismas
pantallas transcritas en texto, con los textos literales, el orden de los
elementos y el lenguaje visual.

## Archivos

| Archivo | Qué muestra | Viewport |
|---|---|---|
| [01-movil-fuera-horario.png](./01-movil-fuera-horario.png) | Inicio con el asistente atendiendo (noche/fin de semana/almuerzo) | 390×844 |
| [02-movil-horario-habil.png](./02-movil-horario-habil.png) | Inicio con atención humana disponible | 390×844 |
| [03-escritorio-horario-habil.png](./03-escritorio-horario-habil.png) | La misma pantalla en escritorio | 1280×900 |
| [04-movil-tutorial-deslizar.png](./04-movil-tutorial-deslizar.png) | Panel «Gesto Rápido» (accesibilidad: tamaño del texto) | 390×844 |
| [05-panel-login.png](./05-panel-login.png) | Login del panel interno (no público) | 1280×900 |

## Cómo se obtuvieron

- Contra **producción** (`https://wa.comerza.cl`), no contra el build local.
- Capturadas el **2026-10-18** (domingo por la tarde en Santiago), así que la
  `01` refleja el estado real de ese momento: fuera de horario.
- El estado **en horario hábil** (`02` y `03`) no se puede fotografiar un
  domingo, así que se forzó **interceptando `GET /api/time`** en el navegador
  con la respuesta real del servidor. `isHumanHours: true` es exactamente lo
  que devuelve el endpoint un martes a las 10:00; no se inventó ninguna pantalla.
- El **tutorial** (`04`) se capturó haciendo clic en el botón `(?)` del
  encabezado.

Si tomás capturas nuevas, **actualizá `ascii.md` también**: una captura sin su
versión en texto deja afuera a los agentes sin visión, que son la mayoría de los
que leen este repo.

## Regenerarlas

Con Chrome y Playwright ya instalados en el servidor:

```bash
# estática simple (estado real del momento)
google-chrome-stable --headless=new --hide-scrollbars \
  --window-size=390,844 --virtual-time-budget=5000 \
  --screenshot=01-movil-fuera-horario.png https://wa.comerza.cl/
```

Para los estados que dependen del horario hace falta interceptar la API;
`/tmp/capturas.mjs` fue el script usado (intercepta `**/api/time*` y
`**/api/track*`, y espera a que el texto de estado se resuelva antes de
disparar la foto). Lo importante: **esperar a que desaparezca
«Verificando horario…»**, o la captura queda en estado de carga — pasó en el
primer intento.

## Qué NO es esto

No son mockups ni diseños propuestos: son el sitio tal como lo ve un cliente
hoy. Si una captura no coincide con el código, la captura es la vieja.
