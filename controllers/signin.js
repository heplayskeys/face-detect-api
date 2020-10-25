const jwt = require('jsonwebtoken');
const redis = require('redis');

// Setup Redis
const redisClient = redis.createClient(process.env.REDISCLOUD_URL);

const signInUser = async (db, bcrypt, req) => {
	const { email, password } = req.body;

	if (!email || !password) {
		return Promise.reject('Unable to sign in');
	}

	const hash = await db('login').where({ email }).select('password');
	const isValid = bcrypt.compareSync(password, hash[0].password);

	try {
		if (isValid) {
			const user = await db('users')
				.where({ email })
				.select('id', 'name', 'email', 'entries');
			return user[0];
		} else {
			return Promise.reject('Invalid email and password');
		}
	} catch {
		return Promise.reject('Invalid email and password');
	}
};

const createSession = user => {
	const { email, id } = user;
	const token = signToken(email);
	return setToken(token, id)
		.then(() => {
			return { success: 'true', id, token };
		})
		.catch(err => console.log('\nError\n', err, '\n'));
};

const setToken = (key, value) => {
	return Promise.resolve(redisClient.set(key, value));
};

const signToken = email => {
	const jwtPayload = { email };
	return jwt.sign(jwtPayload, process.env.JWT_SECRET, { expiresIn: '2 days' });
};

const getAuthTokenId = (req, res) => {
	const { authorization } = req.headers;

	console.log(authorization);

	redisClient.get(authorization, (err, response) => {
		if (err || !response) {
			return res.status(400).json('Unable to authorize user');
		}
		return res.json({ id: response });
	});
};

const authenticatedSignIn = (db, bcrypt) => (req, res) => {
	const { authorization } = req.headers;

	return authorization
		? getAuthTokenId(req, res)
		: signInUser(db, bcrypt, req)
				.then(data => {
					return data.id && data.email
						? createSession(data)
						: Promise.reject(data);
				})
				.then(session => res.json(session))
				.catch(err => res.status(400).json(err));
};

module.exports = {
	authenticatedSignIn,
	redisClient
};
