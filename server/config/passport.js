const passport = require('passport');// authenticaton middleware
const GoogleStrategy = require('passport-google-oauth20').Strategy; //strategy for Google OAuth login
const {User} = require('../models'); //database model
require('dotenv').config();

passport.use(
    new GoogleStrategy(
        {
            clientID: process.env.GOOGLE_CLIENT_ID, //identifies the app
            clientSecret: process.env.GOOGLE_CLIENT_SECRET, //secret key
            callbackURL: process.env.GOOGLE_CALLBACK_URL, //where google redirects after login
        },

        //accessToken → token to access Google APIs, refreshToken → used to refresh access, profile → user info from Google, done → callback to finish authentication
        async(accessToken, refreshToken, profile, done)=>{ 
            try{
                let user = await User.findOne({where:{google_id: profile.id}}); //check if user already logged in via google before -> fetch them

                if(!user){
                    user = await User.findOne({ where: { email: profile.emails[0].value}}); //if not check by email because User might have signed up manually (email/password). This Avoid creating duplicate accounts.

                    if(user){ //if manual exists, Connects Google account to existing user, Adds profile picture 
                        user.google_id=profile.id;
                        user.avatar_url=profile.photos[0]?.value;
                        await user.save();
                    }else{ //If new user, create account, this code Creates a new user in DB using Google data
                        user = await User.create({
                            name: profile.displayName,
                            email: profile.emails[0].value,
                            google_id: profile.id,
                            avatar_url: profile.photos[0]?.value,
                        });
                    }
                }
                return done(null, user); //finish authentication, Authentication successful, Pass user object to Passport
            }catch(err){
                return done(err, null);
            }
        }
    )
);

passport.serializeUser((user, done)=> done(null, user.id)); //Stores only user.id in session
passport.deserializeUser(async(id, done)=>{ //Converts stored ID back into full user object
    try{
        const user = await User.findByPk(id);
        done(null, user);
    }catch(err){
        done(err, null);
    }
});

module.exports = passport;

//This file sets up the Google authentication using passport.js in the Node.js app.
//It allows users to log in using their Google account and stores/fetches them from your database.

