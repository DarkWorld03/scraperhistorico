const puppeteer = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");

puppeteer.use(StealthPlugin());

async function scrapeGuildIds(browser) {
  const page = await browser.newPage();

  await page.setRequestInterception(true);
  page.on("request", (req) => {
    if (["image", "stylesheet", "font", "media"].includes(req.resourceType())) {
      req.abort();
    } else {
      req.continue();
    }
  });

  await page.goto("https://axieclassic.com/guilds/mGfOIl8T", {
    waitUntil: "networkidle0",
    timeout: 60000,
  });

  await page.waitForSelector('a[href^="/profile/"]', { timeout: 30000 });

  const ids = await page.evaluate(() =>
    Array.from(document.querySelectorAll('a[href^="/profile/"]'))
      .map((el) => el.getAttribute("href").replace("/profile/", ""))
      .filter(Boolean)
  );

  await page.close();
  return ids;
}

async function scrapePlayerDetails(browser, id) {
  const page = await browser.newPage();

  await page.setRequestInterception(true);
  page.on("request", (req) => {
    if (["image", "stylesheet", "font", "media"].includes(req.resourceType())) {
      req.abort();
    } else {
      req.continue();
    }
  });

  try {
    const url = `https://guildwar.axiedao.org/guild/mGfOIl8T/members/${id}`;
    await page.goto(url, { waitUntil: "networkidle0", timeout: 60000 });

    const selectorNombre =
      "body > main > div.w-full.xl\\:w-\\[1280px\\].min-h-screen.mt-\\[120px\\].p-5 > div.w-full.flex.flex-col.md\\:flex-row.justify-normal.items-center > div.w-full.min-h-\\[230px\\].flex.flex-col.justify-between.mt-auto.items-start.bg-fg-def.p-5.rounded-2xl.md\\:mr-2 > div.flex.flex-col.justify-normal.items-start > p";

    await page.waitForSelector(selectorNombre, { timeout: 15000 });
    const nombre = await page.$eval(selectorNombre, (el) => el.innerText.trim());

    await page.evaluate(() => {
      const botones = Array.from(document.querySelectorAll("button"));
      const boton = botones.find((btn) => btn.innerText.includes("Guild Points History"));
      if (boton) boton.click();
    });

    await new Promise((resolve) => setTimeout(resolve, 1000));

    await page.waitForSelector("table.w-full.table-auto.text-white", {
      timeout: 10000,
    });

    const pointsHistory = await page.$$eval(
      "table.w-full.table-auto.text-white tbody tr",
      (rows) =>
        rows.map((row) => {
          const cols = row.querySelectorAll("td");
          return {
            totalPoints: cols[0]?.textContent.trim() || null,
            date: cols[2]?.textContent.trim() || null,
          };
        })
    );

    await page.close();
    return { id, nombre, pointsHistory };
  } catch (err) {
    console.warn(`⚠️ Error al procesar ID ${id}:`, err.message);
    await page.close();
    return null;
  }
}

module.exports = async function scrapeHistorico() {
  try {
    const browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    let ids = [];
    try {
      ids = await scrapeGuildIds(browser);
      console.log(`✅ IDs extraídos (${ids.length}):\n`, ids);
    } catch (err) {
      console.warn("⚠️ No se pudieron extraer IDs:", err.message);
    }

    const results = [];
    for (const id of ids) {
      console.log(`\n⏳ Extrayendo detalles para ID: ${id}...`);
      const data = await scrapePlayerDetails(browser, id);
      if (data) {
        console.log(`✅ Nombre: ${data.nombre}`);
        if (data.pointsHistory.length) {
          data.pointsHistory.forEach((item, i) =>
            console.log(`  ${i + 1}. ${item.date} → ${item.totalPoints} pts`)
          );
        } else {
          console.log("  ⚠️ No se encontraron puntos.");
        }
        results.push(data);
      } else {
        console.log(`❌ No se pudieron extraer datos para ID: ${id}`);
      }

      await new Promise((r) => setTimeout(r, 500)); // Delay para evitar saturación
    }

    await browser.close();
    return results;
  } catch (error) {
    console.error("❌ Error general:", error);
    return [];
  }
};
