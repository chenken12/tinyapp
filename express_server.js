const express = require("express");
const cookieParser = require('cookie-parser');
const app = express();
app.use(cookieParser());

const PORT = 8080; // default port 8080

const generateRandomString = function() {
  return (Math.random() + 1).toString(36).substring(6);
};

app.set("view engine", "ejs");

const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended: true}));

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

const users = { 
  "userRandomID": {
    id: "userRandomID", 
    email: "user@example.com", 
    password: "purple-monkey-dinosaur"
  }
}

const getEmail = function (uid) {
  if (uid === undefined) {
    return undefined;
  } else {
    return users[uid].email;
  }
};

const checkEmail = function (email) {
  for (const a in users) {
    if (users[a].email === email) {
      return true;
    }
  }
  return false;
};

app.get("/", (req, res) => {
  res.send("Hello!");
});

app.get("/hello", (req, res) => {
  const templateVars = { greeting: 'Hello World!' };
  res.render("hello_world", templateVars);
});

// -- -- POST -- -- //

app.post("/register", (req, res) => {
  console.log(req.body.email);
  console.log(req.body.password);

  if (req.body.email === "" || req.body.password === "") { 
    //res.send("400: no email or password was entered"); 
    const message = "400: No email or password was entered";
    res.status(400).send(message);
  } else {
    if (checkEmail(req.body.email)) { 
      const message =  "400: Email is alreadly use";
      res.status(400).send(message);
    }

    const uid = generateRandomString();
    //console.log(req.body);
    users[uid] = {
      id: uid,
      email: req.body.email,
      password: req.body.password
    };
    res.cookie("user_id ", uid);
    res.redirect("/urls");
  }
});

app.post("/urls", (req, res) => {
  const r = generateRandomString();
  //console.log("random", r);
  console.log(req.body);  // Log the POST request body to the console
  //res.send("Ok");         // Respond with 'Ok' (we will replace this)
  urlDatabase[r] = req.body.longURL;
  res.redirect("/urls/" + r);
});

app.post("/login", (req, res) => {
  console.log(req.body.email);
  let acc;
  for (const a in users) {
    if (users[a].email === req.body.email) {
      acc = users[a];
    }
  }

  //console.log(acc);
  if (acc !== undefined) {
    res.cookie("user_id", acc.id);
  }
  res.redirect("/urls");
});

app.post("/logout", (req, res) => {
  res.clearCookie('user_id');
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
  const sURL = req.params.shortURL;
  res.redirect("/urls/" + sURL);
});

// -- -- GET -- -- //

app.get("/register", (req, res) => {
  const useremail = getEmail(req.cookies["user_id"]);
  const templateVars = {
    email: useremail
  };
  res.render("register", templateVars);
});

app.get("/urls", (req, res) => {
  const useremail = getEmail(req.cookies["user_id"]);
  const templateVars = {
    email: useremail,
    urls: urlDatabase
  };
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  const useremail = getEmail(req.cookies["user_id"]);
  const templateVars = {
    email: useremail
  };
  res.render("urls_new", templateVars);
});

app.get("/urls/:shortURL", (req, res) => {
  const useremail = getEmail(req.cookies["user_id"]);
  const templateVars = {
    email: useremail,
    shortURL: req.params.shortURL,
    longURL: urlDatabase[req.params.shortURL]
  };
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