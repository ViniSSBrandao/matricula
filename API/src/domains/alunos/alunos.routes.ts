import { Router } from "express";
import { authenticate, authorize } from "../../middlewares/auth.middleware";
import { asyncHandler } from "../../utils/async-handler.utils";
import { deleteAluno, getAlunos, postAluno } from "./alunos.controller";

const alunosRouter = Router();

alunosRouter.get(
  "/alunos",
  authenticate,
  authorize("servidor"),
  asyncHandler(getAlunos),
);

alunosRouter.post(
  "/alunos",
  authenticate,
  authorize("servidor"),
  asyncHandler(postAluno),
);

alunosRouter.delete(
  "/alunos/:id",
  authenticate,
  authorize("servidor"),
  asyncHandler(deleteAluno),
);

export default alunosRouter;
