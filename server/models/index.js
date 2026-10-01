const sequelize = require('../config/db');
const User = require('./User');
const Room = require('./Room');
const Session = require('./Session');
const Version = require('./Version');
const Message = require("./Message");
const RoomMember = require('./RoomMember');

// User <-> Room : Host Relationship
//one user can create many rooms, each room has one host.
User.hasMany(Room, {foreignKey: 'host_id', as: 'hostedRooms'});
Room.belongsTo(User, {foreignKey: 'host_id', as: 'host'});

//One room can have mutliple sessions, each session belongs to one room
Room.hasMany(Session, {foreignKey: 'room_id'});
Session.belongsTo(Room, {foreignKey: 'room_id'});

//One room has saved many versions
//a user can save many versions, each verison has an author
Room.hasMany(Version, { foreignKey: 'room_id' });
Version.belongsTo(Room, { foreignKey: 'room_id' });
User.hasMany(Version, { foreignKey: 'saved_by' });
Version.belongsTo(User, { foreignKey: 'saved_by', as: 'author' });

//one room has many messages
//one user many messages
//each message has a sender
Room.hasMany(Message, { foreignKey: 'room_id' });
Message.belongsTo(Room, { foreignKey: 'room_id' });
User.hasMany(Message, { foreignKey: 'sender_id' });
Message.belongsTo(User, { foreignKey: 'sender_id', as: 'sender' });

//RoomMember acts as a join table
//Tracks which users are in which rooms
//Many-To-Many relationship
Room.hasMany(RoomMember, { foreignKey: 'room_id' });
RoomMember.belongsTo(Room, { foreignKey: 'room_id' });
User.hasMany(RoomMember, { foreignKey: 'user_id' });
RoomMember.belongsTo(User, { foreignKey: 'user_id' });

//The following function is Databse Sync Function
const syncDB = async () => {
  try {
    await sequelize.authenticate();
    console.log('MySQL connected successfully.');

    // Use alter only in development, use safe sync in production
    if (process.env.NODE_ENV === 'production') {
      await sequelize.sync();  // only creates tables if they don't exist, never alters
    } else {
      await sequelize.sync({ alter: true });  // alter only locally
    }

    console.log('All tables synced');
  } catch (err) {
    console.error('Database connection error.', err);
    process.exit(1);
  }
};

module.exports = {sequelize, syncDB, User, Room, Session, Version, Message, RoomMember};

//This is where all database connections are connected.
// In another words, This file is the central place where all your models are connected (associations) and the database is initialized.
