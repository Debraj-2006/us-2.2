import "dotenv/config";
import express, { NextFunction, Request, Response } from "express";
import cors from "cors";
import { ordersRouter } from "./routes/orders";
import { usersRouter } from "./routes/users";
import { catalogRouter } from "./routes/catalog";

const app = express();

app.use(cors({ origin: process.env.CLIENT_ORIGIN ?? "http://localhost:5173" }));
app.use(express.json());

app.use("/api/orders", ordersRouter);
app.use("/api/users", usersRouter);
app.use("/api", catalogRouter);

app.get("/api/health", (_req, res) => res.json({ ok: true }));

app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err);
  const message = err instanceof Error ? err.message : "Internal server error";
  res.status(500).json({ error: message });
});

const port = Number(process.env.PORT ?? 4000);
app.listen(port, () => {
  console.log(`Server listening on http://localhost:${port}`);
});
