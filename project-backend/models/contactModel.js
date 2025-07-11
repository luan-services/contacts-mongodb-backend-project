// omporta libray mongoose
import mongoose from "mongoose"

// Cria o Schema (table) dos contatos, definindo as columns (atributos)
const contactSchema = mongoose.Schema({
    user_id: { 
        type: mongoose.Schema.Types.ObjectId, 
        required: [true, 'Logged user id is required'],
        ref: "User" // o modelo de referencia de onde vai vir o id
    },
    name: { // define o nome do campo
        type: String, // define o tipo do campo
        required: [true, 'Name is required'] // define que é necessário ter o campo name
    },
    email: { 
        type: String, 
        required: [true, 'Email is required'],
    },
    phone: { 
        type: String, 
        required: [true, 'Phone is required'] }
}, {
    timestamps: true
});


export const Contact = mongoose.model('Contact', contactSchema, 'contacts');
// 'Contact' é o nome do model
// 'contacts' é o nome da coleção no bd