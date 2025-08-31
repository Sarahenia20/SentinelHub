// Sample vulnerable JavaScript code
const express = require('express');
const app = express();

// 🚨 SQL Injection vulnerability
app.get('/user/:id', (req, res) => {
  const query = "SELECT * FROM users WHERE id = " + req.params.id;
  db.query(query, (err, results) => {
    res.json(results);
  });
});

// 🔑 Hardcoded API key (will be detected)
const apiKey = "sk_live_1234567890abcdef1234567890abcdef";

// 🚨 Code injection vulnerability
app.post('/eval', (req, res) => {
  const result = eval(req.body.expression);
  res.json({ result });
});