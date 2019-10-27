const userCollection = require("../db")
  .db()
  .collection("user");
const followCollection = require("../db")
  .db()
  .collection("follow");
const ObjectID = require("mongodb").ObjectID;

let Follow = function(followedUsername, userId) {
  this.followedUsername = followedUsername;
  this.userId = userId;
  this.errors = [];
};

Follow.prototype.cleanup = function() {
  if (typeof this.followedUsername != "string") {
    this.followedUsername = "";
  }
};

Follow.prototype.validate = async function(action) {
  let followedAccount = await userCollection.findOne({
    username: this.followedUsername
  });
  if (followedAccount) {
    this.followedId = followedAccount._id;
  } else {
    this.errors.push("you can't follow a user that does not exist");
  }

  let followStat = await followCollection.findOne({
    followedId: this.followedId,
    userId: new ObjectID(this.userId)
  });

  if (action == "create") {
    if (followStat) {
      this.errors.push("you're already following that user");
    }
  }

  if (action == "delete") {
    if (!followStat) {
      this.errors.push("you can't unfollow someone you don't already follow");
    }
  }

  //self follow check

  if (this.followedId.equals(this.userId)) {
    this.errors.push("you can't follow yourself");
  }
};

Follow.prototype.create = function() {
  return new Promise(async (resolve, reject) => {
    this.cleanup();
    await this.validate("create");

    if (!this.errors.length) {
      followCollection.insertOne({
        followedId: this.followedId,
        userId: new ObjectID(this.userId)
      });
      resolve();
    } else {
      reject(this.errors);
    }
  });
};

Follow.prototype.delete = function() {
  return new Promise(async (resolve, reject) => {
    this.cleanup();
    await this.validate("delete");

    if (!this.errors.length) {
      followCollection.deleteOne({
        followedId: this.followedId,
        userId: new ObjectID(this.userId)
      });
      resolve();
    } else {
      reject(this.errors);
    }
  });
};

Follow.getFollowersById = function(id) {
  return new Promise(async (resolve, reject) => {
    try {
      let followers = await followCollection
        .aggregate([
          { $match: { followedId: id } },
          {
            $lookup: {
              from: "user",
              localField: "userId",
              foreignField: "_id",
              as: "userDoc"
            }
          },
          {
            $project: {
              username: { $arrayElemAt: ["$userDoc.username", 0] }
            }
          }
        ])
        .toArray();

      followers = followers.map(follower => {
        return { username: follower.username };
      });

      resolve(followers);
    } catch {
      reject();
    }
  });
};

Follow.getFollowingById = function(id) {
  return new Promise(async (resolve, reject) => {
    try {
      let following = await followCollection
        .aggregate([
          { $match: { userId: id } },
          {
            $lookup: {
              from: "user",
              localField: "followedId",
              foreignField: "_id",
              as: "userDoc"
            }
          },
          {
            $project: {
              username: { $arrayElemAt: ["$userDoc.username", 0] }
            }
          }
        ])
        .toArray();

      following = following.map(follower => {
        return { username: follower.username };
      });

      resolve(following);
    } catch {
      reject();
    }
  });
};

Follow.isUserFollowing = async (followedId, userId) => {
  let followDoc = await followCollection.findOne({
    followedId: followedId,
    userId: new ObjectID(userId)
  });
  if (followDoc) {
    return true;
  } else {
    return false;
  }
};

Follow.getFollowerCount = id => {
  return new Promise(async (resolve, reject) => {
    let followerCount = await followCollection.countDocuments({
      followedId: id
    });
    resolve(followerCount);
  });
};

Follow.getFollowingCount = id => {
  return new Promise(async (resolve, reject) => {
    let followingCount = await followCollection.countDocuments({
      userId: id
    });
    resolve(followingCount);
  });
};

module.exports = Follow;
