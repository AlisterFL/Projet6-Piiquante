const express = require("express");
const router = express.Router();

const userCtrl = require("../controllers/user");
const email = require("../middleware/email-config");
const password = require("../middleware/password-config");

router.post("/signup", email, password, userCtrl.signup);
router.post("/login", userCtrl.login);

module.exports = router;
