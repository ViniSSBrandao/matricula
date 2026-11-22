import { Router } from "express";
import { authenticate, authorize } from "../../middlewares/auth.middleware";
import { asyncHandler } from "../../utils/async-handler.utils";
import { getDisciplinas, postDisciplina, putDisciplina } from "./disciplinas.controller";

const disciplinasRouter = Router();

disciplinasRouter.get(
  "/disciplinas",
  authenticate,
  authorize("servidor"),
  asyncHandler(getDisciplinas),
);

disciplinasRouter.post(
  "/disciplinas",
  authenticate,
  authorize("servidor"),
  asyncHandler(postDisciplina),
);

disciplinasRouter.put(
  "/disciplinas/:id",
  authenticate,
  authorize("servidor"),
  asyncHandler(putDisciplina),
);

export default disciplinasRouter;
