const { Sequelize } = require('sequelize'); //Sequelize → Main class used to connect and interact with the database
require('dotenv').config(); //dotenv → Loads environment variables from a .env file into process.env.

const sequelize = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASSWORD,
    {
        host: process.env.DB_HOST, //host → Where your DB is hosted (usually localhost)
        dialect: 'mysql', 
        logging: false, //Disables SQL query logs in the console -> that means we will not see queries being executed in the console
    }
);

module.exports = sequelize; //Makes this database connection available in other files


//e create one Sequelize instance — a single connection to the database. We export it so every model file can import it and use the same connection. logging: false suppresses the SQL query output in your terminal