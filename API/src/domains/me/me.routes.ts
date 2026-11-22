import { Router } from "express";
import { authMiddleware } from "../../middlewares/auth.middleware";
import { asyncHandler } from "../../utils/async-handler.utils";
import { getMe } from "./me.controller";

const meRouter = Router();

meRouter.get("/me", authMiddleware, asyncHandler(getMe));

export default meRouter;
