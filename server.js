const express = require('express');
const session = require('express-session');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const app = express();
const db = require('knex')({
	client: 'pg',
	connection: {
		host: '127.0.0.1',
		user: '',
		password: '',
		database: 'face-detect'
	}
});

const PORT = process.env.PORT || 3001;

const { registerUser } = require('./controllers/register');
const { getUsers, getUserProfile } = require('./controllers/users');
const { signInUser } = require('./controllers/signin');
const {
	handleClarifaiRequest,
	updateUserEntries
} = require('./controllers/image');

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cors());

app.use(
	session({
		secret: 'yolo',
		resave: false,
		saveUninitialized: true,
		cookie: { secure: 'auto' }
	})
);

app.get('/', (req, res) => res.sendStatus(200));

app.get('/users', getUsers(db));

app.post('/signin', signInUser(db, bcrypt));

app.post('/register', registerUser(db, bcrypt));

app.get('/profile/:id', getUserProfile(db));

app.put('/image', updateUserEntries(db));

app.post('/imageurl', (req, res) => handleClarifaiRequest(req, res));

app.listen(PORT, () => {
	console.log(`🌎 ==> Server now on port ${PORT}!`);
});
