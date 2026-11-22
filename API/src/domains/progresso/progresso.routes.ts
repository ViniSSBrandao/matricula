import { Router } from "express";
import { authenticate, authorize } from "../../middlewares/auth.middleware";
import { asyncHandler } from "../../utils/async-handler.utils";
import { getProgresso } from "./progresso.controller";

const progressoRouter = Router();

progressoRouter.get(
  "/progresso",
  authenticate,
  authorize("aluno"),
  asyncHandler(getProgresso),
);

export default progressoRouter;
