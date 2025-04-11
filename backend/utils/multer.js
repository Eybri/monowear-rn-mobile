const path = require("path");
const multer = require("multer");

module.exports = multer({
    limits: { fieldSize: 50 * 1024 * 1024 },
    storage: multer.diskStorage({}),
    fileFilter: (req, file, cb) => {
        let ext = path.extname(file.originalname).toLowerCase();
        if (ext !== ".jpg" && ext !== ".jpeg" && ext !== ".png" && ext !== ".jfif" && ext !== ".webp") {
            cb(new Error("Unsupported file type!"), false);
            return;
        }
        cb(null, true);
    },
});