import { Router } from "express";
import { asyncHandler } from "../../utils/async-handler.utils";
import { getLoginsDisponiveis, postLogin, postRegister } from "./login.controller";

const loginRouter = Router();

loginRouter.get("/logins", asyncHandler(getLoginsDisponiveis));
loginRouter.post("/login", asyncHandler(postLogin));
loginRouter.post("/register", asyncHandler(postRegister));

export default loginRouter;
