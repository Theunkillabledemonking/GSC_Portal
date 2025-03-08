module.exports = (sequelize, DataTypes) => {
    const Timetable = sequelize.define("Timetable", {
        year: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        level: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        subject_id: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        start_time: {
            type: DataTypes.TIME,
            allowNull: false
        },
        end_time: {
            type: DataTypes.TIME,
            allowNull: false
        },
        room: {
            type: DataTypes.STRING,
            allowNull: true
        },
        description: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        day: {
            type: DataTypes.STRING,
            allowNull: false
        },
        start_period: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        end_period: {
            type: DataTypes.INTEGER,
            allowNull: false
        }
    }, {
        tableName: 'timetables',
        timestamps: false
    });

    return Timetable;
};
