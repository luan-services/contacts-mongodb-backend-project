import asyncHandler from "express-async-handler"

// importando schema de usuário do mangoose
import { User } from "../models/userModel.js"

// importando library de criptografia de senhas
import bcrypt from "bcrypt"

// importando library que cria token
import jwt from "jsonwebtoken"

// importa library crypto para criar token de confirmação de email
import crypto from "crypto"
// importa library de checar quantidade de emails enviada
import {checkCooldown } from "../utils/checkCooldown.js"
// importa library de enviar email
import { sendEmail } from "../utils/sendMail.js"

function generateToken() {
  return crypto.randomBytes(32).toString('hex');
}

//@desc Register a user
//@route POST /api/users/register
//@access public
export const registerUser = asyncHandler(async (req, res) => {

    // passa os dados do request para constantes
    const {username, email, password} = req.body

    // apesar do mongoose já dar levantar erro se o email já existir no db, é boa pratica usar um tester:
    const userExists = await User.findOne({ email });
    if (userExists) {
        res.status(400);
        throw new Error('User already exists');
    }   

    // hashing da senha (12 é o numero de salt_rounds (qts vezes o hashing é aplicado))
    const hashedPassword = await bcrypt.hash(password, 10)

    // gera token de confirmação de email
    const verifyEmailToken = generateToken()

    // precisa hashear o token de verificação
    const hashedEmailToken = crypto.createHash('sha256').update(verifyEmailToken).digest('hex');

    // Usa o model do mangoose para criar uma row (um objeto) de usuario  (todas essas funções vem diretamente do schema do mangoose, que vem com funções built-in para gerenciar o db)
    const user = await User.create({
        username: username,
        email: email,
        password: hashedPassword,    
        isVerified: false,
        verificationToken: hashedEmailToken, 
        passwordToken: hashedEmailToken,  // mesmo que não use password token no registro, precisa setar um qlqr se não o bd não usa
        passwordTokenExpires: Date.now() + 1000 * 2, // 24h // mesmo que não use password token no registro, precisa setar um qlqr se não o bd não usa
        verificationTokenExpires: Date.now() + 1000 * 60 * 60 * 24, // 24h
        lastVerificationEmailSentAt: Date.now(),
        emailRequestsNumber: "5",
    });
    
    if (user) {
        // define o link de verificação de email.
        const link = `${process.env.WEBSITE_URL}/verify?token=${verifyEmailToken}`;

        console.log(`User created ${user}`)
        
        // envia email com o link
        await sendEmail(email, 'Verifique seu e-mail', `Clique para verificar: ${link}`);

        // envia uma resposta json com o id do user e o email
        return res.status(201).json({_id: user.id, email: user.email, message: "Usuário criado e e-mail de verificação enviado." });
    } else {
        res.status(400)
        throw new Error("User data is not valid")
    }

})

//@desc Login a user
//@route POST /api/users/login
//@access public
export const loginUser = asyncHandler(async (req, res) => {
    // lendo o email e a senha 
    const {email, password, rememberMe} = req.body
    
    // caso não tenha sido preenchido
    if (!email || !password || !rememberMe) {
        res.status(400)
        throw new Error("All fields are mandatory")
    }
    
    // Ver se o usuário está registrado no bd
    const user = await User.findOne({email})

    if (!user || !user.isVerified) {
        res.status(403)
        throw new Error("Verify email before log in")
    }

    // caso o usuario esteja correto, e a senha hasheada tambem
    if(user && (await bcrypt.compare(password, user.password))) {

        // cria um token, precisa incluir o conteudo do token (os dados do usuário), a senha do token (.env), e o tempo que expira
        const accessToken = jwt.sign({
            user: {
                username: user.username,
                email: user.email,
                id: user.id,
            },
        }, process.env.ACCESS_TOKEN_SECRET, {expiresIn: "15m"})

        // Gera refreshToken (longo)
        const refreshToken = jwt.sign(
        { id: user.id },
        process.env.REFRESH_TOKEN_SECRET,
        { expiresIn: "7d" }
        );

        // Envia refreshToken via cookie seguro
        res.cookie("refreshToken", refreshToken, {
            httpOnly: true,
            // secure true ou false diz se o cookie só podia ser enviado via https ou http; process.env.NODE_ENV === "production" retorna false caso a variavel NODE_ENV em .env seja diff de production   
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            // se rememberMe for true, o cookie dura 7 dias, se for false ele é apagado ao fechar o site
            maxAge: rememberMe ? 7 * 24 * 60 * 60 * 1000 : undefined,
        });

        // passa o access token como respossta json
        return res.status(200).json({accessToken})
    } else {
        res.status(401)
        throw new Error("email or password not valid")
    }
    
})

