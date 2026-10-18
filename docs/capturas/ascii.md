# wa.comerza.cl en ASCII — para modelos sin visión

Representación textual fiel de lo que se ve en las capturas `.png` de esta
carpeta. Existe porque no todo agente que lee este repo puede mirar imágenes.

**Convenciones de esta representación**

- Las cajas `┌─┐└─┘` son **botones** (son rectángulos redondeados en la realidad).
- Lo que está entre `( )` es el **ícono** del botón, no texto visible.
- Los textos están **transcritos literalmente**, con sus tildes y mayúsculas.
- El orden vertical es el orden real en pantalla.
- La columna de la derecha resume el aspecto visual, que el ASCII no puede
  mostrar.

**Lenguaje visual del sitio** (importante para entender el diseño):

| Elemento | Realidad |
|---|---|
| Fondo | Azul marino oscuro, `#182260` |
| Botones | Naranja pleno `#F59E0B`, esquinas muy redondeadas, texto blanco en negrita |
| Texto secundario | Blanco al 70 % de opacidad |
| Punto de estado | Verde `●` si hay atención humana, gris/azul `●` si no |
| Tamaño | Botones grandes a propósito: la página está pensada para adultos mayores |

---

## 01 — Inicio, fuera de horario · móvil 390×844

Archivo: `01-movil-fuera-horario.png`

```
┌────────────────────────────────────────┐
│ ✳ COMERZA            (A-) (A+) (?)     │  ← logo + control de tamaño
│                                        │
│        ¿En qué podemos                 │
│           ayudarte?                    │
│                                        │
│         ● Fuera de horario             │  ← punto GRIS
│           de atención                  │
│                                        │
│     Nuestro asistente te responde      │
│     ahora; en horario hábil te         │
│     contacta una persona               │
│                                        │
│  ┌──────────────────────────────────┐  │
│  │ (bolsa)   Visitar Tienda Online  │  │  → https://www.comerza.cl
│  └──────────────────────────────────┘  │
│                                        │
│  ┌──────────────────────────────────┐  │
│  │ (globo)   Consultas y Soporte    │  │  → WhatsApp línea del ASISTENTE
│  └──────────────────────────────────┘  │
│                                        │
│  ┌──────────────────────────────────┐  │
│  │ (carro)   Ventas y Cotizaciones  │  │  → WhatsApp línea del ASISTENTE
│  └──────────────────────────────────┘  │
│                                        │
│  ┌──────────────────────────────────┐  │
│  │ (lista)   Enviar Lista de        │  │  → WhatsApp del ASISTENTE
│  │           Materiales             │  │
│  └──────────────────────────────────┘  │
│                                        │
│   ¿Tienes el modelo del arquitecto?    │  ← texto chico, sin botón
│   También aceptamos archivos IFC       │
│   (BIM).                               │
│                                        │
│  ┌──────────────────────────────────┐  │
│  │ (sobre)   Enviar un Email        │  │  → mailto:ventas@comerza.cl
│  └──────────────────────────────────┘  │
│                                        │
│      Contactos atendidos hoy: 0        │  ← contador local del navegador
└────────────────────────────────────────┘
```

---

## 02 — Inicio, en horario hábil · móvil 390×844

Archivo: `02-movil-horario-habil.png`

Mismo diseño que la 01. **Solo cambian el punto de estado y los dos textos:**

```
│         ● Estamos atendiendo           │  ← punto VERDE
│   Lunes a viernes de 8:30 a 13:00      │
│        y de 14:00 a 17:30              │
```

Y los botones de **Consultas y Soporte** y **Ventas y Cotizaciones** apuntan a
la **línea humana** (`+56 2 2683 0645`) en vez de al asistente. Los otros tres
no cambian.

Existe un tercer estado, **pausa de almuerzo** (13:00–14:00), que el sitio trata
como fuera de horario a propósito:

```
│         ● Estamos en pausa de almuerzo │
│      Nuestro asistente te responde     │
│           ahora mismo                  │
```

---

## 03 — Inicio, en horario hábil · escritorio 1280×900

Archivo: `03-escritorio-horario-habil.png`

Es la misma pantalla que la 02, con la columna centrada y más aire. Los cinco
botones entran completos y el pie (`Contactos atendidos hoy: 0`) queda al borde
inferior.

