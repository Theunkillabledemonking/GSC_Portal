const Sequelize = require('sequelize');
const sequelize = require('../config/sequelize');

const db = {};

db.sequelize = sequelize;
db.Sequelize = Sequelize;

db.Timetable = require('./timetable')(sequelize, Sequelize.DataTypes);
db.Subject = require('./subject')(sequelize, Sequelize.DataTypes);
db.User = require('./user')(sequelize, Sequelize.DataTypes);

// 모델 간 관계 설정
Object.keys(db).forEach((modelName) => {
    if (db[modelName].associate) {
        db[modelName].associate(db);
    }
});

module.exports = db;
