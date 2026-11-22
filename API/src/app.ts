import express, { Express, Request, Response } from "express";
import loginRouter from "./domains/login/login.routes";
import meRouter from "./domains/me/me.routes";
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

app.use("/auth", loginRouter);
app.use("/auth", meRouter);
app.use("/", loginRouter);
app.use("/", meRouter);

app.use(errorHandlerMiddleware);

export default app;
