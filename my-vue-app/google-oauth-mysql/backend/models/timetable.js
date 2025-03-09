const { DataTypes } = require('sequelize');
const sequelize = require('../config/sequelize');

module.exports = (sequelize, DataTypes) => {
    Timetable = sequelize.define('Timetable', {
        id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        year: { type: DataTypes.INTEGER, allowNull: false },
        level: { type: DataTypes.STRING, allowNull: true },
        day: { type: DataTypes.STRING, allowNull: false },
        start_period: { type: DataTypes.INTEGER, allowNull: false },
        end_period: { type: DataTypes.INTEGER, allowNull: false },
        subject_id: { type: DataTypes.INTEGER, allowNull: false },
        room: { type: DataTypes.STRING, allowNull: true },
    }, {
        tableName: 'timetables',
        timestamps: false
    });

    Timetable.associate = (models) => {
        Timetable.belongsTo(models.Subject, {
            foreignKey: 'subject_id',
            as: 'subject',
        });
        Timetable.belongsTo(models.User, {
            foreignKey: 'professor_id',
            as: 'professor'
        });
    };

    return Timetable;
}


