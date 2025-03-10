const { DataTypes } = require('sequelize');
const sequelize = require('../config/sequelize');

const Event = sequelize.define('Event', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    timetable_id: { type: DataTypes.INTEGER, allowNull: true },
    subject_id: { type: DataTypes.INTEGER, allowNull: false },
    event_type: {
        type: DataTypes.ENUM('cancel', 'makeup', 'special'),
        allowNull: false
    },
    event_date: { type: DataTypes.DATEONLY, allowNull: false },
    level: { type: DataTypes.STRING, allowNull: true },
    start_period: { type: DataTypes.INTEGER, allowNull: true },
    end_period: { type: DataTypes.INTEGER, allowNull: true },
    start_time: { type: DataTypes.TIME, allowNull: true },
    end_time: { type: DataTypes.TIME, allowNull: true },
    description: { type: DataTypes.STRING, allowNull: true }
}, {
    tableName: 'timetable_events',
    timestamps: false
});

// 🔹 모델 간 관계 설정
Event.associate = (models) => {
    Event.belongsTo(models.Timetable, {
        foreignKey: 'timetable_id',
        as: 'timetable',
        onDelete: 'CASCADE'
    });
};

module.exports = Event;
