const express = require('express');
const router = express.Router();

const { verifyToken, hasRole } = require('../middlewares/authMiddleware');
const {
    getAllUsers,
    getPendingUsers,
    updateUserStatus,
    updateUserInfo
} = require('../controllers/adminController');

// ✅ 전체 유저 목록 조회
router.get('/users', verifyToken, hasRole(1), getAllUsers);

// ✅ 승인 대기 유저만 조회
router.get('/users/pending', verifyToken, hasRole(1), getPendingUsers);

// ✅ 유저 승인 상태 변경 (0:대기, 1:승인, 2:거부)
router.patch('/users/:id/status', verifyToken, hasRole(1), updateUserStatus);

// ✅ 유저 정보 및 권한 수정
router.patch('/users/:id/info', verifyToken, hasRole(1), updateUserInfo);

// ✅ 데이터베이스 마이그레이션 - inherit_attributes 컬럼 추가
router.post('/migrations/add-inherit-attributes', verifyToken, hasRole(1), async (req, res) => {
  try {
    const fs = require('fs');
    const path = require('path');
    const migrationPath = path.join(__dirname, '../migrations/add_inherit_attributes_column.sql');
    
    if (!fs.existsSync(migrationPath)) {
      return res.status(404).json({ message: "Migration file not found" });
    }
    
    const migrationSql = fs.readFileSync(migrationPath, 'utf8');
    const statements = migrationSql.split(';').filter(s => s.trim());
    
    const pool = require('../config/db');
    for (const statement of statements) {
      if (statement.trim()) {
        await pool.query(statement);
      }
    }
    
    res.json({ 
      message: "Migration completed: inherit_attributes column added to timetable_events table",
      statements: statements.length
    });
  } catch (err) {
    console.error("Migration error:", err);
    res.status(500).json({ message: "Migration failed", error: err.message });
  }
});

module.exports = router;
