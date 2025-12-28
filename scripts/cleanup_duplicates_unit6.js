const { pool } = require('../config/db');

async function cleanup() {
    try {
        console.log("Cleaning up duplicates for Unit 6...");
        // Delete the activity with the specific OLD title
        const [res] = await pool.query("DELETE FROM activities WHERE title = 'Quiz Unité 6: Passé Composé' AND type = 'QUIZ'");
        console.log(`Deleted ${res.affectedRows} old activities.`);
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

cleanup();
