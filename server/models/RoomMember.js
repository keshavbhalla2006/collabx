const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const RoomMember = sequelize.define('RoomMember', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  room_id: { type: DataTypes.INTEGER, allowNull: false },
  user_id: { type: DataTypes.INTEGER, allowNull: false },
  role: { type: DataTypes.ENUM('host', 'member'), defaultValue: 'member' },
  //defines the user's role in the room, Allowed Values: host-> room creator/admin, member-> normal participant, default is 'member'

}, { tableName: 'room_members', timestamps: true });

module.exports = RoomMember;

/*
This code defines a RoomMember model, which is used to track which users are part of which rooms and what their role is.

Think of it as a bridge (junction table) between Users and Rooms.

many-to-many relationship table: 
1) one User can join many Rooms
2) one Room can have many Users


Real world FLOW:
1) when a room is created:
    RoomMember.create({
        room_id: room.id,
        user_id: creatorId,
        role: 'host'
    });
2) when someone joins:
    RoomMember.create({
        room_id: room.id,
        user_id: newUserId,
        role: 'member'
    });
3) when fethcing room members:
    RoomMember.findAll({ where: { room_id } });
*/