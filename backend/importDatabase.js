const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function importDatabase() {
  try {
    // Read SQL file
    const sqlFile = path.join(__dirname, '../database/isp_database.sql');
    const sql = fs.readFileSync(sqlFile, 'utf8');

    // Connect to MySQL
    const connection = await mysql.createConnection({
      host: '127.0.0.1',
      user: 'root',
      port: 3306,
      multipleStatements: true,
      database: '', // Don't specify database initially
      waitForConnections: true
    });

    console.log('✓ Connected to MySQL');

    // Execute SQL
    await connection.query(sql);
    console.log('✓ Database imported successfully!');

    await connection.end();
    process.exit(0);
  } catch (error) {
    console.error('✗ Error:', error.message);
    process.exit(1);
  }
}

importDatabase();
