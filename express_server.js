const express = require("express");
const bodyParser = require("body-parser");
const cookieSession = require("cookie-session");
const bcrypt = require("bcrypt");
const app = express();
const PORT = process.env.PORT || 8080; // default port 8080
require('dotenv').config();

app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieSession({
  name: "session",
  keys: [process.env.KEYS1, process.env.KEYS2]
}));

app.set("view engine", "ejs");

//Current url database
let urlDatabase = {
  "Vazquez": {
    "b2xVn2": "http://www.lighthouselabs.ca",
    "9sm5xK": "http://www.google.com"
  },
  "Bradley": {
    "tfc123": "http://www.torontofc.ca",
    "mlssoc": "http://www.mlssoccer.com"
  },
  "Giovinco": {
    "Juve87": "http://www.juventus.com",
    "Reddit": "http://www.reddit.com"
  }
};

//Current Users database
const users = {
  "Giovinco": {
    id: "Giovinco",
    email: "seba@tfc.ca",
    password: bcrypt.hashSync("atomic-ant", 10)
  },
 "Vazquez": {
    id: "Vazquez",
    email: "VV@lamasia.es",
    password: bcrypt.hashSync("el-maestro", 10)
  },
  "Bradley": {
    id: "Bradley",
    email: "MB4@bradley.com",
    password: bcrypt.hashSync("yankee-general", 10)
  }
};

app.listen(PORT, () => {
  console.log(`TinyApp URL Shortener is listening on port ${PORT}!`);
});


//Function to generate a random string
function generateRandomString() {
  let randStr = "";
  let possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

  for (let i = 0; i < 6; i++)
    randStr += possible.charAt(Math.floor(Math.random() * possible.length));

  return randStr;
}

//Function to check that URLs displayed were created by the user
function urlsForUser(id) {
  for (let i in users) {
    if (users[i].id === id) {
      let usersUrls = urlDatabase[id];
      return usersUrls;
    }
  }
}

/* ---------------HOME--------------- */
//Home page
app.get("/", (req, res) => {
  if (req.session.user_id) {
    res.redirect("/urls");
    return;
  }
  res.redirect("/login");
});

/* ---------------Login--------------- */
/* Renders the login page
Checks if user is logged in;
Also sets cookies and variables based on if user
  has incorrectly attempted to login */
app.get("/login", (req, res) => {
  if (req.session.user_id) {
    res.redirect("/urls");
    return;
  }

  let templateVars = {
    user: users[req.session.user_id],
    login: true
  };

  if (req.session.loginPass) {
    templateVars.login = false;
    req.session = null;
  }

  res.render("login", templateVars);
});

/* Performs a check for the user:
If email and password are correct, sends the user to their URLs page
If either field incorrect, sends the user back to the login page
  an error message */
app.post("/login", (req, res) => {
  for (let l in users) {
    if (req.body.email === users[l].email) {
      if (bcrypt.compareSync(req.body.password, users[l].password)) {
        req.session.user_id = users[l].id;
        res.redirect("/urls");
        return;
      } else {
        req.session.loginPass = true;
        res.redirect("login");
        return;
      }
    }
  }
  req.session.loginPass = true;
  res.redirect("login");

});

/* ---------------Logout--------------- */
//Removes all cookies and redirects
app.post("/logout", (req, res) => {
  req.session = null;
  res.redirect("/urls");
});

/* ---------------Registration--------------- */
/* First checks if the user is already logged in. Redirects to their urls page if true
Sets cookies if email or password fields are blank
Finally sets cookies if the email is already created */
app.get("/register", (req, res) => {
  if (req.session.user_id) {
    res.redirect("/urls");
    return;
  }
  let templateVars = {
    user: users[req.session.user_id],
    blank: false,
    email: false
  };
  if (req.session.blank) {
    templateVars.blank = true;
    req.session = null;
  } else if (req.session.email) {
    templateVars.email = true;
    req.session = null;
  }
  res.render("register", templateVars);
});

/* Registration check
First checks if password or email fields are blank
Second checks if email is already in the database
If both conditions pass, user is created
  Their password is hashed and user is redirected to their urls page */
app.post("/register", (req, res) => {
  let rdmUserId = generateRandomString ();

  for (let j in users) {
    if (req.body.email === '' || req.body.password === '') {
      req.session.blank = true;
      res.redirect("/register");
      return;
    } else if (req.body.email === users[j].email) {
      req.session.email = true;
      res.redirect("/register");
      return;
    }
  }
  const password = req.body.password;
  const hashedPassword = bcrypt.hashSync(password, 10);
  req.session.user_id = rdmUserId;
  users[rdmUserId] = {
    id: rdmUserId,
    email: req.body.email,
    password: hashedPassword
  };
  urlDatabase[rdmUserId] = { };
  res.redirect("/urls");

});

/* ---------------URLS--------------- */
/* URLs page get.
  If the user is logged in -> takes the user to their list of urls
  If the user is not logged in -> takes the user to the login page */
app.get("/urls", (req, res) => {
  if (req.session.user_id) {
    let templateVars = {
      user: users[req.session.user_id],
      urls: urlsForUser(req.session.user_id)
    };
    res.render("urls_index", templateVars);
  } else {
    res.redirect("/login");
  }

});

/*  Creating a new short URL
  If user has logged in -> Send them to the create new url screen
  If the user has not logged in -> Redirect to the login page */
app.get("/urls/new", (req, res) => {
  if (req.session.user_id) {
    let templateVars = {
      user: users[req.session.user_id],
      urls: urlsForUser(req.session.user_id)
    };
    res.render("urls_new", templateVars);
    return;
  }
  res.redirect('/login');
});

// New page for each of the short urls info/edit/delete page
app.get("/urls/:id", (req, res) => {
  let templateVars = {
    user: users[req.session.user_id],
    shortURL: req.params.id,
    urls: urlsForUser(req.session.user_id)
  };
  res.render("urls_show", templateVars);
});

/* Short URLs created; Redirecting to actual website
 If the short urls is not in the database, returns the short url error page */
app.get("/u/:shortURL", (req, res) => {
  for (let u in urlDatabase) {
    if (urlDatabase[u][req.params.shortURL]) {
      let longURL = urlDatabase[u][req.params.shortURL];
      res.redirect(longURL);
      return;
    }
  }
  res.redirect("/u_error");
});

// New page for error checking if the short url is not in the database
app.get("/u_error", (req, res) => {
   let templateVars = {
    user: users[req.session.user_id],
  };
  res.render("u_error", templateVars);
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

// Generates short url, saves it to associated users url database and redirects to the new short urls info/edit/delete page
app.post("/urls", (req, res) => {
  let rdmUrl = generateRandomString ();
  urlsForUser(req.session.user_id)[rdmUrl] = req.body.longURL;
  res.redirect(`/urls/${rdmUrl}`);
});

// Edits the long url associated with the shorturl
app.post("/urls/:id/edit", (req, res) => {
  urlsForUser(req.session.user_id)[req.params.id] = req.body.updLongURL;
  res.redirect("/urls/");
});

// Delets the short url
app.post("/urls/:id/delete", (req, res) => {
  delete urlsForUser(req.session.user_id)[req.params.id];
  res.redirect("/urls");
});

