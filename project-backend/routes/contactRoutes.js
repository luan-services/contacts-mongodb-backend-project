// importa os controllers (funçoes que dizem oq cada route vai fazer)
import { getContacts, createContact, getContact, updateContact, deleteContact } from "../controllers/contactControllers.js"

// importa o middleware de validação do JOI
import { validateJoiSchema } from "../middleware/validateJoiSchema.js";
//importa middleware de validação de token
import { validateJwtToken } from "../middleware/validateTokenHandler.js";
// importa o schema do JOI
import { contactCreateSchema, contactSearchSchema } from "../models/joi_models/contactsValidateModel.js";

import express from "express"

// importa o router do express
const router = express.Router();

router.use(validateJwtToken)

// seta o endereço do route( a ser adicionado ao endereço principal em server.js) + qual função vai ser usada
router.route("/").get(getContacts)
// essa função post requer um objeto contact inteiro como request, por isso precisa ser validado usando o contactCreateSchema
router.route("/").post(validateJoiSchema(contactCreateSchema, "body"), createContact)
// essa função post requer apenas o ID do contato, por isso precisa ser validado usando o contactSearchSchema e lendo o endereço do request, nao o body
router.route("/:id").get(validateJoiSchema(contactSearchSchema, "params"), getContact)

router.route("/:id").put(validateJoiSchema(contactSearchSchema, "params"), updateContact)

router.route("/:id").delete(validateJoiSchema(contactSearchSchema, "params"), deleteContact)

export default router