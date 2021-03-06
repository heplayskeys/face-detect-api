const getUsers = db => async (req, res) => {
	const users = await db('users').select('name', 'entries', 'joined');
	res.json(users);
};

const getUserProfile = db => async (req, res) => {
	const { id } = req.params;
	const user = await db('users').select('*').where({ id });

	user.length ? res.json(user[0]) : res.status(404).json('User not found');
};

module.exports = {
	getUsers,
	getUserProfile
};
