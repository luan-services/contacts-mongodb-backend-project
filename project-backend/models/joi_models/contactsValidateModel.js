import Joi from "joi"

// define o model joi da table contacts
export const contactCreateSchema = Joi.object({
    name: Joi.string().min(1).required().messages({ // define o campo name
        'string.empty': 'Name is required', // mensagens custom para cada erro, se não adicionadas, o joi lança mensagens padrao
        'any.required': 'Name is required'
    }),
    email: Joi.string().email().required().messages({
        'string.email': 'A valid email is required',
        'any.required': 'Email is required'
    }),
    phone: Joi.string().min(1).required().messages({
        'string.empty': 'Phone is required',
        'any.required': 'Phone is required'
    })
});

// define o model joi da table contacts para pesquisa por ID (o ID do mongoose é um object string de 24 char e hex)
export const contactSearchSchema = Joi.object({
    id: Joi.string().length(24).hex().min(1).required().messages({ // define o campo name
        'string.empty': 'Contact ID is required', // mensagens custom para cada erro, se não adicionadas, o joi lança mensagens padrao
        'any.required': 'Contact ID is required',
        'string.base': 'Contact ID must be a string',
        'string.length': 'Contact ID must be exactly 24 characters',
        'string.hex': 'Contact ID must be a valid hexadecimal string',
    }),
});