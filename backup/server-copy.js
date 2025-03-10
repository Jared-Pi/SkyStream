import express from "express";
import passport from "./auth-copy.js";
import session from "express-session";

function isLoggedIn(req, res, next) {
    req.user ? next() : res.sendStatus(401);
}

const app = express();
app.use(session({ secret: "cats" }));
app.use(passport.initialize());
app.use(passport.session());


app.get('/', (req, res) => {
    res.send('<a href="/auth/google">Authenticate with Google</a>');
});

app.get('/auth/google',
    passport.authenticate('google', { scope: ['email', 'profile'] })
);

app.get('/google/callback',
    passport.authenticate('google', {
        successRedirect: '/protected',
        failureRedirect: '/auth/failure'
    })
);

app.get('auth/failure', (req, res) => {
    res.send('Something went wrong with authentication');
});

app.get('/protected', isLoggedIn, (req, res) => {
   res.send(`Hello ${req.user.displayName}`);
});

app.get('/logout', (req, res) => {
    req.logout((err) => {
        if (err) { return err; }
        req.session.destroy();
        res.send('Goodbye!');
    });
});

app.listen(3000, () => console.log('Server is running on http://localhost:3000'));