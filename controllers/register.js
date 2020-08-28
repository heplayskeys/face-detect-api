const registerUser = (db, bcrypt) => (req, res) => {
	const { password, confirmPassword, name, email } = req.body;

	if (!email || !name || !password || !confirmPassword) {
		return res.status(400).json('Unable to register user');
	}

	if (!validateEmail(email)) {
		return res.status(400).json('Invalid email format');
	}

	if (!validatePassword(password)) {
		return res
			.status(400)
			.json(
				'Password must be between 8 to 15 characters and contain at least one lowercase letter, one uppercase letter, one numeric digit, and one special character'
			);
	}

	if (password === confirmPassword) {
		bcrypt.hash(password, 10, (err, hash) => {
			if (err) throw err;

			db.transaction(async trx => {
				try {
					const userEmail = await trx
						.insert({ password: hash, email })
						.into('login')
						.returning('email');
					const user = await trx
						.insert({
							name,
							email: userEmail[0],
							joined: new Date()
						})
						.into('users')
						.returning('*');
					await trx.commit();
					res.status(200).json(user[0]);
				} catch {
					await trx.rollback();
					res.status(400).json('Unable to register');
				}
			});
		});
	} else {
		res.status(400).json('Passwords do not match');
	}
};

const validateEmail = email => {
	if (/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(email)) {
		return true;
	}
	return false;
};

const validatePassword = password => {
	const strengthMatch = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[^a-zA-Z0-9])(?!.*\s).{8,15}$/;
	if (password.match(strengthMatch)) {
		return true;
	}
	return false;
};

module.exports = {
	registerUser
};
