/**
 * Require necessary modules
 */
const argv = require('yargs').argv;
const bodyParser = require('body-parser');
const express = require('express');
const debug = require('debug')('openidconnect');
const fs = require('fs');
const hbs = require('express-handlebars');
const https = require('https');
const log = require('morgan');
const path = require('path');
const session = require('express-session');

/**
 * Parse environment variables from the .env file
 */
try {
  require('dotenv').config({
    path: path.resolve(__dirname, '.env'),
  });
} catch (e) {
  debug(`Something went wrong while parsing the .env file: ${e.message || e}\nBe sure to have all necessary environment variables set!`);
}

/**
 * Require passport config including OpenID Connect Strategy
 */
const passport = require('./lib/passport');

/**
 * Instantiate Express.js server
 */
const app = express();

/**
 * Express.js middlewares
 */
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(session({
  secret: 'keyboard cat',
  resave: false,
  saveUninitialized: true,
}));
app.use(passport.initialize());
app.use(passport.session());
app.use(log('common'));
app.engine('hbs', hbs());
app.set('view engine', 'hbs');

/**
 * Routes for OpenID Connect service
 */
app.get('/auth/callback', passport.authenticate('oidc', {
  failureRedirect: '/',
  successRedirect: '/profile',
}));
app.post('/auth/callback', passport.authenticate('oidc', {
  failureRedirect: '/',
  successRedirect: '/profile',
}));
app.get('/auth', passport.authenticate('oidc', {
  failureRedirect: '/',
  successRedirect: '/profile',
}));
app.get('/profile', passport.isAuthenticated, (req, res) => res.render('profile', req.user));
app.get('/', (req, res) => res.render('login'));

/**
 * Listen for connections on given PORT variable, or use port 3000 as fallback
 */
if (process.env.FORCE_SSL && fs.existsSync(process.env.KEY || './https.key') && fs.existsSync(process.env.CERT || './https.crt')) {
  https.createServer({
    key: fs.readFileSync(process.env.KEY || './https.key'),
    cert: fs.readFileSync(process.env.CERT || './https.crt'),
  }, app).listen(process.env.PORT || 3000, () => {
    debug(`HTTPS enabled, listening on port ${process.env.PORT || 3000}`);
  });
} else {
  app.listen(process.env.PORT || 8081, () => {
    debug(`App listening on port ${process.env.PORT || 3000}`);
  });
}