//@desc Current user info (extracted from a token and set to req.user via validateTokenHandler middleware)
//@route POST /api/users/current
//@access private
export const currentUser = asyncHandler(async (req, res) => {
    return res.json(req.user);
})


//@desc Refresh token
//@route POST /api/users/refresh
//@access pprivate
export const refreshToken = asyncHandler(async (req, res) => {
    // lê os cookies que vieram junto c o request
    const cookies = req.cookies;  
    // se não há cookie de refresh, jogan ovo erro
    if (!cookies?.refreshToken) {
        res.status(401);
        throw new Error("No refresh token");
    }

    // salva o token dentro do cookie de refresh na const token
    const token = cookies.refreshToken;
    
    let decoded;
    // é necessário usar try catch porque precisamos do valor de decoded fora da função jwt.verify
    try {
        decoded = jwt.verify(token, process.env.REFRESH_TOKEN_SECRET);
    } catch (err) {
        res.status(403);
        throw new Error("Invalid refresh token or session expired");
    }

    // checa se o usuário não foi deletado do banco de dados, para impedir usuários banidos de usarem o token.
    const user = await User.findById(decoded.id);
    if (!user) {
        res.clearCookie("refreshToken", {
            httpOnly: true,
            sameSite: "strict",
            secure: process.env.NODE_ENV === "production",
        });
        res.status(403);
        throw new Error("User no longer exists");
    }


    // caso sim, gera um novo access token
    const accessToken = jwt.sign(
        {
            user: { id: decoded.id },
        },
        process.env.ACCESS_TOKEN_SECRET,
        { expiresIn: "15m" }
    );

    // envia o novo token como resposta
    return res.status(200).json({ accessToken });
    
});

//@desc Logout user (clear cookie)
//@route POST /api/users/logout
//@access private
export const logoutUser = asyncHandler(async (req, res) => {

    const cookies = req.cookies;  
    // do not try to logout if there is no cookie
    if (!cookies?.refreshToken) {
        res.status(401);
        throw new Error("No refresh token");
    }
    
    // remove o cookie do refresh token (precisa botar as opções originais do cookie criado e o nome, se não não limpa)
    res.clearCookie("refreshToken", {
        httpOnly: true,
        sameSite: "strict",
        secure: process.env.NODE_ENV === "production",
    });
    // após realizar o log out, é necessário apagar o accessToken pois ele dura até 15min (isso é feito no frontend)
    return res.status(200).json({ message: "Logged out successfully" });
});


//@desc Verify a user
//@route POST /api/users/login
//@access private
export const verifyUser = asyncHandler(async (req, res) => {
    // ve se no endereço tem um query com o o token
    const { token } = req.query;

    if (!token) {
        res.status(400)
        throw new Error('Token ausente')
    }

    // hasheando o token recebido para procurar no bd
    const hashedEmailToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
        verificationToken: hashedEmailToken,
        verificationTokenExpires: { $gt: Date.now() } // maior que agr (ainda n expirou)
    });

    if (!user) {
        res.status(400)
        throw new Error('Token invalido ou expirado')
    }

    user.isVerified = true;
    user.verificationToken = undefined;
    user.verificationTokenExpires = undefined;

    await user.save();
    res.json({ message: 'Conta verificada com sucesso!' });
    
})


