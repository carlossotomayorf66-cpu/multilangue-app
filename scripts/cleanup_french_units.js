const { pool } = require('../config/db');

async function cleanupUnits() {
    try {
        console.log("Starting cleanup...");

        // 1. Get all French courses
        const [french] = await pool.query("SELECT id FROM languages WHERE name LIKE '%Francés%'");
        if (!french.length) {
            console.log("No French language found.");
            process.exit(0);
        }
        const langId = french[0].id;

        const [courses] = await pool.query("SELECT id FROM courses WHERE language_id = ?", [langId]);
        const courseIds = courses.map(c => c.id);

        if (!courseIds.length) {
            console.log("No French courses found.");
            process.exit(0);
        }

        console.log(`Checking ${courseIds.length} French courses...`);

        for (const cid of courseIds) {
            // A. Remove Unité 0
            await pool.query("DELETE FROM units WHERE course_id = ? AND title LIKE 'Unité 0%'", [cid]);

            // B. Rename Examen Final -> Examen A1
            await pool.query("UPDATE units SET title = 'Examen A1' WHERE course_id = ? AND title LIKE 'Examen Final%'", [cid]);

            // C. Fix Duplicates for Unité 1..6
            for (let i = 1; i <= 6; i++) {
                const base = `Unité ${i}`;
                const [units] = await pool.query("SELECT id, title FROM units WHERE course_id = ? AND title LIKE ?", [cid, `${base}%`]);

                if (units.length > 1) {
                    console.log(`Found ${units.length} duplicates for ${base} in course ${cid}`);

                    // Prefer the one with ':' (Long title), or if none, the first one.
                    let keeper = units.find(u => u.title.includes(':'));
                    if (!keeper) keeper = units[0];

                    const idsToDelete = units.filter(u => u.id !== keeper.id).map(u => u.id);

                    if (idsToDelete.length > 0) {
                        // Move activities? 
                        // For simplicity in this fix, we assume duplicate empty units were just created. 
                        // But if user worked on 'Unité 1', we might be deleting it if we keep 'Unité 1: Salutations'.
                        // Safer strategy: Keep the one with activities?
                        // Let's check activity count.

                        // BUT user said "borra todo lo demas". The duplicates are likely the result of my recent script.
                        // I will assume the 'Long Title' is the new one I made and probably empty, but looks better.
                        // The 'Short Title' is the old one.
                        // I will PRIORITIZE the Long Title (Style) but checking emptiness.
                        // Actually, merge activities to Keeper.

                        for (const badId of idsToDelete) {
                            await pool.query("UPDATE activities SET unit_id = ? WHERE unit_id = ?", [keeper.id, badId]);
                        }

                        await pool.query(`DELETE FROM units WHERE id IN (${idsToDelete.join(',')})`);
                        console.log(`Merged ${idsToDelete.length} units into ${keeper.title} (${keeper.id})`);
                    }
                }
            }
        }

        console.log("Cleanup finished.");
        process.exit(0);

    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

cleanupUnits();
