const express = require("express");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const app = express();
const PORT = process.env.PORT || 8080; // default port 8080

app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());

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

//Users database
const users = {
  "Giovinco": {
    id: "Giovinco",
    email: "seba@tfc.ca",
    password: "atomic-ant"
  },
 "Vazquez": {
    id: "Vazquez",
    email: "VV@lamasia.es",
    password: "el-maestro"
  },
  "Bradley": {
    id: "Bradley",
    email: "MB4@bradley.com",
    password: "yankee-general"
  }
};

function urlsForUser(id) {
  for (let i in users) {
    if (users[i].id === id) {
      let usersUrls = urlDatabase[id];
      return usersUrls;
    }
  }
}

//Home page
app.get("/", (req, res) => {
  res.end("Hello!");
});

// URLs page
app.get("/urls", (req, res) => {
  let templateVars = {
    user: users[req.cookies.user_id],
    urls: urlsForUser(req.cookies.user_id)
  };
  res.render("urls_index", templateVars);
});

//Renders the login page
app.get("/login", (req, res) => {
  let templateVars = {
    user: users[req.cookies.user_id],
    email: req.cookies.email,
    password: req.cookies.password
  };
  res.render("login", templateVars);
});

// Checks if user has logged in, if so send to the create new url screen
app.get("/urls/new", (req, res) => {
  let loggedIn = false;
  for (let i in users) {
    if (req.cookies.user_id === users[i].id) {
      let templateVars = {
        user: users[req.cookies.user_id],
        urls: urlsForUser(req.cookies.user_id)
      };
      loggedIn = true;
      res.render("urls_new", templateVars);
    }
  }
  if (loggedIn === false) {
    res.redirect('/login');
  }

});

//Renders the registration page
app.get("/register", (req, res) => {
  let templateVars = {
    user: users[req.cookies.user_id],
    email: req.cookies.email,
    password: req.cookies.password
  };
  res.render("register", templateVars);
});

// New page for each of the id's
app.get("/urls/:id", (req, res) => {
  if (urlDatabase[req.cookies.user_id][req.params.id]) {
    let templateVars = {
      user: users[req.cookies.user_id],
      shortURL: req.params.id,
      urls: urlsForUser(req.cookies.user_id)
    };
    res.render("urls_show", templateVars);
  } else {
    res.status(404).send('Sorry.. Please login to access this page!');
  }
});

//redirecting the short url to redirect
app.get("/u/:shortURL", (req, res) => {
  for (let u in urlDatabase) {
    if (urlDatabase[u][req.params.shortURL]) {
      let longURL = urlDatabase[u][req.params.shortURL];
      res.redirect(longURL);
      return;
    }
  }
  res.redirect("/urls/new");
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

//Login check
app.post("/login", (req, res) => {
  for (let l in users) {
    if (req.body.email == users[l].email) {
      if (req.body.password == users[l].password) {
        res.cookie('user_id', users[l].id);
        res.redirect("/urls");
        return;
      } else {
        res.status(403).send(`403! Password incorrect!`);
        return;
      }
    }
  }
  res.status(403).send(`403! Email not found!`);
});

//Registration check
app.post("/register", (req, res) => {
  let rdmUserId = generateRandomString ();

  for (let j in users) {
    if (req.body.email === '' || req.body.password === '') {
      return res.status(400).send(`400! Request could not be completed! Please enter a valid email/password.`);
    } else if (req.body.email === users[j].email) {
      return res.status(400).send(`400! Request could not be completed! Email already in use! ...sorry`);
    }
  }

  res.cookie('user_id', rdmUserId);
  users[rdmUserId] = {
    id: rdmUserId,
    email: req.body.email,
    password: req.body.password
  };
  res.redirect("/urls");

});

//User logging out
app.post("/logout", (req, res) => {
  res.clearCookie("user_id");
  res.redirect("/urls");
});

// Adds randomstring to the url keys and redirects to this page
app.post("/urls", (req, res) => {
  let rdmUrl = generateRandomString ();
  urlsForUser(req.cookies.user_id)[rdmUrl] = req.body.longURL;
  res.redirect(`/urls/${rdmUrl}`);
});

app.post("/urls/:id/edit", (req, res) => {
  urlsForUser(req.cookies.user_id)[req.params.id] = req.body.updLongURL;
  res.redirect(`/urls/${req.params.id}`);
});

app.post("/urls/:id/delete", (req, res) => {
  delete urlsForUser(req.cookies.user_id)[req.params.id];
  res.redirect('/urls');
});

app.get("/hello", (req, res) => {
  res.end("<html><body>Temp <b>Page</b></body></html>\n");
});

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
