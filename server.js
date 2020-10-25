const express = require('express');
const session = require('express-session');
const MemoryStore = require('memorystore')(session);
const cors = require('cors');
const bcrypt = require('bcryptjs');
const helmet = require('helmet');
const morgan = require('morgan');
const app = express();

// process.env.NODE_TLS_REJECT_UNAUTHORIZED = 0;

const db = require('knex')({
	client: 'pg',
	connection: {
		connectionString: process.env.DATABASE_URL,
		ssl: true
	}
});

const PORT = process.env.PORT || 3001;

const { registerUser, updateUserProfile } = require('./controllers/register');
const { getUsers, getUserProfile } = require('./controllers/users');
const { authenticatedSignIn } = require('./controllers/signin');
const {
	handleClarifaiRequest,
	updateUserEntries,
	uploadFile,
	emptyS3Folder
} = require('./controllers/image');
const { requireAuth } = require('./controllers/authorization');

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(helmet());
app.use(morgan('combined'));
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
	res.sendStatus(200);
});

app.get('/users', getUsers(db));

app.post('/signin', authenticatedSignIn(db, bcrypt));

app.post('/register', registerUser(db, bcrypt));

app.put('/register', requireAuth, updateUserProfile(db, bcrypt));

app.get('/profile/:id', requireAuth, getUserProfile(db));

app.post('/image/:id', (req, res) => uploadFile(req, res));

app.put('/image', requireAuth, updateUserEntries(db));

app.delete('/image/:id', (req, res) => emptyS3Folder(req, res));

app.post('/imageurl', (req, res) => handleClarifaiRequest(req, res));

app.listen(PORT, () => {
	console.log(`🌎 ==> Server now on port ${PORT}!`);
});
