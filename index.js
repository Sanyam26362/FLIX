// ====================================================================
// --- rebuild_index.js (FINAL INDEX REBUILD SCRIPT) ---
// ====================================================================

require("dotenv").config();
const mongoose = require("mongoose");
const Movie = require("./models/Movie"); 

const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
    console.error("Error: MONGO_URI is not defined in the environment variables.");
    process.exit(1);
}

const rebuildTextIndex = async () => {
    try {
        console.log("[MongoDB] Attempting to connect to rebuild index...");
        await mongoose.connect(MONGO_URI);
        console.log("[MongoDB] Database connected successfully.");

        // --- Step 1: Drop Existing Indexes ---
        // This clears out any slow, conflicting indexes left over from troubleshooting.
        try {
            // Attempt to drop any text index that exists (the specific name doesn't matter)
            await Movie.collection.dropIndex("title_text"); 
            console.log("Existing text index dropped successfully.");
        } catch (e) {
            if (e.code !== 27) { 
                 console.warn(`Could not drop old index (may not exist): ${e.message}`);
            }
        }
        
        // --- Step 2: Create the Optimized Text Index ---
        console.log("Starting index creation on 'title' field for search optimization...");
        
        // This creates the dedicated 'text' index required for the fast $text:$search operator
        await Movie.collection.createIndex({ title: "text" }); 

        console.log("✅ Index rebuild complete! Search performance is now optimized.");

    } catch (error) {
        console.error("❌ Fatal Error during index creation/rebuild:", error.message);
    } finally {
        mongoose.connection.close();
    }
};

rebuildTextIndex();