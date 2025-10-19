// routes/bookmarkRoutes.js
const express = require("express");
const auth = require("../middleware/authMiddleware");
const { addBookmark, getBookmarks, removeBookmark } = require("../controllers/bookmarkController"); // FIXED: Import correct controllers
const router = express.Router();

router.post("/", auth, addBookmark);
router.get("/", auth, getBookmarks);
router.delete("/:id", auth, removeBookmark); // ADDED: Delete route

module.exports = router;