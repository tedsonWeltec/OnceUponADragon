const LocalStrategy = require('passport-local').Strategy
const bcrypt = require('bcrypt')

async function initialize(passport, getUserByName, getUserById) {
    const authUser = async (userName, password, done) => {
        try {
            const user = await getUserByName(userName)
            if (user == null) {
                return done(null, false, { message: 'Username not found!' })
            }
            if (await bcrypt.compare(password, user.password)) {
                return done(null, user)
            } else {
                return done(null, false, { message: 'Password incorrect' })
            }
        } catch(e) {
            return done(e)
        }

    }
    passport.use(new LocalStrategy({ usernameField: 'userName'}, authUser))
    passport.serializeUser((user, done) => done(null, user.id) )
    passport.deserializeUser( async (id, done) => {
        const user = await getUserById(id)
        done(null, user) 
    })
}

module.exports = initialize