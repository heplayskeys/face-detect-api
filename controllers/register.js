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
				'Password must contain:\n  • Between 8 and 15 characters\n  • At least 1 lowercase letter\n  • At least 1 uppercase letter\n  • At least 1 numeric digit\n  • At least 1 special character'
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
					res.json(user[0]);
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

const updateUserProfile = (db, bcrypt) => async (req, res) => {
	if (req.body.name) {
		const { id, name } = req.body;
		const user = await db('users').select('*').where({ id });

		if (user[0]) {
			try {
				await db('users').where({ id }).update({ name });
				res.json(name);
			} catch {
				res.status(404).json('Uh oh! Something went wrong.');
			}
		}
	} else {
		const { id, oldPassword, newPassword } = req.body;

		if (!validatePassword(newPassword)) {
			return res
				.status(400)
				.json(
					'Password must contain:\n  • Between 8 and 15 characters\n  • At least 1 lowercase letter\n  • At least 1 uppercase letter\n  • At least 1 numeric digit\n  • At least 1 special character'
				);
		}

		const user = await db('users').select('*').where({ id });
		const email = user[0].email;
		const hash = await db('login').where({ email }).select('password');
		const isValid = bcrypt.compareSync(oldPassword, hash[0].password);

		if (isValid) {
			bcrypt.hash(newPassword, 10, async (err, hash) => {
				if (err) throw err;

				try {
					await db('login').where({ email }).update({ password: hash });
					res.json('Password Updated');
				} catch {
					res
						.status(400)
						.json(
							'Password must contain:\n  • Between 8 and 15 characters\n  • At least 1 lowercase letter\n  • At least 1 uppercase letter\n  • At least 1 numeric digit\n  • At least 1 special character'
						);
				}
			});
		} else {
			res.status(400).json('Uh oh! Something went wrong.');
		}
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
	registerUser,
	updateUserProfile
};
