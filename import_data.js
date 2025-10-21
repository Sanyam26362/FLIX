
require("dotenv").config();
const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");
const csv = require("csv-parser");
const Movie = require("./models/Movie"); 

const CSV_FILE_PATH = path.join(__dirname, 'movies_data.csv'); 
const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
    console.error("Error: MONGO_URI is not defined in the environment variables.");
    process.exit(1);
}
if (!fs.existsSync(CSV_FILE_PATH)) {
    console.error(`Error: CSV file not found at ${CSV_FILE_PATH}`);
    process.exit(1);
}

const importData = async () => {
    try {
        console.log("[MongoDB] Attempting to connect...");
        await mongoose.connect(MONGO_URI);
        console.log("[MongoDB] Database connected successfully.");

       
        console.log("Clearing existing Movie data...");
        await Movie.deleteMany({});
        console.log("Existing Movie collection cleared.");

        const moviesToInsert = [];
        const processedIds = new Set(); 
        
        let rowCount = 0;
        let skippedCount = 0;

        console.log("Starting CSV parsing...");

        fs.createReadStream(CSV_FILE_PATH)
            .pipe(csv())
            .on("data", (row) => {
                rowCount++;
                
                const movieId = parseInt(row.id);
                
                if (!row.title || isNaN(movieId) || !row.imdb_id || row.imdb_id === "" || processedIds.has(movieId)) {
                    skippedCount++;
                    return;
                }

                processedIds.add(movieId); 

                const genresArray = row.popular_sz_genres 
                                    ? row.popular_sz_genres.split('|').map(g => g.trim())
                                    : [];

                const movieDoc = {
                    id: movieId, 
                    imdb_id: row.imdb_id, 
                    
                    title: row.title,
                    description: row.product_description, 
                    genre: genresArray,
                    rating: parseFloat(row.vote_average),
                    
                    poster_path: row.poster_path, 
                    trailer_link: row.producer_trailer_link 
                };

                moviesToInsert.push(movieDoc);
            })
            .on("end", async () => {
                console.log(`CSV file successfully processed. Total rows found: ${rowCount}`);
                console.log(`Rows skipped due to missing/duplicate unique IDs or Title: ${skippedCount}`);
                console.log(`Inserting ${moviesToInsert.length} validated movie documents...`);

                try {
                    await Movie.insertMany(moviesToInsert);
                    console.log(`✅ Data Import Complete! Total movies inserted: ${moviesToInsert.length}`);
                } catch (err) {
                    console.error("❌ Error during batch insertion:", err.message);
                    console.error("The import failed due to a unique key error. Check data integrity.");
                } finally {
                    mongoose.connection.close();
                }
            })
            .on("error", (err) => {
                console.error("❌ Error reading CSV file:", err);
                mongoose.connection.close();
            });

    } catch (error) {
        console.error("❌ Fatal Error during setup:", error.message);
        if (mongoose.connection.readyState === 1) {
            mongoose.connection.close();
        }
        process.exit(1);
    }
};

importData();