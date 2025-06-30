// omporta libray mongoose
import mongoose from "mongoose"

// Cria o Schema (table) dos contatos, definindo as columns (atributos)
const userSchema = mongoose.Schema({
    username: {
        type: String,
        required: [true, 'Name is required'],
        unique: [true, "User already exist."], // optional, prevents duplicate users
        minlength: [1, 'Name must be at least 1 character'],
        maxlength: [12, 'Name must be at most 12 characters']
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: [true, "Email already taken."] // optional, prevents duplicate emails
    },
    password: {
        type: String,
        required: [true, 'Password is required'],
        minlength: [8, 'Password must be at least 8 characters']
    },
    isVerified: { 
        type: Boolean, 
        default: false 
    },
    verificationToken: { 
        type: String 
    },
    verificationTokenExpires: { 
        type: Date 
    },
    passwordToken: { 
        type: String 
    },
    passwordTokenExpires: { 
        type: Date 
    },
    lastVerificationEmailSentAt: { 
        type: Date 
    },
    emailRequestsNumber: {
        type: String
    },
    }, {
    timestamps: true
});


export const User = mongoose.model('User', userSchema, 'users');
// 'User' é o nome do model
// 'users' é o nome da coleção no bd