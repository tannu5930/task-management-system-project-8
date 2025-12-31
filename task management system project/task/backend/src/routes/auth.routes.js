import express from "express";
import { login, logout, signup, profilePicUpload, deleteProfilePic, deleteAccount, systeminfo, getUser } from "../controllers/auth.controllers.js";
import { authCheck } from "../middleware/authCheck.js";
import { upload } from "../middleware/multer.middleware.js"

const router = express.Router();

router.post("/signup", signup)
router.post("/login", login)
router.post("/logout", authCheck, logout)
router.get("/check", authCheck)
router.post("/profilepic", authCheck, upload.single("profilePic"), profilePicUpload);
router.delete('/profilepic', authCheck, deleteProfilePic);

router.delete("/delete-account", authCheck, deleteAccount);
router.get("/systeminfo", systeminfo);

router.get("/getuser", authCheck, getUser)


export default router;