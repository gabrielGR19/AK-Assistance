import express from "express";
import { config } from "./config";
import { retellRouter } from "./webhook/retell.router";
import { whatsappRouter } from "./whatsapp/whatsapp.router";
import { n8nRouter } from "./n8n/n8n.router";

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "ak-assistance", timestamp: new Date().toISOString() });
});

app.use("/webhook/retell", retellRouter);
app.use("/webhook/whatsapp", whatsappRouter);
app.use("/n8n", n8nRouter);

app.listen(Number(config.PORT), () => {
  console.log(`🚀 AK-Assistance läuft auf Port ${config.PORT} [${config.NODE_ENV}]`);
});
