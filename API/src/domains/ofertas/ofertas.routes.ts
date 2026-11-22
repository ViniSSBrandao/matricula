import { Router } from "express";
import { authenticate, authorize } from "../../middlewares/auth.middleware";
import { asyncHandler } from "../../utils/async-handler.utils";
import { getOfertas } from "./ofertas.controller";

const ofertasRouter = Router();

ofertasRouter.get(
  "/ofertas",
  authenticate,
  authorize("aluno"),
  asyncHandler(getOfertas),
);

export default ofertasRouter;
