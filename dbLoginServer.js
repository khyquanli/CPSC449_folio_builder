const mysql = require("mysql2");
const express = require("express");
const bcrypt = require("bcrypt");
const path = require("path");
const session = require("express-session");
const MySQLStore = require("express-mysql-session")(session);

const app = express();
const port = 3000;

// Static + body parsers
app.use(express.static(path.join(__dirname)));
app.use(express.urlencoded({ extended: true }));
app.use(express.json()); 

// MySQL
const db = mysql.createConnection({
  host: "localhost",
  user: "myuser",
  password: "mypassword",
  database: "mydb",
});
db.connect(err => {
  if (err) {
    console.error("Database connection failed:", err);
    return;
  }
  console.log("Connected to MySQL as ID " + db.threadId);
});

// Sessions
const sessionStore = new MySQLStore({}, db.promise());
app.use(
  session({
    key: "user_session",
    secret: "secretkey",
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 1000 * 60 * 60 * 2 }, // 2 hours
  })
);

// -------- Routes: pages
app.get("/", (req, res) => res.sendFile(path.join(__dirname, "index.html")));
app.get("/login", (req, res) => res.sendFile(path.join(__dirname, "login.html")));
app.get("/register", (req, res) => res.sendFile(path.join(__dirname, "userRegister.html")));

// -------- Auth: login
app.post("/login", (req, res) => {
  const { username, input_password } = req.body;
  db.query("SELECT * FROM users WHERE username = ?", [username], (err, rows) => {
    if (err) return res.status(500).send("Server error");
    if (!rows.length) return res.status(401).send("User not found");

    const user = rows[0];
    bcrypt.compare(input_password, user.password, (err, match) => {
      if (err) return res.status(500).send("Error checking password");
      if (!match) return res.status(401).send("Invalid password");

      req.session.user = { id: user.id, username: user.username, email: user.email };
      console.log("Login successful:", username);
      return res.redirect("/dashboard.html");
    });
  });
});

// -------- Auth: register
app.post("/register", (req, res) => {
  const { username, email, input_password, confirm_password } = req.body;
  if (input_password !== confirm_password) {
    return res.status(400).send("Passwords do not match");
  }
  bcrypt.hash(input_password, 10, (err, hashed_password) => {
    if (err) return res.status(500).send("Error hashing password");

    db.query(
      "INSERT INTO users (username, email, password) VALUES (?, ?, ?)",
      [username, email, hashed_password],
      (err, results) => {
        if (err) {
          if (err.code === "ER_DUP_ENTRY") {
            if (err.message.includes("username")) return res.status(400).send("Username already taken");
            if (err.message.includes("email")) return res.status(400).send("Email already registered");
          }
          return res.status(500).send("Database error");
        }

        const userId = results.insertId;

        // Initialize empty checklist row (optional but useful)
        db.query(
          "INSERT INTO user_checklist (user_id, checklist_state) VALUES (?, ?)",
          [userId, JSON.stringify({ domain: false, template: false, project: false, resume: false, design: false })]
        );

        console.log("User registered:", username);
        return res.redirect("/login");
      }
    );
  });
});

// -------- Session helpers for navbar
app.get("/checkSession", (req, res) => res.json({ loggedIn: !!req.session.user }));

app.get("/getUserInfo", (req, res) => {
  if (!req.session.user) return res.json({ loggedIn: false });
  const { username, email } = req.session.user;
  return res.json({ loggedIn: true, username, email });
});

// -------- Checklist persistence (dashboard)
app.get("/getChecklist", (req, res) => {
  if (!req.session.user) return res.status(401).json({ error: "Not logged in" });
  db.query(
    "SELECT checklist_state FROM user_checklist WHERE user_id = ?",
    [req.session.user.id],
    (err, rows) => {
      if (err) return res.status(500).json({ error: "Database error" });
      const state = rows && rows[0] ? rows[0].checklist_state : "{}";
      return res.json(state);
    }
  );
});

app.post("/saveChecklist", (req, res) => {
  if (!req.session.user) return res.status(401).json({ error: "Not logged in" });
  db.query(
    "UPDATE user_checklist SET checklist_state = ? WHERE user_id = ?",
    [JSON.stringify(req.body), req.session.user.id],
    err => {
      if (err) return res.status(500).json({ error: "Database error" });
      return res.json({ success: true });
    }
  );
});

// -------- Logout
app.post("/logout", (req, res) => {
  req.session.destroy(err => {
    if (err) return res.status(500).send("Logout failed");
    res.clearCookie("user_session");
    return res.redirect("/");
  });
});

// -------- Protected dashboard
app.get("/dashboard.html", (req, res) => {
  if (!req.session.user) return res.redirect("/login.html");
  return res.sendFile(path.join(__dirname, "dashboard.html"));
});

app.listen(port, () => console.log(`Server running at http://localhost:${port}`));
