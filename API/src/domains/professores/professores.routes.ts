import { Router } from "express";
import { authenticate, authorize } from "../../middlewares/auth.middleware";
import { asyncHandler } from "../../utils/async-handler.utils";
import { getProfessores, postProfessor } from "./professores.controller";

const professoresRouter = Router();

professoresRouter.get(
  "/professores",
  authenticate,
  authorize("servidor"),
  asyncHandler(getProfessores),
);

professoresRouter.post(
  "/professores",
  authenticate,
  authorize("servidor"),
  asyncHandler(postProfessor),
);

export default professoresRouter;
