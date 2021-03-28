var express = require('express');
var router = express.Router();

const crypto = require('crypto');
const authTokens = {};

const getHashedPassword = (password) => {
    const sha256 = crypto.createHash('sha256');
    const hash = sha256.update(password).digest('base64');
    return hash;
}

const generateAuthToken = () => {
  return crypto.randomBytes(30).toString('hex');
}

var users = [
  // This user is added to the array to avoid creating a new user on each restart
  {
      firstName: 'John',
      lastName: 'Doe',
      email: 'johndoe@email.com',
      // This is the SHA256 hash for value of `password`
      password: 'XohImNooBHFR0OVvjcYpJ3NgPQ1qq73WKhHvch0VQtg='
  }
];

router.use((req, res, next) => {
  // Get auth token from the cookies
  const authToken = req.cookies['AuthToken'];

  // Inject the user to the request
  req.user = authTokens[authToken];

  next();
});

const requireAuth = (req, res, next) => {
  console.log("req: " + req.body)
  console.log("res: " + res.body)
  if (req.user) {
      next();
  } else {
      res.render('login', {
          message: 'Please login to continue',
          messageClass: 'alert-danger'
      });
  }
};

/* GET home page. */
router.get('/', function (req, res) {
  res.render('home');
});

router.get('/login', (req, res) => {
  res.render('login');
});

router.post('/login', (req, res) => {
    const { email, password } = req.body;
    const hashedPassword = getHashedPassword(password);

    const user = users.find(u => {
        return u.email === email && hashedPassword === u.password
    });

    if (user) {
        const authToken = generateAuthToken();

        // Store authentication token
        authTokens[authToken] = user;

        // Setting the auth token in cookies
        res.cookie('AuthToken', authToken);

        // Redirect user to the protected page
        res.redirect('/protected');
    } else {
        res.render('login', {
            message: 'Invalid username or password',
            messageClass: 'alert-danger'
        });
    }
});

router.get('/register', (req, res) => {
  res.render('registration');
});

router.post('/register', (req, res) => {
  const { email, firstName, lastName, password, confirmPassword } = req.body;
  // Check if the password and confirm password fields match
  if (password === confirmPassword) {

      // Check if user with the same email is also registered
      if (users.find(user => user.email === email)) {

          res.render('register', {
              message: 'User already registered.',
              messageClass: 'alert-danger'
          });

          return;
      }

      const hashedPassword = getHashedPassword(password);

      // Store user into the database if you are using one
      users.push({
          firstName,
          lastName,
          email,
          password: hashedPassword
      });

      res.render('login', {
          message: 'Registration Complete. Please login to continue.',
          messageClass: 'alert-success'
      });
  } else {
      res.render('register', {
          message: 'Password does not match.',
          messageClass: 'alert-danger'
      });
  }
});

router.get('/protected', requireAuth, (req, res) => {
  res.render('protected');
});

//implementation for logout route
router.get('/logout', requireAuth, (req,res) => {
  //Delete tokens from array of tokens
  delete authTokens[req.cookies.AuthToken];
  console.log(authTokens);
  //cancel from array
  /*
  var filtered = users.filter(function(el) { 
    return el.email !== user.email && el.password !== user.password
  });  
  users = filtered
  */

  //redirect to home
  res.redirect('/');
})

module.exports = router;