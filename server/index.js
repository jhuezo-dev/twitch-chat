/**
 * https://id.twitch.tv/oauth2/authorize?response_type=code&client_id=u42fcv6xdpsnn0hqvh316ccp6aofj9&redirect_uri=http://localhost:3000&scope=channel%3Amanage%3Apolls+channel%3Aread%3Apolls+openid+%3Amoderator%3Aread%3Achatters
 * 
 */

/* eslint-disable prettier/prettier */
import express from "express";
import session from "express-session";
import passport from "passport";
import { OAuth2Strategy } from "passport-oauth";
import request from "request";
import handlebars from "handlebars";
const app = express();
const port = 3000;

const TWITCH_CLIENT_ID = import.meta.env.TWITCH_CLIENT_ID;
const TWITCH_SECRET    = import.meta.env.TWTICH_CLIENT_SECRET;
// const SESSION_SECRET   = '<SOME SECRET HERE>';
const CALLBACK_URL     = 'http://localhost:3000';

// app.use(session({secret: }))
app.use(express.static('public'));
app.use(passport.initialize());
app.use(passport.session());
app.use(express.urlencoded({ extended: false }));

OAuth2Strategy.prototype.userProfile = ((accessToken, done) => {
  let options = {
    url: 'https://api.twitch.tv/helix/chat/chatters',
    method: 'GET',
    headers: {
      'Client-ID': TWITCH_CLIENT_ID,
      'Accept': 'application/vnd.twitchtv.v5+json',
      'Authorization': 'Bearer ' + accessToken
    }
  };

  request(options, (error, res, body) => {
    if(res && res.statusCode == 200) {
      done(null, JSON.parse(body));
    } else {
      done(JSON.parse(body));
    }
  });
});

passport.serializeUser(function(user, done) {
  done(null, user);
});

passport.deserializeUser(function(user, done) {
  done(null, user);
});

passport.use('twitch', new OAuth2Strategy({
  authorizationURL: 'https://id.twitch.tv/oauth2/authorize',
  tokenURL: 'https://id.twitch.tv/oauth2/token',
  clientID: TWITCH_CLIENT_ID,
  clientSecret: TWITCH_SECRET,
  callbackURL: CALLBACK_URL,
  state: true
},
function(accessToken, refreshToken, profile, done) {
  profile.accessToken = accessToken;
  profile.refreshToken = refreshToken;

  // Securely store user profile in your DB
  //User.findOrCreate(..., function(err, user) {
  //  done(err, user);
  //});

  done(null, profile);
}
));

// Set route to start OAuth link, this is where you define scopes to request
app.get('/auth/twitch', passport.authenticate('twitch', { scope: 'user_read' }));

// Set route for OAuth redirect
app.get('/auth/twitch/callback', passport.authenticate('twitch', { successRedirect: '/', failureRedirect: '/' }));

// Define a simple template to safely generate HTML with values from user's profile
var template = handlebars.compile(`
<html><head><title>Twitch Auth Sample</title></head>
<table>
  <tr><th>Access Token</th><td>{{accessToken}}</td></tr>
  <tr><th>Refresh Token</th><td>{{refreshToken}}</td></tr>
  <tr><th>Display Name</th><td>{{display_name}}</td></tr>
  <tr><th>Bio</th><td>{{bio}}</td></tr>
  <tr><th>Image</th><td>{{logo}}</td></tr>
</table></html>`);

// If user has an authenticated session, display it, otherwise display link to authenticate
app.get('/', function (req, res) {
if(req.session && req.session.passport && req.session.passport.user) {
  res.send(template(req.session.passport.user));
} else {
  // res.send('<html><head><title>Twitch Auth Sample</title></head><a href="/auth/twitch"><img src="http://ttv-api.s3.amazonaws.com/assets/connect_dark.png"></a></html>');
}
});



// app.post("https://id.twitch.tv/oauth2/token", (req, res) => {
//   const client_id = import.meta.env.TWITCH_CLIENT_ID;
//   const client_secret = import.meta.env.TWTICH_CLIENT_SECRET;
//   const code = import.meta.env.TWITCH_CODE;
//   const grant_type = 'authorization_code';
//   const redirect_uri = 'http://localhost:3000'

//   res.send(
//     {
//       client_id: client_id,
//       client_secret: client_secret,
//       code: code,
//       grant_type: grant_type,
//       redirect_uri: redirect_uri
//     }
//   )

//   // res.send("Hello World!");
// });

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
