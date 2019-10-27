const mongodb = require("mongodb");
const dotenv = require("dotenv");
dotenv.config();

let PORT = process.env.PORT || 3000;

mongodb.connect(
  process.env.CONNECTIONSTRING,
  { useNewUrlParser: true, useUnifiedTopology: true },
  (err, client) => {
    module.exports = client;
    const app = require("./app");
    app.listen(process.env.PORT);
  }
);
