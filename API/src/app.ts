import express, { Express, Request, Response } from "express";
import { corsMiddleware } from "./middlewares/cors.middleware";
import authRouter from "./routes/auth.routes";

const app: Express = express();

app.use(corsMiddleware);
app.use(express.json());

app.get("/", (_req: Request, res: Response) => {
  return res.status(200).send({
    message: "Hello World!",
  });
});

app.use("/auth", authRouter);

export default app;
