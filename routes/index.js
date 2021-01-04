//#region requires and initializations

const express = require('express')
const router = express.Router()
const bcrypt = require('bcrypt')
const passport = require('passport')
const flash = require('express-flash')
const session = require('express-session')
const methodOverride = require('method-override')
var fs = require('fs');

const initializePassport = require('./passport-config')
initializePassport(
    passport,
    async (userName) => { return await User.findOne({ userName: new RegExp(userName, 'i') }) },
    async (id) => { return await User.findById(id) }
)

router.use(express.urlencoded({ extended: false }))
router.use(flash())
router.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false
}))
router.use(passport.initialize())
router.use(passport.session())
router.use(methodOverride('_method'))

//#endregion

//Database models
const User = require('../models/user')
const Book = require('../models/book')

// Main page
router.get('/', checkAuth, (req, res) => {
    const firstName = req.user.fullName
    res.render('index', { title: "Main Menu", name: firstName, loggedIn: true, user: req.user })
})

router.get('/landing', checkNotAuth, (req, res) => {
    res.render('landing', { title: "Welcome to the infinity book!", loggedIn: false })
})



router.get('/editbackground', checkAuth, checkAdmin, (req, res) => {
    var backgrounds = fs.readdirSync('./public/imgs/backgrounds/');
    res.render('editbackground', {
        title: "Edit background",
        loggedIn: true,
        user: req.user,
        backgrounds: backgrounds,
        pageBackground: "imgs/backgrounds/default.jpg",
        pageInput: ""
    })
})

router.post('/editbackground', checkAuth, checkAdmin, (req, res) => {
    //Rename file
    fs.renameSync("./public/"+req.body.oldBackgroundName, "./public/"+req.body.newBackgroundName)

    var backgrounds = fs.readdirSync('./public/imgs/backgrounds/');
    res.render('editbackground', {
        title: "Edit background",
        loggedIn: true,
        backgrounds: backgrounds,
        pageBackground: req.body.newBackgroundName,
        pageInput: req.body.oldPageInput
    })
})

router.post('/togglesound', async (req, res) => {
    if (req.isAuthenticated()) {
        try {
            let updatedUser = await User.findById(req.user.id)
            updatedUser.sounds = !req.user.sounds
            let savedUser = await updatedUser.save()
            req.user.sounds = !req.user.sounds
            res.sendStatus(200)
        } catch (e) {
            console.log(e)
            res.sendStatus(500)
        }
    } else {
        res.sendStatus(404)
    }
})

////////////////////////////////////////////////////////
//                   Avatars stuff                    //
////////////////////////////////////////////////////////

router.get('/avatar', checkAuth, (req, res) => {
    var avatars = fs.readdirSync('./public/imgs/avatars/');
    const firstName = req.user.fullName
    res.render('avatar', { title: "My Avatar", name: firstName, loggedIn: true, user: req.user, avatars: avatars })
})

router.post('/avatar', checkAuth, async (req, res) => {
    try {
        let user = await User.findOne({ userName: req.user.userName })

        user.avatar = req.body.avatar
        const newUser = await user.save()

        req.logIn(user, (error) => { })
    } catch {
        console.log("something happened...")
    }
    const firstName = req.user.fullName
    //res.render('index',{ title: "Main Menu", name: firstName, loggedIn: true, user:req.user })
    res.redirect('/')
})

////////////////////////////////////////////////////////
//                    Books stuff                     //
////////////////////////////////////////////////////////

router.get('/books', checkAuth, async (req, res) => {
    try {
        const books = await Book.find({ author: req.user.id })
        const firstName = req.user.fullName
        res.render('books', { title: "My Books", name: firstName, loggedIn: true, user: req.user, books: books })
    } catch {
        res.redirect('/')
    }
})

router.get('/deletebook', checkAuth, async (req, res) => {
    try {
        const books = await Book.find({ author: req.user.id })
        const firstName = req.user.fullName
        res.render('deletebook', { title: "My Books", name: firstName, loggedIn: true, user: req.user, books: books })
    } catch {
        res.redirect('/')
    }
})

router.delete('/deletebook', checkAuth, async (req, res) => {
    try {
        const book = await Book.deleteOne({ code: req.body.code.toUpperCase() })
    } catch (e) {
        console.log(e)
    }
    res.redirect('/books')
})


router.get('/newbook', checkAuth, (req, res) => {
    var colors = ["red", "pink", "purple", "deep-purple", "indigo", "blue", "light-blue", "cyan",
        "teal", "green", "light-green", "lime", "yellow", "amber", "orange", "deep-orange",
        "brown", "grey", "blue-grey", "black", "white"]
    var characters = fs.readdirSync('./public/imgs/characters/');
    var backgrounds = fs.readdirSync('./public/imgs/backgrounds/');
    var prompts = fs.readFileSync('./public/prompts.txt', 'utf-8').split('\n')
    var themes = fs.readdirSync('./public/imgs/themes/');
    const firstName = req.user.fullName
    res.render('newbook', {
        title: "New Book",
        name: firstName,
        loggedIn: true,
        user: req.user,
        colors: colors,
        characters: characters,
        backgrounds: backgrounds,
        prompts: prompts,
        themes: themes
    })
})

