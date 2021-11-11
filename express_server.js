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
  b6UTxQ: {
      longURL: "https://www.tsn.ca",
      userID: "aJ48lW"
  },
  i3BoGr: {
      longURL: "https://www.google.ca",
      userID: "aJ48lW"
  }
};

const users = { 
  "aJ48lW": {
    id: "aJ48lW", 
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
      return users[a];
    }
  }
  return false;
};

const checkLogin = function (uid) {
  for (const a in users) {
    if (users[a].id === uid ) {
      return true;
    }
  }
  return false;
};

const filterUsersUrl = function (uid) {
  const uList = {};
  for (const list in urlDatabase) {
    if (urlDatabase[list].userID === uid ) {
      uList[list] = urlDatabase[list];
    }
  }
  return uList;
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

app.post("/login", (req, res) => {
  console.log(req.body.email);
  const acc = checkEmail(req.body.email);

  //console.log(acc);
  if (acc !== false) {
    if (acc.password === req.body.password) {
      res.cookie("user_id", acc.id);
      res.redirect("/urls");
    }
    const message = "403: Password doesn't match";
    res.status(403).send(message);
  }
  const message = "403: Email cannot be found";
  res.status(403).send(message);
  //res.redirect("/login");
});

app.post("/urls", (req, res) => {
  if (checkLogin(req.cookies["user_id"])) { 
    const r = generateRandomString();
    urlDatabase[r] = {
      longURL: req.body.longURL,
      userID: req.cookies["user_id"]
    }
    //urlDatabase[r] = req.body.longURL;
    res.redirect("/urls/" + r);
  } else {
    const message =  "401: Unauthorized need to Login\n";
    res.status(400).send(message);
  }
  
});

app.post("/logout", (req, res) => {
  res.clearCookie('user_id');
  console.log("Cookie-Clear");
  res.redirect("/urls");
});

app.post("/urls/:shortURL/delete", (req, res) => {
  //console.log(req.params.shortURL);
  if (checkLogin(req.cookies["user_id"])) { 
    delete urlDatabase[req.params.shortURL];
    res.redirect("/urls");
  } else {
    const message =  "401: Unauthorized need to Login\n";
    res.status(400).send(message);
  }
});

app.post("/urls/:shortURL/edit", (req, res) => {
  if (checkLogin(req.cookies["user_id"])) { 
    urlDatabase[req.params.shortURL].longURL = req.body.longURL;
    res.redirect("/urls");
  } else {
    const message =  "401: Unauthorized need to Login\n";
    res.status(400).send(message);
  }
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

  if (checkLogin(req.cookies["user_id"])) {
    res.redirect("/urls");
  } else {
    res.render("register", templateVars);
  }
});

app.get("/login", (req, res) => {
  //console.log(req.cookies["user_id"]);
  const useremail = getEmail(req.cookies["user_id"]);
  const templateVars = {
    email: useremail
  };

  if (checkLogin(req.cookies["user_id"])) {
    res.redirect("/urls");
  } else {
    res.render("login", templateVars);
  }
});

app.get("/urls", (req, res) => {
  const clogin = checkLogin(req.cookies["user_id"]);
  const userUrl = filterUsersUrl(req.cookies["user_id"]);
  const useremail = getEmail(req.cookies["user_id"]);

  const templateVars = {
    login: clogin,
    email: useremail,
    urls: userUrl
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
  let checkshortUrl = false;
  for (const u in urlDatabase) {
    if (u === req.params.shortURL) checkshortUrl = true;
  }

  if (checkshortUrl) {
    const useremail = getEmail(req.cookies["user_id"]);
    const templateVars = {
      email: useremail,
      shortURL: req.params.shortURL,
      longURL: urlDatabase[req.params.shortURL].longURL
    };

    //console.log(req);
    res.render("urls_show", templateVars);

  } else {
    const message =  "404: Invalid Link";
    res.status(400).send(message);
  }
});

app.get("/u/:shortURL", (req, res) => {
  let checkshortUrl = false;
  for (const u in urlDatabase) {
    if (u === req.params.shortURL) checkshortUrl = true;
  }
  
  if (checkshortUrl) {
    const longURL = urlDatabase[req.params.shortURL].longURL;
    res.redirect(longURL);
  } else {
    const message =  "404: Invalid shortUrl";
    res.status(400).send(message);
  }
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
