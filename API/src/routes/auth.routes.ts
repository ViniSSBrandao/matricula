import { Router } from "express";
import { getLoginsDisponiveis, getMe, postLogin } from "../controllers/auth.controller";
import { authMiddleware } from "../middlewares/auth.middleware";

const authRouter = Router();

authRouter.get("/logins", getLoginsDisponiveis);
authRouter.post("/login", postLogin);
authRouter.get("/me", authMiddleware, getMe);

export default authRouter;
