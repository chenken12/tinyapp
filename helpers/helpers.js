// -- helpers.js -- //

// generate a string that is 6 char long
const generateRandomString = function() {
  return (Math.random() + 1).toString(36).substring(6);
};

// return the user id by checking if the email is inside the db
const getUserByEmail = function(email, database) {
  const gotEmail = checkEmail(email, database);
  if (gotEmail) {
    return gotEmail.id;
  }
  return undefined;
};

//send the user id and db and return the user's email
const getEmailbyUid = function(uid, userDb) {
  if (uid === undefined) {
    return undefined;
  } else {
    return userDb[uid].email;
  }
};

// check if email in the db and return the user object if true
const checkEmail = function(email, userDb) {
  for (const a in userDb) {
    if (userDb[a].email === email) {
      return userDb[a];
    }
  }
  return undefined;
};

// check if the uid match inside the db
const checkLogin = function(uid, userDb) {
  for (const a in userDb) {
    if (userDb[a].id === uid) {
      return true;
    }
  }
  return false;
};

// send URL db and return an object url the is own by the user 
const filterUsersUrl = function(uid, urlDatabase) {
  const uList = {};
  for (const list in urlDatabase) {
    if (urlDatabase[list].userID === uid) {
      uList[list] = urlDatabase[list];
    }
  }
  return uList;
};

module.exports = { getEmailbyUid, checkEmail, checkLogin, filterUsersUrl, getUserByEmail, generateRandomString };