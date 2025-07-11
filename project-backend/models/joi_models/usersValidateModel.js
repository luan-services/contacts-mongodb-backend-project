import Joi from "joi"

// define o schema de validação para registro
export const userRegisterSchema = Joi.object({
    username: Joi.string().min(1).max(12).required().messages({
        'string.empty': 'Name is required', // mensagens custom para cada erro, se não adicionadas, o joi lança mensagens padrao
        'any.required': 'Name is required',
        'string.max': 'Name must be at most {#limit} characters'
    }),
    email: Joi.string().email().required().messages({
        'string.email': 'A valid email is required',
        'any.required': 'Email is required'
    }),
    password: Joi.string().min(8).required().messages({
        'string.empty': 'Password is required',
        'any.required': 'Password is required',
        'string.min': 'Password must be at least {#limit} characters'
    })
});

// define o schema de validação para login, inclui campo 'rememberMe' para decidir se o usuário quer manter a sessão p sempre ou apenas até fechar a página
export const userLoginSchema = Joi.object({
    email: Joi.string().email().required().messages({
        'string.email': 'A valid email is required',
        'any.required': 'Email is required'
    }),
    password: Joi.string().min(8).required().messages({
        'string.empty': 'Password is required',
        'any.required': 'Password is required',
        'string.min': 'Password must be at least {#limit} characters'
    }),
    rememberMe: Joi.boolean().required().messages({
        "boolean.base": `"rememberMe" must be a boolean value (true or false).`,
        "any.required": `"rememberMe" is required.`
    })
});

export const userEmailSchema = Joi.object({
    email: Joi.string().email().required().messages({
        'string.email': 'A valid email is required',
        'any.required': 'Email is required'
    })
});

export const cryptoTokenSchema = Joi.object({
  token: Joi.string().length(64).hex().required().messages({
      'string.base': '"token" must be a string',
      'string.empty': '"token" cannot be empty',
      'string.length': '"token" must be exactly 64 characters',
      'string.hex': '"token" must be a valid hexadecimal string',
      'any.required': '"token" is required',
    }),
});

export const userPasswordSchema = Joi.object({
    newPassword: Joi.string().min(8).required().messages({
        'string.empty': 'New Password is required',
        'any.required': 'New Password is required',
        'string.min': 'New Password must be at least {#limit} characters'
    })
});
