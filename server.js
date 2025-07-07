const express = require("express");
const scrapeHistorico = require("./scraperHistorico");
const subirAGithub = require("./subirAGithub");

const app = express();

app.get("/ejecutar-scraper-historico", async (req, res) => {
  try {
    const data = await scrapeHistorico();
    if (!data || data.length === 0) throw new Error("No se pudo scrapear.");

    const filename = "historico.json";
    const content = JSON.stringify(data, null, 2);

    await subirAGithub({
      repo: "DarkWorld03/guild-data",
      path: `historico/${filename}`,  // carpeta historico
      content,
      message: "📦 Actualización automática de historico.json",
      token: process.env.GITHUB_TOKEN,
    });

    res.send("✅ JSON histórico generado y subido a GitHub");
  } catch (err) {
    console.error("❌ Error al ejecutar scraper histórico:", err);
    res.status(500).send("❌ Error general");
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Servidor activo en puerto ${PORT}`));