router.post('/savebook', checkAuth, async (req, res) => {
    try {
        const tempBook = JSON.parse(req.body.tempBook)
        const book = await Book.findOne({
            author: req.user.id,
            title: "Unfinished book (pick to continue)",
            players: tempBook.players
        })
        if (book == null) {
            //Not found
            const books = await Book.find({})
            const bookCodes = books.map(book => book.code)
            const newBook = new Book({
                title: tempBook.title,
                author: req.user.id,
                authorName: req.user.fullName,
                players: tempBook.players,
                themes: tempBook.themes.split(","),
                pages: tempBook.pages,
                cover: tempBook.cover,
                code: codeGenerator(bookCodes)
            })
            const newBookSaved = await newBook.save()
            res.send(req.body.tempBook)
        } else {
            book.title = tempBook.title == "" ? "Untitled book" : tempBook.title
            book.pages = tempBook.pages
            book.cover = tempBook.cover
            const newBookSaved = await book.save()
            if (book.title == "Unfinished book (pick to continue)") {
                res.send(req.body.tempBook)
            } else {
                res.render('newbook/bookFinished', { title: "Book finished", loggedIn: true, book: book, user: req.user })
            }
        }
    } catch (e) {
        console.warn(e)
        res.send(`Data not saved: ${req.body.tempBook}`)
    }
})


router.post('/updatebook', checkAuth, async (req, res) => {
    try {
        const tempBook = JSON.parse(req.body.tempBook)
        const book = await Book.findOne({
            code: tempBook.code
        })
        tempBook.pages.forEach((page, i) => {
            tempBook.pages[i] = JSON.parse(tempBook.pages[i])
        })
        book.pages = tempBook.pages
        const newBookSaved = await book.save()
        res.redirect('/books')
    } catch (e) {
        console.log(e)
    }
})

router.get('/code', (req, res) => {
    res.render('code', { title: "Book Code", loggedIn: false })
})

router.post('/viewbook', async (req, res) => {
    const book = await Book.findOne({ code: req.body.code.toUpperCase() })
    
    if (book == null) {
        res.render('code', { title: "Book Code", loggedIn: false, errorMessage: "Book not found!" })
    } else {
        if (book.title == "Unfinished book (pick to continue)") {
            if (!req.isAuthenticated()) {
                res.render('code', { title: "Book Code", loggedIn: false, errorMessage: "Book not found!" })
                return 0;
            }
            res.render('updatebook', {
                title: "Update book",
                loggedIn: true,
                book: JSON.stringify(book),
                user: req.user
            })
        } else {
            var characters = fs.readdirSync('./public/imgs/characters/');
            var backgrounds = fs.readdirSync('./public/imgs/backgrounds/');
            const bookAuthor = await User.findById(book.author)
            res.render('viewbook', {
                title: "View book",
                loggedIn: req.isAuthenticated(),
                book: JSON.stringify(book),
                characters: characters,
                backgrounds: backgrounds,
                user: req.user,
                userData: (bookAuthor.showEmail ? " ("+bookAuthor.email+")" : "")
            })
        }
    }
})

router.post('/editbook', checkAuth, async (req, res) => {
    const book = await Book.findOne({ code: req.body.code.toUpperCase() })
    res.render('updatebook', {
        title: "Update book",
        loggedIn: true,
        book: JSON.stringify(book),
        user: req.user
    })
})

////////////////////////////////////////////////////////
//                   Admin stuff                      //
////////////////////////////////////////////////////////

router.get('/admin', checkAuth, checkAdmin, (req, res) => {
    const firstName = req.user.fullName
    res.render('admin', { title: "Admin tools", name: firstName, user: req.user, loggedIn: true })
})

router.get('/users', checkAuth, checkAdmin, async (req, res) => {
    try {
        const users = await User.find()
        res.render('users', { title: "User accounts", user: req.user, loggedIn: true, users: users })
    } catch {
        res.redirect('/admin')
    }
})

router.post('/viewuser', checkAuth, checkAdmin, async (req, res) => {
    try {
        const user = await User.findById(req.body.id)
        //res.send(JSON.stringify(user))
        res.send("Feature not done yet.")
    } catch (e) {
        console.log(e)
        res.redirect('/users')
    }
})

router.get('/allbooks', checkAuth, checkAdmin, async (req, res) => {
    try {
        const books = await Book.find()
        res.render('allbooks', { title: "All storybooks", user: req.user, loggedIn: true, books: books })
    } catch {
        res.redirect('/admin')
    }
})

