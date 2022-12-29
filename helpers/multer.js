import multer from 'multer'
import path from 'path'

let storage = multer.diskStorage({
    destination: 'public/uploads',
    filename: (req, file, cb) => {
		console.log(req);
	   const ext  = path.parse(file.originalname).ext;
	   const name = path.parse(file.originalname).name;
	   cb(null, `${name}-${Date.now()}${ext}`);
	},
});
export const upload = multer({
    storage: storage
})
//export default upload
