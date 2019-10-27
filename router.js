const express = require("express");
const router = express.Router();
const userController = require("./controllers/userController");
const postController = require("./controllers/postController");
const followController = require("./controllers/followController");

//user related routes
router.get("/", userController.home);
router.post("/register", userController.register);
router.post("/login", userController.login);
router.post("/logout", userController.logout);
router.post("/doesUsernameExist", userController.doesUsernameExist);
router.post("/doesEmailExist", userController.doesEmailExist);

//profiile related routes
router.get(
  "/profile/:username",
  userController.ifUserExist,
  userController.sharedUserProfile,
  userController.viewProfileScreen
);

router.get(
  "/profile/:username/followers",
  userController.ifUserExist,
  userController.sharedUserProfile,
  userController.viewFollowerProfileScreen
);

router.get(
  "/profile/:username/following",
  userController.ifUserExist,
  userController.sharedUserProfile,
  userController.viewFollowingProfileScreen
);

//post related routes
router.get(
  "/create-post",
  userController.checkLogin,
  postController.viewCreatePost
);

router.post("/create-post", userController.checkLogin, postController.create);
router.get("/post/:id", postController.viewSinglePost);
router.get(
  "/post/:id/edit",
  userController.checkLogin,
  postController.viewEditScreen
);
router.post("/post/:id/edit", userController.checkLogin, postController.edit);
router.post(
  "/post/:id/delete",
  userController.checkLogin,
  postController.delete
);
router.post("/search", postController.search);

//follow routes
router.post(
  "/addfollow/:username",
  userController.checkLogin,
  followController.addFollow
);

router.post(
  "/removefollow/:username",
  userController.checkLogin,
  followController.stopFollow
);

router.get("/*", (req, res) => {
  res.send("page not found 404");
});

module.exports = router;
