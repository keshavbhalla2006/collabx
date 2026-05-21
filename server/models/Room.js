const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Room = sequelize.define('Room',{
    id: {type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true},
    name: {type: DataTypes.STRING, allowNull: false},
    invite_code: {type: DataTypes.STRING, allowNull: false, unique: true}, //Unique code used to join the room
    host_id: {type: DataTypes.INTEGER, allowNull: false},
    language: {type: DataTypes.STRING, defaultValue: 'javascript'}, //Default programming language is JavaScript
    current_code: {type: DataTypes.TEXT, defaultValue:''}, 
    //The primary difference between TEXT and VARCHAR is how they handle length constraints and storage, Core difference: VARCHAR(n) requires a maximum length n and TEXT generally has no limit.
    current_question: {type: DataTypes.TEXT, allowNull: true, defaultValue: null,},
    is_active: {type: DataTypes.BOOLEAN, defaultValue: true},
},{
    tableName: 'rooms', timestamps: true
});

module.exports=Room;

//Thid code defines a Room model (table) using Sequelize.
/*
This model represents a coding room where:
1) A host creates a room
2) Others join using an invite code
3) Everyone can collaborate on code in real time
4) The system tracks:
    a) language
    b) current code
    c) room status

Real-world flow:
1) User creates a room → entry added in rooms
2) System generates invite_code
3) Other users join using that code
4) current_code updates as users type
5) When done → is_active = false
*/