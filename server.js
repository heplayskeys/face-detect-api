const express = require('express');
const session = require('express-session');
const MemoryStore = require('memorystore')(session);
const cors = require('cors');
const bcrypt = require('bcryptjs');
const app = express();

process.env.NODE_TLS_REJECT_UNAUTHORIZED = 0;

const db = require('knex')({
	client: 'pg',
	connection: {
		connectionString: process.env.DATABASE_URL,
		ssl: true
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
		cookie: { maxAge: 86400000 },
		store: new MemoryStore({
			checkPeriod: 86400000
		}),
		resave: false,
		saveUninitialized: true,
		secret: 'yolo'
	})
);

app.get('/', (req, res) => {
	res.set({
		'Content-Security-Policy': "script-src 'self' https://apis.google.com"
	});
	res.sendStatus(200);
});

app.get('/users', getUsers(db));

app.post('/signin', signInUser(db, bcrypt));

app.post('/register', registerUser(db, bcrypt));

app.get('/profile/:id', getUserProfile(db));

app.put('/image', updateUserEntries(db));

app.post('/imageurl', (req, res) => handleClarifaiRequest(req, res));

app.listen(PORT, () => {
	console.log(`🌎 ==> Server now on port ${PORT}!`);
});
