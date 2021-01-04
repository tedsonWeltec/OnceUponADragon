const mongoose = require('mongoose')

function parse(o) {
    return JSON.parse(o)
}

function stringify(o) {
    return JSON.stringify(o)
}

const bookSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    author: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    },
    authorName: {
        type: String,
        required: true
    },
    players: [{
        type: String,
        required: true,
        get: parse,
        set: stringify
    }],
    themes: [{
        type: String,
        required: true
    }],
    pages: [{
        type: String,
        required: true,
        get: parse,
        set: stringify
    }],
    cover: {
        type: String,
        required: true,
        get: parse,
        set: stringify
    },
    code: {
        type: String,
        required: true
    }
})

module.exports = mongoose.model('Book', bookSchema)