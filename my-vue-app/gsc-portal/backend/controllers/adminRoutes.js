// Add this endpoint to run the migration
router.post('/migrations/add-inherit-attributes', adminMiddleware, async (req, res) => {
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