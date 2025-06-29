import express from "express"
// importa a library dotenv
import dotenv from "dotenv"
// importa os routes de contact
import contactRoutes from "./routes/contactRoutes.js"
// importa os routes de user
import userRoutes from "./routes/userRoutes.js"
// importa a função errorHandler para dar resposta para erros
import { errorHandler } from "./middleware/errorHandler.js"
// importa a função de carregar o bd
import { connectDatabase } from "./config/connectDatabase.js"
// importa library que manipula cookies
import cookieParser from "cookie-parser"



// carrega as variáveis .env
dotenv.config()

// realiza a conexão
connectDatabase();

// carrega o framework express 
const app = express();

// process.env."variavel" eh uma variavel nativa do nodejs ja vem pre instalada que pega variaveis do arquivo .env (caso exista)
const port = process.env.PORT || 5000;

// isso é uma função built in do express que possibilita o app de ler objetos .json que vem no BODY de um comando POST
app.use(express.json())

app.use(cookieParser()); // 👈 Isso é necessário para ler os cookies

// app.use() define uma série de routes (comandos get e post) importados de "./routes/contactRoutes" no endereço "/api/contacts", esses routes possuem seus proprios endereços que ao juntar com "api/contacts" se completam, ex o router.route("/").get() forma o endereço forma o comando GET para o endereço "/api/contacts" + "/" (GET: /api/contacts/)
app.use("/api/contacts", contactRoutes)

// novo router, agora apontando pra users
app.use("/api/users", userRoutes)


// possibilita de usar a função errorHandler no server toda vez que a função throw new Error() é chamada
app.use(errorHandler)

//inicia o servidor na porta específicada
app.listen(port, () => {
    console.log(`server connected on port ${port}`)
})
