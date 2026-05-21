const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Version = sequelize.define('Version', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  room_id: { type: DataTypes.INTEGER, allowNull: false },
  saved_by: { type: DataTypes.INTEGER, allowNull: false },
  code_snapshot: { type: DataTypes.TEXT, allowNull: false },
  language: { type: DataTypes.STRING, allowNull: false },
}, { tableName: 'versions', timestamps: true });

module.exports = Version;


//This code defines a Version model, which is typically used for saving snapshots of code in your collaborative coding app (kind of like a mini version control system).
/*
Real-world flow:
1) User clicks "Save Version"

2) Backend runs:

    Version.create({
        room_id,
        saved_by: userId,
        code_snapshot: currentCode,
        language
    });
3) A new version is stored
4) Later we can:
    a) Show version history
    b) Restore old code
*/