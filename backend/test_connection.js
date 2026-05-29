const db = require('./database');

async function testQueries() {
  console.log("Starting query translation test...");
  try {
    // Test count episodes
    const countRes = await db.get("SELECT COUNT(*) as count FROM episodes");
    console.log("Count Episodes Result:", countRes);

    // Test get episodes
    const eps = await db.all("SELECT * FROM episodes ORDER BY id DESC");
    console.log("Episodes list:", eps);

    // Test get user
    const user = await db.get("SELECT * FROM users WHERE username = ?", ["admin"]);
    console.log("Get User Result:", user);

    console.log("ALL QUERIES SUCCESSFUL!");
    process.exit(0);
  } catch (err) {
    console.error("QUERY ERROR:", err);
    process.exit(1);
  }
}

// Wait for connection to establish (Mongoose buffers but let's wait a moment)
setTimeout(testQueries, 2000);
