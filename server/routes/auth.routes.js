const express = require('express');
const router = express.Router(); //creates route handlers
const passport = require('../config/passport'); //handles Google OAuth
const {register, login, getMe } = require('../controllers/auth.controller'); //controller functions
const {protect} = require('../middleware/auth.middleware'); //JWT middleware
const {generateToken} = require('../utils/jwt'); //generateToken → creates JWT after Google login

// Manual auth
router.post('/register', register); //calls register function, endpoint POST /register, creates new user
router.post('/login', login); //Endpoint: POST /login , Verifies credentials, Returns JWT 
router.get('/me', protect, getMe); //'protect' middleware runs first, JWT gets verified, This adds used to req.user, getMe returns user data.

//Google Auth-Step1: Redirect to Google
router.get('/google', passport.authenticate('google', {scope: ['profile', 'email']}));
/*
User visits /auth/google
Redirected to Google login page
Requests access to:
profile
email
*/

//Google Auth - Step2: Google Callback
/*
Google sends user back to this route
Passport processes the login

Options:
failureRedirect → where to go if login fails
session: false → disables sessions (since you're using JWT)
*/
router.get(
    '/google/callback', 
    passport.authenticate('google',{failureRedirect: 'http://localhost:5173/login', session: false}),
    (req,res)=> {
        const token = generateToken({id: req.user.id, email: req.user.email, name: req.user.name}); //This comes from passport google strategy, it contains the authenticated user

        res.redirect(`http://localhost:5173/auth/callback?token=${token}`); //Sends user back to frontend, Token is passed in URL query
    }
);



module.exports=router;


//This file defines authentication routes using Express. 
// It connects everything related to controllers(register/login), middleware(protect), JWT,and GoogleOAuth.