```
┌──────────────────────────────────────────────────────────────┐
│   ✳ COMERZA                            (A-) (A+) (?)         │
│                                                              │
│                  ¿En qué podemos ayudarte?                   │
│                                                              │
│                    ● Estamos atendiendo                      │
│          Lunes a viernes de 8:30 a 13:00 y de 14:00 a 17:30  │
│                                                              │
│              ┌──────────────────────────────────────┐        │
│              │  (bolsa) Visitar Tienda Online       │        │
│              └──────────────────────────────────────┘        │
│              ┌──────────────────────────────────────┐        │
│              │  (globo) Consultas y Soporte         │        │
│              └──────────────────────────────────────┘        │
│              ┌──────────────────────────────────────┐        │
│              │  (carro) Ventas y Cotizaciones       │        │
│              └──────────────────────────────────────┘        │
│              ┌──────────────────────────────────────┐        │
│              │  (lista) Enviar Lista de Materiales  │        │
│              └──────────────────────────────────────┘        │
│                                                              │
│    ¿Tienes el modelo del arquitecto? También aceptamos        │
│                  archivos IFC (BIM).                          │
│                                                              │
│              ┌──────────────────────────────────────┐        │
│              │  (sobre) Enviar un Email             │        │
│              └──────────────────────────────────────┘        │
│                    Contactos atendidos hoy: 0                │
└──────────────────────────────────────────────────────────────┘
```

---

## 04 — Tutorial de deslizamiento · móvil 390×844

Archivo: `04-movil-tutorial-deslizar.png`

Se abre al tocar el botón `(?)` del encabezado. Es un panel flotante sobre el
sitio oscurecido, y enseña el gesto de cambiar el tamaño del texto (una
necesidad de accesibilidad para adultos mayores).

```
┌────────────────────────────────────────┐
│ ✳ COMERZA            (A-) (A+) (?)     │  ← fondo atenuado
│  · · · contenido del sitio atenuado · │
│                                        │
│  ┌──────────────────────────────────┐  │
│  │          Gesto Rápido            │  │  ← panel flotante
│  │                                  │  │
│  │   Usa un dedo para deslizar en   │  │
│  │   diagonal por la pantalla y     │  │
│  │   cambiar el tamaño del texto.   │  │
│  │                                  │  │
│  │  ┌────────────────────────────┐  │  │
│  │  │ Agrandar Texto      (↗)    │  │  │
│  │  │ Desliza arriba y a la      │  │  │
│  │  │ derecha                    │  │  │
│  │  └────────────────────────────┘  │  │
│  │  ┌────────────────────────────┐  │  │
│  │  │ Achicar Texto       (↙)    │  │  │
│  │  │ Desliza abajo y a la       │  │  │
│  │  │ izquierda                  │  │  │
│  │  └────────────────────────────┘  │  │
│  │                                  │  │
│  │      ┌──────────────────┐        │  │
│  │      │    Entendido     │        │  │  ← naranja, cierra el panel
│  │      └──────────────────┘        │  │
│  └──────────────────────────────────┘  │
└────────────────────────────────────────┘
```

---

## 05 — Login del panel interno · escritorio 1280×900

Archivo: `05-panel-login.png`

`wa.comerza.cl/panel/` — no es la cara al público. Es el tablero de dos personas
donde se ven los leads y la telemetría. No tiene contraseña: manda un código de
un uso por WhatsApp.

```
┌──────────────────────────────────────────────────────────────┐
│   ✳ COMERZA                                                  │
│                                                              │
│   Panel interno                                              │
│                                                              │
│   Acceso solo para personas autorizadas.                     │
│   Te enviamos un código por WhatsApp.                        │
│                                                              │
│   Correo:  ┌──────────────────────────────┐                  │
│            └──────────────────────────────┘                  │
│            ┌──────────────────┐                              │
│            │  Enviar código   │                              │
│            └──────────────────┘                              │
└──────────────────────────────────────────────────────────────┘
```

---

## Lo que el ASCII no muestra y hay que saber

- **Los botones se abren en otra pestaña** (`target=_blank`) y llevan un texto
  precargado en WhatsApp para que la persona no tenga que escribir el contexto.
- **El texto precargado de cada botón** (esto no se ve en la captura, aparece al
  abrir WhatsApp):

  | Botón | Texto precargado |
  |---|---|
  | Consultas y Soporte | `Hola, necesito ayuda con...` |
  | Ventas y Cotizaciones | `Hola, quisiera cotizar...` |
  | Enviar Lista de Materiales | `Hola, quiero cotizar una lista de materiales. Se la envío en foto, texto, Excel o el modelo IFC de la obra:` |

- **A qué línea va cada botón** lo decide el horario del **servidor**, no el
  navegador. Fuera de horario todo el tráfico de conversación va al asistente.
  Ver `lib/routing.ts`.
- **El contador «Contactos atendidos hoy» es local** (localStorage del
  navegador): no es una métrica del negocio y se reinicia cada día.
