const express = require("express");
const cookieParser = require('cookie-parser');
const cookieSession = require('cookie-session');
const { getEmailbyUid, checkEmail, checkLogin, filterUsersUrl } = require('./helpers/helpers');

const bcrypt = require('bcryptjs');
const salt = bcrypt.genSaltSync(10);

const app = express();

app.use(cookieParser());

app.use(cookieSession({
  name: 'session',
  keys: ['key1', 'key2']
}))

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
users["aJ48lW"].password = bcrypt.hashSync("purple-monkey-dinosaur", salt);

app.get("/", (req, res) => {
  res.send("Hello!");
});

app.get("/hello", (req, res) => {
  const templateVars = { greeting: 'Hello World!' };
  return res.render("hello_world", templateVars);
});

// -- -- POST -- -- //

app.post("/register", (req, res) => {
  console.log(req.body.email);
  console.log(req.body.password);

  if (req.body.email === "" || req.body.password === "") { 
    //res.send("400: no email or password was entered"); 
    const message = "400: No email or password was entered";
    return res.status(400).send(message);
  }
  if (checkEmail(req.body.email, users)) { 
    const message =  "400: Email is alreadly use";
    return res.status(400).send(message);
  }

  const uid = generateRandomString();
  //console.log(req.body);
  const enPass = bcrypt.hashSync(req.body.password, salt);

  users[uid] = {
    id: uid,
    email: req.body.email,
    password: enPass
  };

  //console.log("test user DB:", users);
  //res.cookie("user_id ", uid);
  req.session.user_id = uid;
  return res.redirect("/urls");

});

app.post("/login", (req, res) => {
  //console.log(req.body.email);
  const acc = checkEmail(req.body.email, users);

  if (acc !== undefined) {
    //if (acc.password === req.body.password) {
    if (bcrypt.compareSync(req.body.password, acc.password)) {
      //res.cookie("user_id", acc.id);
      req.session.user_id = acc.id;
      return res.redirect("/urls");
    }
    const message = "403: Password doesn't match";
    return res.status(403).send(message);
  }
  const message = "403: Email cannot be found";
  return res.status(403).send(message);
  //res.redirect("/login");
});

app.post("/logout", (req, res) => {
  //res.clearCookie('user_id');
  //console.log("Cookie-Clear");
  delete req.session.user_id;
  res.redirect("/urls");
});

app.post("/urls", (req, res) => {
  const { user_id } = req.session;
  if (checkLogin(user_id, users)) { 
    const r = generateRandomString();
    urlDatabase[r] = {
      longURL: req.body.longURL,
      userID: user_id
    }
    //urlDatabase[r] = req.body.longURL;
    res.redirect("/urls/" + r);
  } else {
    const message =  "401: Unauthorized need to Login\n";
    res.status(400).send(message);
  }
  
});

app.post("/urls/:shortURL/delete", (req, res) => {
  //console.log(req.params.shortURL);
  const { user_id } = req.session;
  if (checkLogin(user_id, users)) { 
    delete urlDatabase[req.params.shortURL];
    res.redirect("/urls");
  } else {
    const message =  "401: Unauthorized need to Login\n";
    res.status(400).send(message);
  }
});

app.post("/urls/:shortURL/edit", (req, res) => {
  const { user_id } = req.session;
  if (checkLogin(user_id, users)) { 
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
  const { user_id } = req.session;
  const useremail = getEmailbyUid(user_id, users);
  const templateVars = {
    email: useremail
  };

  if (checkLogin(user_id, users)) {
    return res.redirect("/urls");
  } else {
    return res.render("register", templateVars);
  }
});

app.get("/login", (req, res) => {
  //console.log(req.cookies["user_id"]);
  const { user_id } = req.session;
  const useremail = getEmailbyUid(user_id, users);
  const templateVars = {
    email: useremail
  };

  if (checkLogin(user_id, users)) {
    return res.redirect("/urls");
  } else {
    return res.render("login", templateVars);
  }
});

app.get("/urls", (req, res) => {
  const { user_id } = req.session;
  const clogin = checkLogin(user_id, users);
  const userUrl = filterUsersUrl(user_id, urlDatabase);
  const useremail = getEmailbyUid(user_id, users);

  const templateVars = {
    login: clogin,
    email: useremail,
    urls: userUrl
  };
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  const { user_id } = req.session;
  const useremail = getEmailbyUid(user_id, users);
  const templateVars = {
    email: useremail
  };
  res.render("urls_new", templateVars);
});

app.get("/urls/:shortURL", (req, res) => {
  const { user_id } = req.session;
  let checkshortUrl = false;
  for (const u in urlDatabase) {
    if (u === req.params.shortURL) checkshortUrl = true;
  }

  if (checkshortUrl) {
    const useremail = getEmailbyUid(user_id, users);
    const templateVars = {
      email: useremail,
      shortURL: req.params.shortURL,
      longURL: urlDatabase[req.params.shortURL].longURL
    };

    //console.log(req);
    return res.render("urls_show", templateVars);

  }

  const message =  "404: Invalid Link";
  return res.status(400).send(message);
});

app.get("/u/:shortURL", (req, res) => {
  let checkshortUrl = false;
  for (const u in urlDatabase) {
    if (u === req.params.shortURL) checkshortUrl = true;
  }
  
  if (checkshortUrl) {
    const longURL = urlDatabase[req.params.shortURL].longURL;
    return res.redirect(longURL);
  }

  const message =  "404: Invalid shortUrl";
  return res.status(400).send(message);
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
