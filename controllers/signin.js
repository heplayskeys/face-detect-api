const signInUser = (db, bcrypt) => async (req, res) => {
	const { email, password } = req.body;

	if (!email || !password) {
		return res.status(400).json('Unable to sign in');
	}

	const hash = await db('login').where({ email }).select('password');
	const isValid = bcrypt.compareSync(password, hash[0].password);

	try {
		if (isValid) {
			res.setHeader(
				'Access-Control-Allow-Origin',
				'https://boiling-brushlands-70070.herokuapp.com'
			);
			res.setHeader(
				'Access-Control-Allow-Methods',
				'GET, POST, OPTIONS, PUT, PATCH, DELETE'
			);
			res.setHeader(
				'Access-Control-Allow-Headers',
				'X-Requested-With,content-type'
			);
			res.setHeader('Access-Control-Allow-Credentials', true);

			const user = await db('users')
				.where({ email })
				.select('id', 'name', 'entries');
			const { id, name, entries } = user[0];
			res.status(200).json({ id, name, entries });
		} else throw new Error();
	} catch {
		res.status(400).json('Invalid email and password');
	}
};

module.exports = {
	signInUser
};
