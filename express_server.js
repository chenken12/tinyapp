const express = require("express");
const cookieParser = require('cookie-parser')
const app = express();
app.use(cookieParser());

const PORT = 8080; // default port 8080

function generateRandomString() {
  return (Math.random() + 1).toString(36).substring(6);
}

app.set("view engine", "ejs");

const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended: true}));

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

app.get("/", (req, res) => {
  res.send("Hello!");
});

app.get("/hello", (req, res) => {
  const templateVars = { greeting: 'Hello World!' };
  res.render("hello_world", templateVars);
});

app.post("/urls", (req, res) => {
  const r = generateRandomString();
  //console.log("random", r);
  console.log(req.body);  // Log the POST request body to the console
  //res.send("Ok");         // Respond with 'Ok' (we will replace this)
  urlDatabase[r] = req.body.longURL;
  res.redirect("/urls/"+r);
});

app.post("/login", (req, res) => {
    console.log(req.body.username);
    const username = req.body.username;
    //res.send(req.body.username);
    res.cookie("username", username);
    console.log("Set-Cookie");
    res.redirect("/urls");
});

app.post("/logout", (req, res) => {
  res.clearCookie('username');
  console.log("Cookie-Clear");
  res.redirect("/urls");
});

app.post("/urls/:shortURL/delete", (req, res) => {
  //console.log(req.params.shortURL);
  delete urlDatabase[req.params.shortURL];
  res.redirect("/urls");
});

app.post("/urls/:shortURL/edit", (req, res) => {
  //console.log(req.params.shortURL);
  //console.log(req.body.longURL); 
  urlDatabase[req.params.shortURL] = req.body.longURL;
  res.redirect("/urls");
});

app.post("/urls/:shortURL", (req, res) => {
  //console.log(req.params.shortURL);
  const sURL = req.params.shortURL
  res.redirect("/urls/" + sURL);
});

app.get("/urls", (req, res) => {
  //console.dir(req.cookies.username);
  const templateVars = { 
    username: req.cookies["username"],
    urls: urlDatabase 
  };
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  res.render("urls_new");
});

app.get("/urls/:shortURL", (req, res) => {
  const templateVars = { shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL] };
  //console.log(req);
  res.render("urls_show", templateVars);
});

app.get("/u/:shortURL", (req, res) => {
  const longURL = urlDatabase[req.params.shortURL];
  res.redirect(longURL);
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});