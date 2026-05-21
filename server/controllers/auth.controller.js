const bcrypt = require('bcryptjs'); //hash & compare passwords
const {User} = require('../models'); //database model
const {generateToken} = require('../utils/jwt'); //creates JWT

const register = async(req, res)=>{
    try{
        const {name, email, password} = req.body; //get user input

        if(!name || !email || !password){//validate the input
            return res.status(400).json({message:'All fields are required.'});
        }
        if(password.length<6){
            return res.status(400).json({message: 'Password must be atleast 6 characters'});
        }

        const existingUser = await User.findOne({ where: {email}});//check if user already exists
        if(existingUser){
            return res.status(409).json({message:'Email already in use.'});
        }

        const salt = await bcrypt.genSalt(10);//Salt adds randomness
        const password_hash = await bcrypt.hash(password, salt);//password is securely stored(never in plain text)

        const user = await User.create({name, email, password_hash});

        const token = generateToken({id: user.id, email: user.email, name: user.name});//Generate JWT token
        res.status(201).json({//sends token + safe user data
            message: 'Registration successful.',
            token,
            user: {id: user.id, name: user.name, email:user.email, avatar_url: user.avatar_url},

        });
    } catch(err){
        console.error('Register error', err);
        res.status(500).json({message: 'Server error during registration'});
    }
};

const login = async(req, res)=>{
    try{
        const {email, password} = req.body;

        if(!email || !password){
            return res.status(400).json({message : 'Email & Password are required'});
        }

         // Find user — include password_hash this time (we need it to compare
        const user = await User.findOne({ where: { email } });
        if (!user || !user.password_hash) {
            return res.status(401).json({ message: 'Invalid email or password.' });
        }

        // Compare entered password against stored hash
        const isMatch = await bcrypt.compare(password, user.password_hash);
        if(!isMatch){
            return res.status(401).json({message: 'Invalid email or password.'});
        }
        const token = generateToken({ id: user.id, email: user.email, name:user.name});

        res.json({
            message:'Login successful',
            token,
            user: {id: user.id, name: user.name, email: user.email, avatar_url: user.avatar_url},
        });
    } catch(err){
        console.error('Login error', err);
        res.status(500).json({message: 'Server error during login.'});
    }
};

const getMe = async(req, res)=>{
    res.json({user: req.user});
}; //Returns current logged-in user

module.exports={register, login, getMe};

//This file is for authentication controller functions for the backend: register, login, getMe
//This file handles user signup, login, fetching the current logged-in user
