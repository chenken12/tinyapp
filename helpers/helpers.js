const getUserByEmail = function (email, database) {
  const gotEmail = checkEmail(email, database);
  if (gotEmail) {
    return gotEmail.id;
  }
  return undefined;
};

const getEmailbyUid = function (uid, userDb) {
  if (uid === undefined) {
    return undefined;
  } else {
    return userDb[uid].email;
  }
};

const checkEmail = function (email, userDb) {
  for (const a in userDb) {
    if (userDb[a].email === email) {
      return userDb[a];
    }
  }
  return undefined;
};

const checkLogin = function (uid, userDb) {
  for (const a in userDb) {
    if (userDb[a].id === uid ) {
      return true;
    }
  }
  return false;
};

const filterUsersUrl = function (uid, urlDatabase) {
  const uList = {};
  for (const list in urlDatabase) {
    if (urlDatabase[list].userID === uid ) {
      uList[list] = urlDatabase[list];
    }
  }
  return uList;
};

module.exports = { getEmailbyUid, checkEmail, checkLogin, filterUsersUrl, getUserByEmail };