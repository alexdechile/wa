/**
 * Regenera las capturas de docs/capturas/ contra producción.
 *
 *   node docs/capturas/capturar.mjs
 *
 * Necesita Playwright y un Chrome. En este servidor Playwright vive en otro
 * proyecto, así que se resuelve por rutas candidatas (ver `cargarPlaywright`).
 * Si no aparece, el script lo dice y no hace nada.
 *
 * Dos trampas que costaron una captura fallida cada una:
 *
 *  1. Hay que esperar a que el estado de horario se resuelva. Si se dispara la
 *     foto antes, sale "Verificando horario…" y la imagen no sirve.
 *  2. El estado "en horario hábil" no se puede fotografiar un domingo: se fuerza
 *     interceptando GET /api/time. Se usa la misma respuesta que devuelve el
 *     servidor de verdad, no una inventada.
 */
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const SITIO = "https://wa.comerza.cl/";

const CANDIDATOS_PLAYWRIGHT = [
  "playwright",
  "/home/alexdechile/proyectos/mcp-supermercados-cl/node_modules/playwright/index.mjs",
];

async function cargarPlaywright() {
  for (const candidato of CANDIDATOS_PLAYWRIGHT) {
    try {
      return await import(candidato);
    } catch {
      // siguiente
    }
  }
  throw new Error(
    "No se encontró Playwright. Instalalo (`npm i -D playwright`) o ajustá CANDIDATOS_PLAYWRIGHT.",
  );
}

function buscarChrome() {
  for (const bin of [
    "/usr/bin/google-chrome-stable",
    "/usr/bin/google-chrome",
    "/usr/bin/chromium",
    "/usr/bin/chromium-browser",
  ]) {
    if (existsSync(bin)) return bin;
  }
  throw new Error("No se encontró Chrome/Chromium para lanzar el navegador.");
}

/** Respuesta real de GET /api/time dentro de horario hábil. */
const RESPUESTA_EN_HORARIO = {
  isHumanHours: true,
  isLunchBreak: false,
  statusMessage: "Estamos atendiendo",
  scheduleMessage: "Lunes a viernes de 8:30 a 13:00 y de 14:00 a 17:30",
};

async function capturar(browser, nombre, opciones) {
  const {
    width,
    height,
    enHorario = false,
    tutorial = false,
    url = SITIO,
    esperarTexto,
  } = opciones;

  const page = await browser.newPage({
    viewport: { width, height },
    locale: "es-CL",
  });

  if (enHorario) {
    await page.route("**/api/time*", (route) =>
      route.fulfill({
        status: 200,
        headers: { "content-type": "application/json" },
        body: JSON.stringify(RESPUESTA_EN_HORARIO),
      }),
    );
  }
  // La telemetría no aporta a la captura y ensucia la red.
  await page.route("**/api/track*", (route) => route.fulfill({ status: 200, body: "{}" }));

  await page.goto(url, { waitUntil: "networkidle" });

  if (esperarTexto) {
    await page
      .waitForFunction((texto) => document.body.innerText.includes(texto), esperarTexto, {
        timeout: 15000,
      })
      .catch(() => console.warn(`  aviso: no apareció "${esperarTexto}", se captura igual`));
  }

  if (tutorial) {
    await page.locator("header button").last().click();
  }

  await page.waitForTimeout(600);
  await page.screenshot({ path: path.join(AQUI, nombre) });
  await page.close();
  console.log(`ok  ${nombre}`);
}

const { chromium } = await cargarPlaywright();
const browser = await chromium.launch({ executablePath: buscarChrome(), headless: true });

try {
  // El estado real del momento: si se corre en horario hábil, esta captura
  // mostrará atención humana. El nombre del archivo asume fuera de horario.
  await capturar(browser, "01-movil-fuera-horario.png", {
    width: 390,
    height: 844,
    esperarTexto: "asistente te responde",
  });

  await capturar(browser, "02-movil-horario-habil.png", {
    width: 390,
    height: 844,
    enHorario: true,
    esperarTexto: "Estamos atendiendo",
  });

  await capturar(browser, "03-escritorio-horario-habil.png", {
    width: 1280,
    height: 900,
    enHorario: true,
    esperarTexto: "Estamos atendiendo",
  });

  await capturar(browser, "04-movil-tutorial-deslizar.png", {
    width: 390,
    height: 844,
    tutorial: true,
    esperarTexto: "ayudarte",
  });

  await capturar(browser, "05-panel-login.png", {
    width: 1280,
    height: 900,
    url: `${SITIO}panel/`,
    esperarTexto: "Panel interno",
  });
} finally {
  await browser.close();
}

console.log("\nListo. Si cambió alguna pantalla, actualizá ascii.md también.");
