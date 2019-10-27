const express = require("express"),
  app = express();
const router = require("./router");
const session = require("express-session");
const MongoStore = require("connect-mongo")(session);
const flash = require("connect-flash");
const markdown = require("marked");
const sanitizeHTML = require("sanitize-html");
const csrf = require("csurf");
const jwt = require("jsonwebtoken");

app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use("/api", require("./router-api"));

sessionOptions = session({
  secret: "javascript is kwel",
  store: new MongoStore({ client: require("./db") }),
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 1000 * 60 * 60 * 24, httpOnly: true }
});

app.use(sessionOptions);
app.use(flash());
app.use(express.static("public"));

app.set("views", "views");
app.set("view engine", "ejs");
app.use((req, res, next) => {
  if (req.session.user) {
    req.visitorId = req.session.user._id;
  } else {
    req.visitorId = 0;
  }
  res.locals.filterHTML = function(content) {
    return markdown(content);
  };
  res.locals.errors = req.flash("errors");
  res.locals.success = req.flash("success");
  res.locals.user = req.session.user;
  next();
});

app.use("/", router);

const server = require("http").createServer(app);
const io = require("socket.io")(server);

io.use(function(socket, next) {
  sessionOptions(socket.request, {}, next);
});

io.on("connection", socket => {
  if (socket.request.session.user) {
    let user = socket.request.session.user;

    socket.emit("welcome", { username: user.username });

    socket.on("chatMessageFromBrowser", data => {
      socket.broadcast.emit("chatMessageFromServer", {
        message: sanitizeHTML(data.message, {
          allowedTags: [],
          allowedAttributes: []
        }),
        username: user.username
      });
    });
  }
});

module.exports = server;
