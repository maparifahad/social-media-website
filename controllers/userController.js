const User = require("../models/User");
const Post = require("../models/Post");
const Follow = require("../models/Follow");
const jwt = require("jsonwebtoken");

exports.sharedUserProfile = async (req, res, next) => {
  let isProfileOwner = false;
  let isFollowing = false;
  if (req.session.user) {
    isFollowing = await Follow.isUserFollowing(
      req.profileUser._id,
      req.visitorId
    );
    isProfileOwner = req.profileUser._id.equals(req.session.user._id);
  }

  req.isProfileOwner = isProfileOwner;
  req.isFollowing = isFollowing;

  let followingCountPromise = Follow.getFollowingCount(req.profileUser._id);
  let followerCountPromise = Follow.getFollowerCount(req.profileUser._id);
  let postsCountPromise = Post.getPostsCount(req.profileUser._id);

  let [followingCount, followerCount, postsCount] = await Promise.all([
    followingCountPromise,
    followerCountPromise,
    postsCountPromise
  ]);

  req.postsCount = postsCount;
  req.followerCount = followerCount;
  req.followingCount = followingCount;

  next();
};

exports.checkLogin = (req, res, next) => {
  if (req.session.user) {
    next();
  } else {
    req.flash("errors", "You should be logged in to create a post");
    req.session.save(() => {
      res.redirect("/");
    });
  }
};

exports.home = async (req, res) => {
  if (req.session.user) {
    let posts = await Post.getFeed(req.session.user._id);
    res.render("home-dashboard", {
      posts: posts
    });
  } else {
    res.render("home-guest", {
      regErrors: req.flash("regErrors")
    });
  }
};

exports.register = (req, res) => {
  let user = new User(req.body);
  user
    .register()
    .then(() => {
      req.session.user = { username: user.data.username, _id: user.data._id };
      req.session.save(() => {
        res.redirect("/");
      });
    })
    .catch(regErrors => {
      regErrors.map(error => {
        req.flash("regErrors", error);
      });

      req.session.save(() => {
        res.redirect("/");
      });
    });
};

exports.login = (req, res) => {
  let user = new User(req.body);

  user
    .login()
    .then(response => {
      req.session.user = { username: user.data.username, _id: user.data._id };
      req.session.save(() => {
        res.redirect("/");
      });
    })
    .catch(e => {
      req.flash("errors", e);
      req.session.save(() => {
        res.redirect("/");
      });
    });
};

exports.logout = (req, res) => {
  req.session.destroy(() => {
    res.redirect("/");
  });
};

exports.ifUserExist = (req, res, next) => {
  User.findByUsername(req.params.username)
    .then(user => {
      req.profileUser = user;
      next();
    })
    .catch(() => {
      res.render("404");
    });
};

exports.viewProfileScreen = (req, res) => {
  //retrive posts by user

  Post.findByAuthorId(req.profileUser._id)
    .then(posts => {
      res.render("profile", {
        posts: posts,
        page: "posts",
        profileUsername: req.profileUser.username,
        isFollowing: req.isFollowing,
        isProfileOwner: req.isProfileOwner,
        postsCount: req.postsCount,
        followerCount: req.followerCount,
        followingCount: req.followingCount
      });
    })
    .catch(() => {
      res.render("404");
    });
};

exports.viewFollowerProfileScreen = async (req, res) => {
  try {
    let followers = await Follow.getFollowersById(req.profileUser._id);
    res.render("profile-followers", {
      followers: followers,
      page: "followers",
      profileUsername: req.profileUser.username,
      isFollowing: req.isFollowing,
      isProfileOwner: req.isProfileOwner,
      postsCount: req.postsCount,
      followerCount: req.followerCount,
      followingCount: req.followingCount
    });
  } catch {
    res.render("404");
  }
};

exports.viewFollowingProfileScreen = async (req, res) => {
  try {
    let following = await Follow.getFollowingById(req.profileUser._id);
    res.render("profile-following", {
      following: following,
      page: "following",
      profileUsername: req.profileUser.username,
      isFollowing: req.isFollowing,
      isProfileOwner: req.isProfileOwner,
      postsCount: req.postsCount,
      followerCount: req.followerCount,
      followingCount: req.followingCount
    });
  } catch {
    res.render("404");
  }
};

exports.doesUsernameExist = (req, res) => {
  User.findByUsername(req.body.username)
    .then(() => {
      res.json(true);
    })
    .catch(() => {
      res.json(false);
    });
};

exports.doesEmailExist = async (req, res) => {
  let emailBool = await User.doesEmailExist(req.body.email);
  res.json(emailBool);
};

//api

exports.apiLogin = (req, res) => {
  let user = new User(req.body);

  user
    .login()
    .then(response => {
      res.json(
        jwt.sign({ _id: user.data._id }, process.env.JWTSECRET, {
          expiresIn: "2d"
        })
      );
    })
    .catch(e => {
      res.json("wtf");
    });
};

exports.apiMustBeLoggedIn = (req, res, next) => {
  try {
    req.apiUser = jwt.verify(req.body.token, process.env.JWTSECRET);
    next();
  } catch {}
};

exports.apiGetPostsByUsername = async (req, res) => {
  try {
    let authorDoc = await User.findByUsername(req.params.username);
    let posts = await Post.findByAuthorId(authorDoc._id);
    res.json(posts);
  } catch {
    res.json("Sorry, invalid user requested");
  }
};
