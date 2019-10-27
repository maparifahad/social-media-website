const Post = require("../models/Post");
const sendgrid = require("@sendgrid/mail");
sendgrid.setApiKey(process.env.SENDGRIDKEY);

exports.viewCreatePost = (req, res) => {
  res.render("create-post");
};

exports.create = (req, res) => {
  let post = new Post(req.body, req.session.user._id);

  post
    .create()
    .then(newid => {
      req.flash("success", "new post created");
      req.session.save(() => {
        res.redirect(`/post/${newid}`);
      });
    })
    .catch(errors => {
      errors.forEach(error => {
        req.flash("errors", error);
      });
      req.session.save(() => {
        res.redirect("/create-post");
      });
    });
};

exports.viewSinglePost = async function(req, res) {
  try {
    let post = await Post.findSingleById(req.params.id, req.visitorId);
    res.render("single-post-screen", { post });
  } catch {
    res.render("404");
  }
};

exports.viewEditScreen = async function(req, res) {
  try {
    let post = await Post.findSingleById(req.params.id, req.visitorId);
    if (post.isPostOwner) {
      res.render("edit-post", { post: post });
    } else {
      req.flash("errors", "You do not have permission to perform that action.");
      req.session.save(() => res.redirect("/"));
    }
  } catch {
    res.render("404");
  }
};

exports.edit = function(req, res) {
  let post = new Post(req.body, req.visitorId, req.params.id);
  post
    .update()
    .then(status => {
      if (status == "success") {
        req.flash("success", "post successfully edited");
        req.session.save(() => {
          res.redirect(`/post/${req.params.id}`);
        });
      } else {
        post.errors.forEach(error => {
          req.flash("errors", error);
        });
        req.session.save(() => {
          res.redirect(`/post/${req.params.id}/edit`);
        });
      }
    })
    .catch(() => {
      req.flash("errors", "You don't permission to perform that task");
      req.session.save(() => {
        res.redirect("/");
      });
    });
};

exports.delete = function(req, res) {
  Post.delete(req.params.id, req.visitorId)
    .then(() => {
      req.flash("success", "post successfully deleted");
      req.session.save(() => {
        res.redirect(`/profile/${req.session.user.username}`);
      });
    })
    .catch(() => {
      req.flash("errors", "you don't have permission to perform that task");
      req.session.save(() => {
        res.redirect("/");
      });
    });
};

exports.search = (req, res) => {
  Post.search(req.body.searchTerm)
    .then(response => {
      res.json(response);
    })
    .catch(() => {
      res.json([]);
    });
};

//api

exports.apiCreate = (req, res) => {
  let post = new Post(req.body, req.apiUser._id);

  post
    .create()
    .then(newid => {
      res.json("congrats");
    })
    .catch(errors => {
      res.json(errors);
    });
};

//
exports.apiDelete = (req, res) => {
  Post.delete(req.params.id, req.apiUser._id)
    .then(() => {
      res.json("deleted");
    })
    .catch(() => {
      res.json("action denied");
    });
};
