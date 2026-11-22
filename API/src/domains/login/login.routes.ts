import { Router } from "express";
import { asyncHandler } from "../../utils/async-handler.utils";
import { getLoginsDisponiveis, postLogin } from "./login.controller";

const loginRouter = Router();

loginRouter.get("/logins", asyncHandler(getLoginsDisponiveis));
loginRouter.post("/login", asyncHandler(postLogin));

export default loginRouter;
