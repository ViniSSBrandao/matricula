import { Router } from "express";
import { asyncHandler } from "../../utils/async-handler.utils";
import { getCursos } from "./cursos.controller";

const cursosRouter = Router();

cursosRouter.get("/cursos", asyncHandler(getCursos));

export default cursosRouter;
