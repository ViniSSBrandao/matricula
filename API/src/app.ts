import express, { Express, Request, Response } from "express";
import loginRouter from "./domains/login/login.routes";
import matriculasRouter from "./domains/matriculas/matriculas.routes";
import meRouter from "./domains/me/me.routes";
import ofertasRouter from "./domains/ofertas/ofertas.routes";
import progressoRouter from "./domains/progresso/progresso.routes";
import { corsMiddleware } from "./middlewares/cors.middleware";
import { errorHandlerMiddleware } from "./middlewares/error-handler.middleware";

const app: Express = express();

app.use(corsMiddleware);
app.use(express.json());

app.get("/", (_req: Request, res: Response) => {
  return res.status(200).send({
    message: "Hello World!",
  });
});

app.get("/health", (_req: Request, res: Response) => {
  return res.status(200).json({ status: "ok" });
});

app.use("/auth", loginRouter);
app.use("/auth", meRouter);
app.use("/", loginRouter);
app.use("/", meRouter);
app.use("/", ofertasRouter);
app.use("/", matriculasRouter);
app.use("/", progressoRouter);

app.use(errorHandlerMiddleware);

export default app;
