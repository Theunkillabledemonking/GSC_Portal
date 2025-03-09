const Sequelize = require('sequelize');
const sequelize = require('../config/sequelize');
const db = {};

db.sequelize = sequelize;
db.Sequelize = Sequelize;

db.timetable = require('./timetable')(sequelize, Sequelize.DataTypes);

module.exports = db;