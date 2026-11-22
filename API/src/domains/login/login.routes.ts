import { Router } from "express";
import { getLoginsDisponiveis, postLogin } from "./login.controller";

const loginRouter = Router();

loginRouter.get("/logins", getLoginsDisponiveis);
loginRouter.post("/login", postLogin);

export default loginRouter;
