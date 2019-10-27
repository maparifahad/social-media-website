const bcrypt = require("bcrypt");
const validator = require("validator");
const userCollection = require("../db")
  .db()
  .collection("user");
let User = function(data) {
  this.data = data;
  this.errors = [];
};

User.prototype.cleanup = function() {
  if (typeof this.data.username != "string") {
    this.data.username = "";
  }
  if (typeof this.data.email != "string") {
    this.data.email = "";
  }
  if (typeof this.data.password != "string") {
    this.data.password = "";
  }
  //getting rid of potential unwanted properties

  this.data = {
    username: this.data.username.trim().toLowerCase(),
    email: this.data.email.toLowerCase(),
    password: this.data.password
  };
};

User.prototype.validate = function() {
  return new Promise(async (resolve, reject) => {
    if (this.data.username == "") {
      this.errors.push("you must provide a username");
    }
    if (this.data.username > 0 && this.data.username < 2) {
      this.errors.push("username should be atleast 3 characters");
    }
    if (
      !validator.isAlphanumeric(this.data.username) &&
      this.data.username != ""
    ) {
      this.errors.push("Username can only contain alphabets and numbers");
    }
    if (!validator.isEmail(this.data.email)) {
      this.errors.push("Please enter a valid email address");
    }
    if (this.data.password == "") {
      this.errors.push("You must provide a password");
    }
    if (this.data.password > 0 && this.data.password < 8) {
      this.errors.push("Your password should be atleast 8 characters long");
    }
    if (this.data.password > 30) {
      this.errors.push("Your password should not exceed 30 characters");
    }

    if (validator.isAlphanumeric(this.data.username)) {
      let uniqueUsername = await userCollection.findOne({
        username: this.data.username
      });
      if (uniqueUsername) {
        this.errors.push("Username already taken");
      }
    }

    if (validator.isEmail(this.data.email)) {
      let uniqueEmail = await userCollection.findOne({
        email: this.data.email
      });
      if (uniqueEmail) {
        this.errors.push("Email already in use with another account");
      }
    }
    resolve();
  });
};

User.prototype.register = function() {
  return new Promise(async (resolve, reject) => {
    this.cleanup();
    await this.validate();

    // adding user data in database
    if (!this.errors.length) {
      let salt = bcrypt.genSaltSync(10);
      this.data.password = bcrypt.hashSync(this.data.password, salt);
      await userCollection.insertOne(this.data);
      resolve();
    } else {
      reject(this.errors);
    }
  });
};

User.prototype.login = function() {
  return new Promise((resolve, reject) => {
    this.cleanup();

    userCollection
      .findOne({ username: this.data.username })
      .then(user => {
        if (user && bcrypt.compareSync(this.data.password, user.password)) {
          this.data = user;
          resolve("logged in");
        } else {
          reject("invalid username or password");
        }
      })
      .catch(e => {
        reject("please try again");
      });
  });
};

User.findByUsername = username => {
  return new Promise((resolve, reject) => {
    if (typeof username != "string") {
      reject();
      return;
    }
    userCollection
      .findOne({ username: username })
      .then(user => {
        if (user) {
          user = {
            _id: user._id,
            username: user.username
          };
          resolve(user);
        } else {
          reject();
        }
      })
      .catch(() => {
        reject();
      });
  });
};

User.doesEmailExist = email => {
  return new Promise(async (resolve, reject) => {
    if (typeof email != "string") {
      resolve(false);
      return;
    }

    let user = await userCollection.findOne({ email: email });
    if (user) {
      resolve(true);
    } else {
      resolve(false);
    }
  });
};

module.exports = User;
