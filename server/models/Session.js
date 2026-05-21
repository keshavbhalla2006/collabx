const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Session = sequelize.define('Session',{
    id: {type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true},
    room_id: {type: DataTypes.INTEGER, allowNull: false}, //refers to which room this session belong to, acts like a foreign key (links to room table)
    started_at: {type: DataTypes.DATE, defaultValue: DataTypes.NOW},
    ended_at: {type: DataTypes.DATE, allowNull: true},
    recording_url: {type: DataTypes.STRING, allowNull: true},

}, {
    tableName: 'sessions', timestamps: false
}); 
//Here we had timestamps as false because in other tables such as user and room we had timestamps: true ( this automatically adds createdAt and updatedAt)
//BUt here we are already have defined custom time fields as started_at and ended_at

module.exports=Session;


/*
This model:

2) Tracks each coding session inside a room
2) Stores:
    a) start time
    b) end time
    c) optional recording
3) Avoids default timestamps because you already have better, custom ones
*/