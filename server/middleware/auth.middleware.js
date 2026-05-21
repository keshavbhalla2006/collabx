const { verifyToken } = require('../utils/jwt')
const {User} = require('../models');


//An express middleware, it runs before protected routes, it controls the access
const protect = async(req, res, next)=>{
    try{
        const authHeader = req.headers.authorization; //Syntax: Authorization: Bearer <token>
        if(!authHeader || !authHeader.startsWith('Bearer ')){
            return res.status(401).json({message: 'No token provided. Please log in.'});
        }
        const token  = authHeader.split(' ')[1]; //"Bearer abc123.xyz" → ["Bearer", "abc123.xyz"], Token = "abc123.xyz"
        const decoded = verifyToken(token); //Checks if token is valid, decodes payload

        const user = await User.findByPk(decoded.id, {
            attributes: {exclude: ['password_hash']}
        }); //Fetch user using ID from token, excludes password_hash so it's not exposed, Finding user in database

        if(!user ){
            return res.status(401).json({message:'User no longer exists.'});
        }//Check if user still exists, User might have been deleted after token was issued
        req.user = user;// Attach user to the request, accessible routes are for example req.user.id, req.user.email
        next(); //Authentication successful ad move to the next middleware or the actual route handler.
    }catch(err){
        return res.status(401).json({message:'Invalid or expired token.'});
    }
};

module.exports = {protect};


//This file is an authenticarion middleware that protect routes by verifying a JWT token and attaching the authenticated user to the request.
//This keeps API secure and stateless, Token must be sent in Authorization header

/*
Full Flow:
A) Client request:
GET /api/profile
Authorization: Bearer <JWT_TOKEN>
B) Server flow:
Middleware runs
Checks token
Verifies token
Fetches user
Attaches req.user
Calls next()
*/