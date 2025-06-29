import express from "express"

// importando os controllers de Users
import {registerUser, loginUser, currentUser, refreshToken, logoutUser, verifyUser, resendEmailVerification} from "../controllers/userControllers.js"

// importa o middleware de validação do JOI
import { validateJoiSchema } from "../middleware/validateJoiSchema.js";
// importa o schema do JOI
import { userRegisterSchema, userLoginSchema, userResendEmailSchema } from "../models/joi_models/usersValidateModel.js";

import { validateJwtToken } from "../middleware/validateTokenHandler.js"

// importa o router do express
const router = express.Router();


// função post, que contem: validate() primeiro, joi checa se é um objeto válido para previnir ataques > registerUser depois (direto do mongoose, com validação de db também)
router.post("/register", validateJoiSchema(userRegisterSchema), registerUser)
// função post que valida apenas alguns dados de login
router.post("/login", validateJoiSchema(userLoginSchema), loginUser)

router.get("/current", validateJwtToken, currentUser)

// route para atualizar o token, não precisa de validação aqui pois os cookies são lidos em index.js com o cookie parser e validados dentro da funçao
router.post("/refresh", refreshToken);
// route para logout
router.post("/logout", logoutUser);

router.post('/verify', verifyUser)

router.post('/resend-verification', validateJoiSchema(userResendEmailSchema), resendEmailVerification)

export default router