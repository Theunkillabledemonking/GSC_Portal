const { Sequelize } = require('sequelize');
require('dotenv').config(); // 환경 변수 로드

// ✅ Sequelize 인스턴스 생성
const sequelize = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASS,
    {
        host: process.env.DB_HOST,
        dialect: 'mysql',
        logging: false,
        pool: {
            max: 10,
            min: 0,
            acquire: 30000,
            idle: 10000
        }
    }
);

// ✅ DB 연결 확인
sequelize.authenticate()
    .then(() => console.log('✅ Sequelize MySQL 연결 성공!'))
    .catch(err => console.error('❌ Sequelize MySQL 연결 실패:', err));

module.exports = sequelize;
