// -- express_server.js -- //

const express = require("express");
const cookieParser = require('cookie-parser');
const cookieSession = require('cookie-session');
const methodOverride = require('method-override')
const { getEmailbyUid, checkEmail, checkLogin, filterUsersUrl, generateRandomString } = require('./helpers/helpers');

const bcrypt = require('bcryptjs');
const salt = bcrypt.genSaltSync(10);

const app = express();

app.use(methodOverride('_method'));
app.use(cookieParser());

app.use(cookieSession({
  name: 'session',
  keys: ['key1', 'key2']
}));

const PORT = 8080; // default port 8080

app.set("view engine", "ejs");

const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended: true}));

const testDay = new Date();
const urlDatabase = {
  b6UTxQ: {
    longURL: "https://www.tsn.ca",
    userID: "aJ48lW",
    date: testDay.toLocaleString(),
    visits: 0
  },
  i3BoGr: {
    longURL: "https://www.google.ca",
    userID: "aJ48lW",
    date: testDay.toLocaleString(),
    visits: 0
  }
};

const users = {
  "aJ48lW": {
    id: "aJ48lW",
    email: "user@example.com",
    password: "purple-monkey-dinosaur"
  }
};
users["aJ48lW"].password = bcrypt.hashSync("purple-monkey-dinosaur", salt);

// -- -- POST -- -- //

// check if email and password is vaild. If yes then made add user the db 
app.post("/register", (req, res) => {
  console.log(req.body.email);
  console.log(req.body.password);

  if (req.body.email === "" || req.body.password === "") {
    //res.send("400: no email or password was entered");
    const message = "400: No email or password was entered <a href=\"/register\">try again</a>";
    return res.status(400).send(message);
  }
  if (checkEmail(req.body.email, users)) {
    const message =  "400: Email is alreadly use! <a href=\"/register\">try again</a>";
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

  //res.cookie("user_id ", uid);
  req.session.user_id = uid;
  return res.redirect("/urls");
});

// check if email is in the db then password. If everything matahes let user login
app.post("/login", (req, res) => {
  //console.log(req.body.email);
  const acc = checkEmail(req.body.email, users);

  if (acc === undefined) {
    const message = "403: Email cannot be found. <a href=\"/login\">try again</a>";
    return res.status(403).send(message);
  } else if (bcrypt.compareSync(req.body.password, acc.password)) {
    //res.cookie("user_id", acc.id);
    req.session.user_id = acc.id;
    return res.redirect("/urls");
  }
  const message = "403: Password doesn't match! <a href=\"/login\">try again</a>";
  return res.status(403).send(message);
});

app.post("/logout", (req, res) => {
  //res.clearCookie('user_id');
  //console.log("Cookie-Clear");
  delete req.session.user_id;
  res.redirect("/urls");
});

// get the user input then create a shortURL and add to the database 
app.post("/urls", (req, res) => {
  const { user_id } = req.session;
  if (checkLogin(user_id, users)) {
    const r = generateRandomString();
    const day = new Date();

    urlDatabase[r] = {
      longURL: req.body.longURL,
      userID: user_id,
      date: day.toLocaleString(),
      visits: 0
    };
    //urlDatabase[r] = req.body.longURL;
    return res.redirect("/urls/" + r);
  }
  const message =  "401: Unauthorized need to Login\n <a href=\"/login\">try again</a>";
  return res.status(400).send(message);
});

// -- -- GET -- -- //

app.get("/", (req, res) => {
  const { user_id } = req.session;
  if (checkLogin(user_id, users)) { 
    return res.redirect("/urls");
  } else {
    return res.redirect("login");
  }
});

// the register page the user the sign up
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

// the login page the user the sign in
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

// the main page where is deplay the list of user urls
app.get("/urls", (req, res) => {
  const { user_id } = req.session;
  const clogin = checkLogin(user_id, users);
  const userUrl = filterUsersUrl(user_id, urlDatabase);
  const useremail = getEmailbyUid(user_id, users);

  const templateVars = {
    login: clogin,
    email: useremail,
    urls: userUrl,
  };
  res.render("urls_index", templateVars);
});

// go the the add URL page, for user to add URL to there list
app.get("/urls/new", (req, res) => {
  const { user_id } = req.session;
  if (!checkLogin(user_id, users)) {
    return res.redirect("/login");
  }

  const useremail = getEmailbyUid(user_id, users);
  const templateVars = {
    email: useremail
  };
  res.render("urls_new", templateVars);
});

// go the the edit URL page
app.get("/urls/:shortURL", (req, res) => {
  const { user_id } = req.session;
  //const checkLogin = checkLogin(user_id, users);
  let checkshortUrl = false;
  for (const u in urlDatabase) {
    if (u === req.params.shortURL) checkshortUrl = true;
  }

  if (!checkshortUrl) {
    const message =  "404: Invalid Link <a href=\"/urls\">Url Page</a>";
    return res.status(404).send(message);
  } else if (user_id !== urlDatabase[req.params.shortURL].userID) {
    const message =  "404: Invalid Link Not Own by User! <a href=\"/urls\">Url Page</a>";
    return res.status(404).send(message);
  }

  const useremail = getEmailbyUid(user_id, users);
  const templateVars = {
    email: useremail,
    shortURL: req.params.shortURL,
    longURL: urlDatabase[req.params.shortURL].longURL
  };

  //console.log(req);
  return res.render("urls_show", templateVars);
});

// redirect user the the longURL
app.get("/u/:shortURL", (req, res) => {
  let checkshortUrl = false;
  for (const u in urlDatabase) {
    if (u === req.params.shortURL) checkshortUrl = true;
  }
  
  if (checkshortUrl) {
    urlDatabase[req.params.shortURL].visits += 1;
    const longURL = urlDatabase[req.params.shortURL].longURL;
    return res.redirect(longURL);
  }

  const message =  "404: Invalid shortUrl <a href=\"/urls\">Url Page</a>";
  return res.status(400).send(message);
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

// -- -- DELETE -- -- //

// let user delete unwanted shorturl
app.delete('/urls/:shortURL', function (req, res) {
  //console.log("New Delete:", req.params.shortURL);
  const { user_id } = req.session;
  // check if user is log in 
  if (checkLogin(user_id, users)) {
    // check if user match with the short url before edit
    if (user_id !== urlDatabase[req.params.shortURL].userID) {
      const message =  "400: Unable to delete not Own by User! <a href=\"/urls\">Url Page</a>";
      return res.status(404).send(message);
    }
    delete urlDatabase[req.params.shortURL];
    return res.redirect("/urls");
  }
  const message =  "401: Unauthorized need to Login\n <a href=\"/login\">try again</a>";
  return res.status(400).send(message);
});

// -- -- PUT/EDIT -- -- //

// let user edit or change the longURL, the short will stay the same
app.put('/urls/:shortURL', function (req, res) {
  const { user_id } = req.session;
  // check if user is log in 
  if (checkLogin(user_id, users)) {
    // check if user match with the short url before edit
    if (user_id !== urlDatabase[req.params.shortURL].userID) {
      const message =  "400: Unable to edit not Own by User! <a href=\"/urls\">Url Page</a>";
      return res.status(404).send(message);
    }
    urlDatabase[req.params.shortURL].longURL = req.body.longURL;
    return res.redirect("/urls");
  }
  const message =  "401: Unauthorized need to Login\n <a href=\"/login\">try again</a>";
  return res.status(400).send(message);
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
