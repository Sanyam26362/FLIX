

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

        try {
            await Movie.collection.dropIndex("title_text"); 
            console.log("Existing text index dropped successfully.");
        } catch (e) {
            if (e.code !== 27) { 
                 console.warn(`Could not drop old index (may not exist): ${e.message}`);
            }
        }
        
        console.log("Starting index creation on 'title' field for search optimization...");
        
        await Movie.collection.createIndex({ title: "text" }); 

        console.log(" Index rebuild complete! Search performance is now optimized.");

    } catch (error) {
        console.error(" Fatal Error during index creation/rebuild:", error.message);
    } finally {
        mongoose.connection.close();
    }
};

rebuildTextIndex();