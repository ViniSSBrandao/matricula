import { Router } from "express";
import { authenticate, authorize } from "../../middlewares/auth.middleware";
import { asyncHandler } from "../../utils/async-handler.utils";
import {
  deleteMatricula,
  getGradeMatriculas,
  getMatriculas,
  postMatricula,
} from "./matriculas.controller";

const matriculasRouter = Router();

matriculasRouter.post(
  "/matriculas",
  authenticate,
  authorize("aluno"),
  asyncHandler(postMatricula),
);

matriculasRouter.get(
  "/matriculas",
  authenticate,
  authorize("aluno"),
  asyncHandler(getMatriculas),
);

matriculasRouter.get(
  "/matriculas/grade",
  authenticate,
  authorize("aluno"),
  asyncHandler(getGradeMatriculas),
);

matriculasRouter.delete(
  "/matriculas/:id",
  authenticate,
  authorize("aluno"),
  asyncHandler(deleteMatricula),
);

export default matriculasRouter;
