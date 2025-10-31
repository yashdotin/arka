process.removeAllListeners('warning');
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const passport = require('passport');
const LocalStrategy = require('passport-local');
const passportLocalMongoose = require('passport-local-mongoose');
const User = require('./models/user.js');
const Chat = require('./models/chat');
const app = express();
const port = process.env.PORT || 3000;
const ejsMate = require('ejs-mate');
const path = require('path');
const methodOverride = require('method-override');
const flash = require('connect-flash');
const { isLoggedIn } = require('./middleware.js');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const bodyParser = require('body-parser');
const fetch = require('node-fetch'); 
const OpenAI = require("openai");




const openai = new OpenAI({
  apiKey: process.env.LLAMA_API_KEY,
   baseURL: 'https://integrate.api.nvidia.com/v1',
});




app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride('_method'));
app.use(express.static(path.join(__dirname, '/public')));




// EJS setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.engine('ejs', ejsMate);



// Session config
const sessionOptions = {
  secret: process.env.SECRET,
  resave: false,
  saveUninitialized: true,
  cookie: {
    expires: Date.now() + 1000 * 60 * 60 * 24 * 7,
    maxAge: 1000 * 60 * 60 * 24 * 7,
    httpOnly: true
  }
};

app.use(session(sessionOptions));
app.use(flash());

// Passport config
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// Flash & currentUser middleware
app.use((req, res, next) => {
  res.locals.success = req.flash("success");
  res.locals.error = req.flash("error");
  res.locals.currentUser = req.user;
  next();
});

// MongoDB connection
mongoose.connect(process.env.ATLASDB_URL, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("mongoDb connected"))
  .catch(err => console.error("MongoDB connection error:", err));

// --- ROUTES ---

app.get('/', (req, res) => res.render("pages/home.ejs"));

// Signup routes
app.get('/signup', (req, res) => res.render("users/signup.ejs"));

app.post('/signup', async (req, res, next) => {
  try {
    const { username, email, password } = req.body;
    const newUser = new User({ username, email });
    const registeredUser = await User.register(newUser, password);
    req.login(registeredUser, err => {
      if (err) return next(err);
      req.flash("success", "Welcome to Arka!");
      res.redirect("/");
    });
  } catch (e) {
    req.flash("error", e.message);
    res.redirect("/signup");
  }
});

// Signin routes
app.get('/signin', (req, res) => res.render("users/login.ejs"));

app.post('/signin',
  passport.authenticate('local', { failureFlash: true, failureRedirect: '/signin' }),
  (req, res) => {
    req.flash("success", "Welcome back!");
    const redirectUrl = req.session.returnTo || '/chat';
    delete req.session.returnTo;
    res.redirect(redirectUrl);
  }
);

// Logout
app.get('/logout', isLoggedIn, (req, res, next) => {
  req.logout(err => {
    if (err) return next(err);
    req.flash("success", "Goodbye!");
    res.redirect('/');
  });
});

// Profile routes
app.get('/profile', isLoggedIn, (req, res) => res.render("pages/profile.ejs", { data: req.user }));
app.get('/edit', isLoggedIn, (req, res) => res.render("pages/edit.ejs", { data: req.user }));

app.put('/profile', isLoggedIn, async (req, res, next) => {
  try {
    const { username, email, bio, location } = req.body;
    await User.findByIdAndUpdate(req.user._id, { username, email, bio, location });
    req.flash("success", "Profile updated successfully!");
    res.redirect('/profile');
  } catch (e) {
    next(e);
  }
});

// Forgot password routes
app.get('/forgot', (req, res) => res.render('users/forgot.ejs'));

app.post('/forgot', async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      req.flash('error', 'No account with that email exists.');
      return res.redirect('/forgot');
    }

    const token = crypto.randomBytes(20).toString('hex');
    user.resetPasswordToken = token;
    user.resetPasswordExpires = Date.now() + 3600000;
    await user.save();

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    const resetURL = `https://arka-oh4z.onrender.com/reset/${token}`;

<<<<<<< HEAD
    await transporter.sendMail({
      to: user.email,
      from: 'arkasolutions007@gmail.com',
      subject: 'Password Reset Link - Arka',
      text: `Click here to reset your password: ${resetURL}`
    });
=======
   const info = await transporter.sendMail({
  to: user.email,
  from: process.env.EMAIL_USER,
  subject: 'Password Reset Link - Arka',
  text: `Hey ${user.username || ''},
>>>>>>> 9f8a160 (Initial commit)

You requested to reset your password for Arka. Click the link below to set a new one:
${resetURL}

If you didn’t request this, just ignore this message.

— The Arka Team`
});
console.log("Mail response:", info);

    console.log(resetURL);
    req.flash('success', 'An email has been sent with password reset instructions.(check spam folder too)');
    res.redirect('/forgot');

  } catch (err) {
    console.log(err);
    req.flash('error', err.message || 'Something went wrong.');
    res.redirect('/forgot');
  }
});

// Reset password routes
app.get('/reset/:token', async (req, res) => {
  const user = await User.findOne({
    resetPasswordToken: req.params.token,
    resetPasswordExpires: { $gt: Date.now() }
  });

  if (!user) {
    req.flash('error', 'Password reset token is invalid or has expired.');
    return res.redirect('/forgot');
  }

  res.render('users/reset.ejs', { token: req.params.token });
});

app.post('/reset/:token', async (req, res) => {
  try {
    const user = await User.findOne({
      resetPasswordToken: req.params.token,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
      req.flash('error', 'Password reset token is invalid or has expired.');
      return res.redirect('/forgot');
    }

    if (req.body.password !== req.body.confirm) {
      req.flash('error', 'Passwords do not match.');
      return res.render('users/reset.ejs', { token: req.params.token });
    }

    await user.setPassword(req.body.password);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    req.login(user, err => {
      if (err) throw err;
      req.flash('success', 'Password has been reset successfully!');
      res.redirect('/');
    });
  } catch (err) {
    console.log(err);
    req.flash('error', 'Something went wrong.');
    res.redirect('/forgot');
  }
});

// Chat routes 
//  Chat Routes
app.get('/chat', isLoggedIn, async (req, res) => {
  const messages = await Chat.find({ user: req.user._id }).sort({ createdAt: 1 });
  res.render('pages/chat.ejs', { messages, currentUser: req.user.username });
});




app.post('/chat/send', isLoggedIn, async (req, res) => {
  try {
    const { message } = req.body;

    if (!message || message.trim() === '') {
      return res.status(400).json({ error: 'Message cannot be empty.' });
    }

    const completion = await openai.chat.completions.create({
      model: "meta/llama-3.3-70b-instruct",
      messages: [
        { role: "system", content: "You are Arka AI, a helpful and friendly assistant.,Arka is still improving under the surveillance of yash awasthi (specific person), everytime i'll talk to you with new start " },
        { role: "user", content: message }
      ],
      temperature: 0.3,
      max_tokens: 512,
    });

    const reply = completion.choices[0]?.message?.content?.trim() || "No response from AI.";
    res.json({ reply });

  } catch (err) {
    console.error("Chat error:", err);
    res.status(500).json({ error: "Failed to get a response from the model." });
  }
});


// Error handler
app.use((err, req, res, next) => {
  const { statusCode = 500, message = "Something Went Wrong" } = err;
  res.status(statusCode).render("error.ejs", { message });
});

// Start server
app.listen(port, () => console.log(`Example app listening on port ${port}`));
