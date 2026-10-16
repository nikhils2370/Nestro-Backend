// middleware/upload.js

import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import cloudinary from "../config/cloudinary.js";
const storage = new CloudinaryStorage({
cloudinary,
params: {
folder:
"categories",
allowed_formats: ["jpg", "png", "jpeg", "webp"],
},
});
const upload = multer({ storage });

export default upload;