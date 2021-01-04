const mongoose = require('mongoose')
const book = require('./book')

const userSchema = new mongoose.Schema({
    fullName: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    showEmail: {
        type: Boolean,
        required: true
    },
    userName: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    avatar: {
        type: String,
        required: true,
        default: "sheep.png"
    },
    sounds: {
        type: Boolean
    },
    isAdmin: {
        type: Boolean
    }
})

module.exports = mongoose.model('User', userSchema)