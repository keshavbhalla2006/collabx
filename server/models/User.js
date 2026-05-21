const { DataTypes } = require('sequelize'); // DataTypes → Used to define column types (INTEGER, STRING, etc.)
const sequelize = require('../config/db'); //Database connection

const User = sequelize.define('User', { // 'User' → Model name (used internally by Sequelize)
    id:{ //First {} → Columns (table structure)
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    name:{
        type: DataTypes.STRING,
        allowNull: false,
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: { isEmail: true },
    },
    password_hash: { //Stores hashed password (not plain text), Can be null → useful for users who log in via Google (no password)
        type: DataTypes.STRING,
        allowNull: true,
    },
    google_id: {
        type: DataTypes.STRING,
        allowNull: true,
        unique: true,
    },
    avatar_url: {
        type: DataTypes.STRING, 
        allowNull: true,
    },
},{ // Second {} → Configuration options
    tableName: 'users', //Forces table name to be exactly users (instead of Sequelize auto naming)
    timestamps: true, //This adds createdAt and updatedAt
});

module.exports = User;

//This code basically defines a User model (table) using Sequelize. It represents how user data will be stored in your MySQL database. Supports both normal login and google login, Adds validation, uniqueness, and auto timestamps