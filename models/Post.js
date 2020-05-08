const postCollection = require("../db")
  .db()
  .collection("posts");
const ObjectID = require("mongodb").ObjectID;
const sanitizeHTML = require("sanitize-html");
const followCollection = require("../db")
  .db()
  .collection("follow");

let Post = function(data, userid, postid) {
  this.data = data;
  this.errors = [];
  this.userid = userid;
  this.postid = postid;
};

Post.prototype.cleanup = function() {
  if (typeof this.data.title != "string") {
    this.data.title == "";
  }
  if (typeof this.data.body != "string") {
    this.data.body == "";
  }

  this.data = {
    title: sanitizeHTML(this.data.title.trim(), {
      allowedTags: [],
      allowedAttributes: []
    }),
    body: sanitizeHTML(this.data.body.trim(), {
      allowedTags: [],
      allowedAttributes: []
    }),
    createdDate: new Date(),
    author: ObjectID(this.userid)
  };
};

Post.prototype.validate = function() {
  if (this.data.title == "") {
    this.errors.push("You must provide a title");
  }
  if (this.data.body == "") {
    this.errors.push("you must provide post content");
  }
};

Post.prototype.create = function() {
  return new Promise((resolve, reject) => {
    this.cleanup();
    this.validate();

    if (!this.errors.length) {
      postCollection
        .insertOne(this.data)
        .then(info => {
          resolve(info.ops[0]._id);
        })
        .catch(e => {
          this.errors.push("please try again later...");
          reject(this.errors);
        });
    } else {
      reject(this.errors);
    }
  });
};

Post.prototype.update = function() {
  return new Promise(async (resolve, reject) => {
    try {
      let post = await Post.findSingleById(this.postid, this.userid);
      if (post.isPostOwner) {
        let status = await this.updatePost();
        resolve(status);
      } else {
        reject();
      }
    } catch {
      reject();
    }
  });
};

Post.postQuery = function(aggOp, visitorId) {
  return new Promise(async function(resolve, reject) {
    let aggOperation = aggOp.concat([
      {
        $lookup: {
          from: "user",
          localField: "author",
          foreignField: "_id",
          as: "authorDoc"
        }
      },
      {
        $project: {
          title: 1,
          body: 1,
          createdDate: 1,
          authorId: "$author",
          author: { $arrayElemAt: ["$authorDoc", 0] }
        }
      }
    ]);

    let posts = await postCollection.aggregate(aggOperation).toArray();

    posts = posts.map(post => {
      post.isPostOwner = post.authorId.equals(visitorId);
      post.authorId = undefined;

      post.author = {
        username: post.author.username
      };

      return post;
    });

    resolve(posts);
  });
};

Post.prototype.updatePost = function() {
  return new Promise(async (resolve, reject) => {
    this.cleanup();
    this.validate();

    if (!this.errors.length) {
      await postCollection.findOneAndUpdate(
        { _id: new ObjectID(this.postid) },
        { $set: { title: this.data.title, body: this.data.body } }
      );
      resolve("success");
    } else {
      reject("failure");
    }
  });
};

Post.findSingleById = function(id, visitorId) {
  return new Promise(async function(resolve, reject) {
    if (typeof id != "string" || !ObjectID.isValid(id)) {
      reject();
      return;
    }
    let posts = await Post.postQuery(
      [{ $match: { _id: new ObjectID(id) } }],
      visitorId
    );

    if (posts.length) {
      resolve(posts[0]);
    } else {
      reject();
    }
  });
};

Post.findByAuthorId = function(authorid) {
  return Post.postQuery([
    {
      $match: { author: authorid }
    },
    {
      $sort: { createdDate: -1 }
    }
  ]);
};

Post.delete = function(deletePostId, visitorId) {
  return new Promise(async (resolve, reject) => {
    try {
      let post = await Post.findSingleById(deletePostId, visitorId);
      if (post.isPostOwner) {
        await postCollection.deleteOne({ _id: new ObjectID(deletePostId) });
        resolve();
      } else {
        reject();
      }
    } catch {
      reject();
    }
  });
};

Post.search = searchTerm => {
  return new Promise(async (resolve, reject) => {
    if (typeof searchTerm == "string") {
      let posts = await Post.postQuery([
        { $match: { $text: { $search: searchTerm } } },
        { $sort: { score: { $meta: "textScore" } } }
      ]);
      resolve(posts);
    } else {
      reject();
    }
  });
};

Post.getPostsCount = id => {
  return new Promise(async (resolve, reject) => {
    let postsCount = await postCollection.countDocuments({ author: id });
    resolve(postsCount);
  });
};

Post.getFeed = async id => {
  //get following ids
  let followingId = await followCollection
    .find({ userId: new ObjectID(id) })
    .toArray();
  followingId = followingId.map(followingDoc => {
    return followingDoc.followedId;
  });

  // look for posts with following id's

  return Post.postQuery([
    { $match: { author: { $in: followingId } } },
    { $sort: { createdDate: -1 } }
  ]);
};

module.exports = Post;
