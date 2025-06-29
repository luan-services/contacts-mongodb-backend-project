// importa a funão asyncHandler, para lidar com qualquer excessão async que for usada
import asyncHandler from "express-async-handler"

// importando o model Contact do mongoose
import { Contact } from "../models/contactModel.js"

//@desc Get all contacts
//@route GET /api/contacts
//@access public
export const getContacts = asyncHandler( async (req, res) => {
    const contacts = await Contact.find();
    // envia uma resposta ao frontend com os dados dos contatos
    return res.status(200).json(contacts);
})

//@desc Create new contact
//@route POST /api/contacts/:id
//@access public
export const createContact = asyncHandler( async (req, res) => {
    // printa o body do request
    console.log("The requested body is", req.body)
    // passa os dados do request para constantes
    const {name, email, phone} = req.body
    // Usa o model do mangoose para criar uma row (um objeto) de contato (todas essas funções vem diretamente do schema do mangoose, que vem com funções built-in para gerenciar o db)
    const contact = await Contact.create({
        name: name,
        email: email,
        phone: phone,
    });
    // envia uma resposta ao frontend com os dados do contato
    return res.status(201).json(contact);
})

//@desc Get contact
//@route GET /api/contacts/:id
//@access public
export const getContact = asyncHandler( async (req, res) => {
    // procura o contato no banco de dados baseado no model (todas essas funções vem diretamente do schema do mangoose, que vem com funções built-in para gerenciar o db)
    const contact = await Contact.findById(req.params.id);
    // se não existe lança erro
    if (!contact) {
        res.status(404);
        throw new Error("Contact not found");
    }
    // envia uma resposta ao frontend com os dados do contato
    return res.status(200).json(contact);
})


//@desc Update contact
//@route PUT /api/contacts/:id
//@access public
export const updateContact = asyncHandler( async (req, res) => {
    // procura o contato no banco de dados baseado no model (todas essas funções vem diretamente do schema do mangoose, que vem com funções built-in para gerenciar o db)
    const contact = await Contact.findById(req.params.id);
    // se não existe lança erro
    if (!contact) {
        res.status(404);
        throw new Error("Contact not found");
    }
    // se existe atualiza (todas essas funções vem diretamente do schema do mangoose, que vem com funções built-in para gerenciar o db)
    const updatedContact = await Contact.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true } // returns the updated document
    );
    // envia uma resposta ao frontend com os dados do contato
    res.status(200).json(updatedContact);
})

//@desc Delete contact
//@route DELETE /api/contacts/:id
//@access public
export const deleteContact = asyncHandler( async (req, res) => {
    // procura o contato no banco de dados baseado no model (todas essas funções vem diretamente do schema do mangoose, que vem com funções built-in para gerenciar o db)
    const contact = await Contact.findById(req.params.id);
    // se não existe lança erro
    if (!contact) {
        res.status(404);
        throw new Error("Contact not found");
    }
    // deleta o contato (todas essas funções vem diretamente do schema do mangoose, que vem com funções built-in para gerenciar o db)
    await contact.deleteOne();
    // envia uma mensagem ao frontend dizendo q o contato foi deletado
    res.status(200).json({ message: `Deleted contact ${req.params.id}` });
})
