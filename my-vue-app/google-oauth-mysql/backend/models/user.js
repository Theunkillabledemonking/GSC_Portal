// models/user.js
module.exports = (sequelize, DataTypes) => {
    const User = sequelize.define('User', {
        name: DataTypes.STRING
    }, { tableName: 'users', timestamps: false });

    User.associate = (models) => {
        // 예: User.hasMany(models.Timetable, { foreignKey: 'professor_id' });
    };

    return User;
};
