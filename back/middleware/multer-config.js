const multer = require("multer");
const path = require("path");

const MIME_TYPES = {
  "image/jpg": "jpg",
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

const storage = multer.diskStorage({
  destination: (req, file, callback) => {
    callback(null, "images");
  },
  filename: (req, file, callback) => {
    const fileName = file.originalname.split(" ").join("_");
    const extension = MIME_TYPES[file.mimetype];
    const nameWithoutExtension = path.parse(fileName).name;
    callback(null, nameWithoutExtension + Date.now() + "." + extension);
  },
});

module.exports = multer({ storage: storage }).single("image");
