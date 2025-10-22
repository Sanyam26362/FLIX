

require("dotenv").config();
const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");
const csv = require("csv-parser");
const Movie = require("./models/Movie"); 

const CSV_FILE_PATH = path.join(__dirname, "movies_data.csv");
const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  console.error(" Error: MONGO_URI is not defined in the environment variables.");
  process.exit(1);
}

if (!fs.existsSync(CSV_FILE_PATH)) {
  console.error(` Error: CSV file not found at ${CSV_FILE_PATH}`);
  process.exit(1);
}

const importData = async () => {
  try {
    console.log("⏳ Connecting to MongoDB...");
    await mongoose.connect(MONGO_URI);
    console.log(" MongoDB connection established successfully.");

    console.log("🧹 Clearing existing movie data...");
    await Movie.deleteMany({});
    console.log(" Movie collection cleared.");

    const moviesToInsert = [];
    const processedIds = new Set();

    let rowCount = 0;
    let skippedCount = 0;

    console.log("📂 Starting CSV parsing...");

    fs.createReadStream(CSV_FILE_PATH)
      .pipe(csv())
      .on("data", (row) => {
        rowCount++;

        const movieId = parseInt(row.id);

        if (
          !row.title ||
          isNaN(movieId) ||
          !row.imdb_id ||
          row.imdb_id.trim() === "" ||
          processedIds.has(movieId)
        ) {
          skippedCount++;
          return;
        }
        processedIds.add(movieId);

        const genresArray = row.genres
          ? row.genres.split(",").map((g) => g.trim())
          : [];

        const movieDoc = {
          title: row.title,
          id: movieId,
          imdb_id: row.imdb_id,

          genre: genresArray,
          vote_average: parseFloat(row.vote_aver) || 0,
          vote_count: parseInt(row.vote_coun) || 0,
          runtime: parseInt(row.runtime) || 0,
          release_date: row.release_dat,
          production_countries: row.production_countries,

          poster_path: row.poster_path,
          trailer_link: row.trailer_link,
          popularity: parseFloat(row.popularity) || 0
        };

        moviesToInsert.push(movieDoc);
      })
      .on("end", async () => {
        console.log(`📊 CSV parsing complete.`);
        console.log(`➡️  Total rows found: ${rowCount}`);
        console.log(`🚫 Skipped rows: ${skippedCount}`);
        console.log(`✅ Valid movies to insert: ${moviesToInsert.length}`);

        try {
          if (moviesToInsert.length > 0) {
            await Movie.insertMany(moviesToInsert);
            console.log(` Data import complete! ${moviesToInsert.length} movies inserted.`);
          } else {
            console.log(" No valid movies found to insert.");
          }
        } catch (err) {
          console.error(" Error during batch insertion:", err.message);
        } finally {
          mongoose.connection.close();
          console.log(" MongoDB connection closed.");
        }
      })
      .on("error", (err) => {
        console.error(" Error reading CSV file:", err.message);
        mongoose.connection.close();
      });

  } catch (error) {
    console.error(" Fatal error during import:", error.message);
    if (mongoose.connection.readyState === 1) mongoose.connection.close();
    process.exit(1);
  }
};

importData();
