import { Router } from "express";
import { authMiddleware } from "../../middlewares/auth.middleware";
import { getMe } from "./me.controller";

const meRouter = Router();

meRouter.get("/me", authMiddleware, getMe);

export default meRouter;