router.delete('/deletebook2', checkAuth, checkAdmin, async (req, res) => {
    try {
        const book = await Book.deleteOne({ code: req.body.code.toUpperCase() })
    } catch (e) {
        console.log(e)
    }
    res.redirect('/allbooks')
})


router.delete('/deleteuser', checkAuth, checkAdmin, async (req, res) => {
    try {
        const user = await User.findById(req.body.id)
        const deleteBooks = await Book.deleteMany({ author: user.id })
        const deleteUser = await User.deleteOne({ userName: user.userName })
    } catch (e) {
        console.log(e)
    }
    res.redirect('/users')
})

////////////////////////////////////////////////////////
//                LOGIN, REGISTER, HELP               //
////////////////////////////////////////////////////////

// LOGIN
router.get('/login', checkNotAuth, (req, res) => {
    res.render('login', { title: "Login", loggedIn: false })
})

router.post('/login', checkNotAuth, passport.authenticate('local', {
    successRedirect: '/',
    failureRedirect: '/login',
    failureFlash: true
}))

router.get('/help', (req, res) => {
    if (req.isAuthenticated()) {
        res.render('help', { title: "Help", loggedIn: true, user: req.user })
    } else {
        res.render('help', { title: "Help", loggedIn: false })
    }
})

// REGISTER
router.get('/register', checkNotAuth, (req, res) => {
    res.render('register', { title: "Register", loggedIn: false })
})

router.post('/register', checkNotAuth, async (req, res) => {
    try {
        if (req.body.password != req.body.password2) {
            res.render('register', { title:"Register", loggedIn: false, errorMessage: "Password and pasword confirmation didn't match", userName: req.body.userName, email: req.body.email, fullName: req.body.fullName });
            return 0;
        }
        const test1 = await User.find({ userName: new RegExp(req.body.userName, 'i') })
        if (test1.length > 0) { res.render('register', { title:"Register", loggedIn: false, errorMessage: 'Username already taken!', userName: req.body.userName, email: req.body.email, fullName: req.body.fullName }); return 0; }
        const test2 = await User.find({ email: new RegExp(req.body.email, 'i') })
        if (test2.length > 0) { res.render('register', { title:"Register", loggedIn: false, errorMessage: 'E-mail already in use!', userName: req.body.userName, email: req.body.email, fullName: req.body.fullName }); return 0; }
        const hashedPassword = await bcrypt.hash(req.body.password, 10)
        if (req.body.showEmail === "on") { req.body.showEmail = true } else { req.body.showEmail = false }
        const user = new User({
            fullName: req.body.fullName,
            email: req.body.email,
            showEmail: req.body.showEmail,
            userName: req.body.userName,
            password: hashedPassword,
            sounds: true,
            isAdmin: false
        })
        if (req.body.userName == "admin") {
            user.isAdmin = true
        }
        const newUser = await user.save()
        const firstName = splitOnce(user.fullName, " ")[0]
        res.render('registered', { title: "Registered", loggedIn: false, userName: firstName })
    } catch {
        res.render('register', { title: "Register", loggedIn: false, errorMessage: 'Error creating new user!' })
    }
})

router.delete('/logout', (req, res) => {
    req.logOut()
    res.redirect('/landing')
})

router.get('/deleteaccount', checkAuth, async (req, res) => {
    try {
        const deleteBooks = await Book.deleteMany({ author: req.user.id })
        const deleteUser = await User.deleteOne({ userName: req.user.userName })
    } catch (e) {
        console.log(e)
    }
    req.logOut()
    res.render('deleted', {title: "Account deleted", loggedIn: false})
})

// Functions for Passport user authentication.
function checkAuth(req, res, next) {
    if (req.isAuthenticated()) {
        return next()
    }
    res.redirect('/landing')
}

function checkNotAuth(req, res, next) {
    if (req.isAuthenticated()) {
        return res.redirect('/')
    }
    return next()
}

function checkAdmin(req, res, next) {
    if (req.user.isAdmin == true) {
        return next()
    }
    res.redirect('/')
}

// Function to split a string by a delimiter only once (Used to pick up the user's first name only).
function splitOnce(str, delim) {
    var components = str.split(delim);
    var result = [components.shift()];
    if (components.length) {
        result.push(components.join(delim));
    }
    return result;
}

function baseFive(size) {
    let vocals = ["A","E","1","2","3"]
    let digits = Math.max(3, size)
    let number = []
    for (let i = 0; i < digits; i++) {
        number.push( vocals[ Math.floor( Math.random() * 5 ) ] )
    }
    return number.join('')
}

function codeGenerator(codes) {
    
    let size = codes.length.toString().length
    let newCode
    do {
        newCode = baseFive(size)
        size++
    } while (codes.includes(newCode))

    return newCode
}

module.exports = router