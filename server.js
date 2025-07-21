const express = require("express");
const scrapeHistorico = require("./scraperHistorico");
const subirAGithub = require("./subirAGithub");

const app = express();

app.get("/ping", (req, res) => {
  res.send("🏓 Ping recibido (scraperHistorico)");
});

app.get("/ejecutar-scraper-historico", (req, res) => {
  res.send("⏳ Scraper histórico iniciado en segundo plano");

  setTimeout(async () => {
    try {
      const data = await scrapeHistorico();
      if (!data || data.length === 0) throw new Error("No se pudo scrapear.");

      const filename = "historico.json";
      const content = JSON.stringify(data, null, 2);

      await subirAGithub({
        repo: "DarkWorld03/guild-data",
        path: `historico/${filename}`,
        content,
        message: "📦 Actualización automática de historico.json",
        token: process.env.GITHUB_TOKEN,
      });

      console.log("✅ Archivo histórico subido con éxito.");
    } catch (err) {
      console.error("❌ Error en scraperHistorico:", err);
    }
  }, 100);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () =>
  console.log(`✅ Servidor activo scraperHistorico en puerto ${PORT}`)
);


