import express from "express"

// importando os controllers de Users
import {registerUser, loginUser, currentUser, refreshToken, logoutUser, verifyUser, resendEmailVerification, forgotPassword, resetPassword, verifyResetPassword} from "../controllers/userControllers.js"

// importa o middleware de validação do JOI
import { validateJoiSchema } from "../middleware/validateJoiSchema.js";
// importa o schema do JOI
import { userRegisterSchema, userLoginSchema, userEmailSchema, cryptoTokenSchema, userPasswordSchema } from "../models/joi_models/usersValidateModel.js";

import { validateJwtToken } from "../middleware/validateTokenHandler.js"

import { rateLimitHandler } from "../middleware/rateLimitHandler.js";

// importa o router do express
const router = express.Router();


// função post, que contem: validate() primeiro, joi checa se é um objeto válido para previnir ataques > registerUser depois (direto do mongoose, com validação de db também)
router.post("/register", validateJoiSchema(userRegisterSchema, "body"), registerUser)
// função post que valida apenas alguns dados de login
router.post("/login", rateLimitHandler(10 * 60 * 1000, 5), validateJoiSchema(userLoginSchema, "body"), loginUser)

router.get("/current", validateJwtToken, currentUser)

// route para atualizar o token, não precisa de validação aqui pois os cookies são lidos em index.js com o cookie parser e validados dentro da funçao
router.post("/refresh", refreshToken);
// route para logout
router.post("/logout", logoutUser);

// query pega os dados que vem dps do ? ex: ?token=123 (é diferente de params, que é /:123)
router.post('/verify', validateJoiSchema(cryptoTokenSchema, "query"), verifyUser)

router.post('/resend-verification', validateJoiSchema(userEmailSchema, "body"), resendEmailVerification)

router.post('/forgot-password', validateJoiSchema(userEmailSchema, "body"), forgotPassword)

router.get('/reset-password', validateJoiSchema(cryptoTokenSchema, "query"), verifyResetPassword)

router.post('/reset-password', validateJoiSchema(cryptoTokenSchema, "query"), validateJoiSchema(userPasswordSchema, "body"), resetPassword)


export default router