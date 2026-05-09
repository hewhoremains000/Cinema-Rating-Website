const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");

const app = express();


app.use(cors());
app.use(express.json());

//DATABASE
const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "root123",   
  database: "cinerate"
});

db.connect(err => {
  if (err) {
    console.error("DB Connection Failed:", err);
    return;
  }
  console.log("MySQL Connected ");
});



//REGISTER 
app.post("/register", (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({
      success: false,
      message: "All fields required"
    });
  }

  const checkUser = "SELECT * FROM users WHERE username = ?";
  db.query(checkUser, [username], (err, result) => {
    if (err) {
      return res.status(500).json({ success: false, message: "DB error" });
    }

    if (result.length > 0) {
      return res.status(400).json({
        success: false,
        message: "User already exists"
      });
    }

    const insertUser = "INSERT INTO users (username, password) VALUES (?, ?)";
    db.query(insertUser, [username, password], (err) => {
      if (err) {
        return res.status(500).json({ success: false, message: "Insert failed" });
      }

      res.json({
        success: true,
        message: "User registered successfully"
      });
    });
  });
});


//LOGIN 
app.post("/login", (req, res) => {
  const { username, password } = req.body;

  const sql = "SELECT * FROM users WHERE username = ? AND password = ?";

  db.query(sql, [username, password], (err, results) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: "Database error"
      });
    }

    if (results.length > 0) {
      return res.json({
        success: true,
        user: results[0]
      });
    } else {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials"
      });
    }
  });
});


//ADD REVIEW
app.post("/review", (req, res) => {
  const { user_id, movie_id, rating, review } = req.body;

  if (!user_id || !movie_id || !rating) {
    return res.status(400).json({
      success: false,
      message: "Missing data"
    });
  }

  const sql = `
    INSERT INTO reviews (user_id, movie_id, rating, review_text)
    VALUES (?, ?, ?, ?)
  `;

  db.query(sql, [user_id, movie_id, rating, review], (err) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: "Review insert failed"
      });
    }

    res.json({
      success: true,
      message: "Review added"
    });
  });
});


//GET REVIEWS
app.get("/reviews/:movieId", (req, res) => {
  const movieId = req.params.movieId;

  const sql = `
    SELECT reviews.*, users.username
    FROM reviews
    JOIN users ON reviews.user_id = users.id
    WHERE movie_id = ?
  `;

  db.query(sql, [movieId], (err, results) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: "Fetch error"
      });
    }

    res.json(results);
  });
});


//SERVER 
app.listen(5000, () => {
  console.log("Server running on http://localhost:5000 ");
});