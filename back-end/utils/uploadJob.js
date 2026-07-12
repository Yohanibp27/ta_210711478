import multer from "multer";
import path from "path";

// Tentukan folder penyimpanan
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./uploads"); // folder tempat menyimpan foto
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname); // ambil ekstensi file
    cb(null, Date.now() + "-" + file.fieldname + ext);
  },
});

export const upload = multer({ storage });
