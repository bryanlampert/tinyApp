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
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

//Home page
app.get("/", (req, res) => {
  res.end("Hello!");
});

// URLs page
app.get("/urls", (req, res) => {
  let templateVars = {
    username: req.cookies.username,
    urls: urlDatabase
  };
  res.render("urls_index", templateVars);
});

// Route and post the new urls created in the urls_new form
app.get("/urls/new", (req, res) => {
  let templateVars = {
    username: req.cookies.username
  };
  res.render("urls_new", templateVars);
});

// New page for each of the id's
app.get("/urls/:id", (req, res) => {
  if (urlDatabase[req.params.id]) {
    let templateVars = {
      username: req.cookies.username,
      shortURL: req.params.id,
      urls: urlDatabase
    };
    res.render("urls_show", templateVars);
  } else {
    res.status(404).send('Sorry.. Page not found!');
  }
});

//redirecting the short url to redirect
app.get("/u/:shortURL", (req, res) => {
  let longURL = urlDatabase[req.params.shortURL];
  res.redirect(longURL);
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

//User entering login
app.post("/login", (req, res) => {
  res.cookie('username', req.body.username);
  res.redirect("/urls");
});

//User logging out
app.post("/logout", (req, res) => {
  res.clearCookie("username");
  res.redirect("/urls");
});

// Adds randomstring to the url keys and redirects to this page
app.post("/urls", (req, res) => {
  let rdmUrl = generateRandomString ();
  urlDatabase[rdmUrl] = req.body.longURL;
  res.redirect(`/urls/${rdmUrl}`);
});

app.post("/urls/:id/edit", (req, res) => {
  urlDatabase[req.params.id] = req.body.updLongURL;
  res.redirect(`/urls/${req.params.id}`);
});

app.post("/urls/:id/delete", (req, res) => {
  delete urlDatabase[req.params.id];
  res.redirect('/urls');
});

app.get("/hello", (req, res) => {
  res.end("<html><body>Hello <b>World</b></body></html>\n");
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
