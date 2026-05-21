const jwt = require('jsonwebtoken'); //It provides methods to create (sign) and verify JWT tokens.

const generateToken = (payload) =>{ //payload: Data we want to store inside the token
    return jwt.sign(payload, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN,
    });
};
//jwt.sign: generate a token using payload, secret key, options(here the expiry time).
//the basic syntax is : jwt.sign(payload, secret, options)

const verifyToken = (token) =>{ //Checks if the token is valid and not expired, token: The JWT recieved from the client
    return jwt.verify(token, process.env.JWT_SECRET); //Decodes and returns the original payload if valid
};
//Throws an error (e.g., expired token, wrong signature)
//The basic syntax is : jwt.verify(token, secret)

module.exports={ generateToken, verifyToken};

//This file basically handles JWT(Json Web Tokens) in Node.js using the jsnwebtoken library.