import { Router } from "express";
import { authenticate, authorize } from "../../middlewares/auth.middleware";
import { asyncHandler } from "../../utils/async-handler.utils";
import { getTurmas, patchVagasTurma, postTurma } from "./turmas.controller";

const turmasRouter = Router();

turmasRouter.get(
  "/turmas",
  authenticate,
  authorize("servidor"),
  asyncHandler(getTurmas),
);

turmasRouter.post(
  "/turmas",
  authenticate,
  authorize("servidor"),
  asyncHandler(postTurma),
);

turmasRouter.patch(
  "/turmas/:id/vagas",
  authenticate,
  authorize("servidor"),
  asyncHandler(patchVagasTurma),
);

export default turmasRouter;