//@desc Re send verification email
//@route POST /api/users/current
//@access private
export const resendEmailVerification = asyncHandler(async (req, res) => {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
            res.status(404)
            throw new Error('User not found')
    }

    if (user.isVerified) {
            res.status(400)
            throw new Error('User already verified')
    }

    // seta o cooldown em minutos
    const COOLDOWN_MINUTES = 60;
    // pega a data
    const now = Date.now();
    // ve se o usuário está em cooldown
    const cooldown = checkCooldown(now, user.lastVerificationEmailSentAt, COOLDOWN_MINUTES)

    // caso sim, se ele tiver 0 requests, manda aguardar
    if (cooldown) { 
        if (parseInt(user.emailRequestsNumber) <= 0) {
            res.status(429)
            throw new Error(`Aguarde ${cooldown} minuto(s) antes de reenviar o e-mail`);
        } 
    }

    // caso ele ainda tenha + de 0 requests, cria um token para verificação de email
    const token = generateToken();

    // precisa hashear o token de verificação
    const hashedEmailToken = crypto.createHash('sha256').update(token).digest('hex');

    // salva o token no bd
    user.verificationToken = hashedEmailToken;
    // seta uma data para expiorar
    user.verificationTokenExpires = now + 1000 * 60 * 60 * 24;
    // se estiver em cooldown mantem o lastverification email, se não, seta pra now
    user.lastVerificationEmailSentAt = cooldown ? user.lastVerificationEmailSentAt : now;
    // se estiver em cooldown passa a qtd de requests disponivieis pra current -1, se não, bota 4
    user.emailRequestsNumber = cooldown ? (parseInt(user.emailRequestsNumber) -1).toString() : "4";

    await user.save()
    console.log(token)
    console.log(user)

    // define o link de verificação de email.
    const link = `${process.env.WEBSITE_URL}/verify?token=${token}`;
    // envia email com o link
    await sendEmail(email, 'Verifique seu e-mail', `Clique para verificar: ${link}`);

    return res.json({ message: 'Novo e-mail de verificação enviado.' });
})

//@desc Reset password
//@route POST /api/users/forgot-password
//@access public
export const forgotPassword = asyncHandler(async (req, res) => {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
        res.status(200).json({ message: 'If the email exists, a reset link was sent' });
        return;
    }

    // seta o cooldown em minutos
    const COOLDOWN_MINUTES = 60;
    // pega a data
    const now = Date.now();
    // ve se o usuário está em cooldown
    const cooldown = checkCooldown(now, user.lastVerificationEmailSentAt, COOLDOWN_MINUTES)

    // caso sim, se ele tiver 0 requests, manda aguardar
    if (cooldown) { 
        if (parseInt(user.emailRequestsNumber) <= 0) {
            res.status(429)
            throw new Error(`Aguarde ${cooldown} minuto(s) antes de reenviar o e-mail`);
        } 
    }

    const token = generateToken();
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    user.passwordToken = hashedToken;
    user.passwordTokenExpires = Date.now() + 1000 * 60 * 15; // 15 mins

    // se estiver em cooldown mantem o lastverification email, se não, seta pra now
    user.lastVerificationEmailSentAt = cooldown ? user.lastVerificationEmailSentAt : now;
    // se estiver em cooldown passa a qtd de requests disponivieis pra current -1, se não, bota 4
    user.emailRequestsNumber = cooldown ? (parseInt(user.emailRequestsNumber) -1).toString() : "4";
    await user.save();

    console.log("token ", token)
    console.log(user)

    const link = `${process.env.WEBSITE_URL}/reset-password/${token}`;

    await sendEmail({
        to: user.email,
        subject: 'Password Reset Request',
        text: `Reset your password: ${link}`,
    });

    return res.status(200).json({ message: 'If the email exists, a reset link was sent!' });
});

//@desc Verify password reset token
//@route GET /api/users/reset-password?token=
//@access private
export const verifyResetPassword = asyncHandler(async (req, res) => {
    const { token } = req.query;
    console.log("toki ", token)
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    console.log("hash ", hashedToken)

    const user = await User.findOne({
        passwordToken: hashedToken,
        passwordTokenExpires: { $gt: Date.now() }
    });

    if (!user) {
        res.status(400);
        throw new Error('Invalid or expired token');
    }

    return res.status(200).json({ message: 'Token is valid' });
});


//@desc Verify password reset token and reset password
//@route POST /api/users/reset-password?token=
//@access private
export const resetPassword = asyncHandler(async (req, res) => {
    const { token } = req.query
    const { newPassword } = req.body;

    if (!newPassword) {
        res.status(400);
        throw new Error('No new password on request body');
    }

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
        passwordToken: hashedToken,
        passwordTokenExpires: { $gt: Date.now() }
    });

    if (!user) {
        res.status(400);
        throw new Error('Invalid or expired token');
    }

    // hashing da senha (12 é o numero de salt_rounds (qts vezes o hashing é aplicado))
    const hashedPassword = await bcrypt.hash(newPassword, 10)

    user.password = hashedPassword;
    user.passwordToken = undefined;
    user.passwordTokenExpires = undefined;
    await user.save();

    return res.status(200).json({ message: 'Password has been reset' });
});