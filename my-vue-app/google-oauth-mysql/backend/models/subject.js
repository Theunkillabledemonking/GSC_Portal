const { DataTypes } = require('sequelize');
const sequelize = require('../config/sequelize');

// models/subject.js
module.exports = (sequelize, DataTypes) => {
    const Subject = sequelize.define('Subject', {
        name: DataTypes.STRING
    }, { tableName: 'subjects', timestamps: false });

    Subject.associate = (models) => {
        // 예: Subject.hasMany(models.Timetable, { foreignKey: 'subject_id' });
    };

    return Subject;
};