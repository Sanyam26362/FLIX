const express = require("express");
const auth = require("../middleware/authMiddleware");
const { addBookmark, getBookmarks, removeBookmark } = require("../controllers/bookmarkController");
const router = express.Router();

router.post("/", auth, addBookmark);
router.get("/", auth, getBookmarks);
router.delete("/:id", auth, removeBookmark);
module.exports = router;