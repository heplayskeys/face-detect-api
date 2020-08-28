const Clarifai = require('clarifai');
const API_KEY = '3182a39c94ce4db19bb43ddec297b667';
const FACE_DETECT_MODEL = 'c0c0ac362b03416da06ab3fa36fb58e3';

const app = new Clarifai.App({
	apiKey: API_KEY
});

const handleClarifaiRequest = async (req, res) => {
	try {
		const request = await app.models.predict(FACE_DETECT_MODEL, req.body.input);
		res.status(200).json(request);
	} catch {
		res.status(400).json('Unable to complete request');
	}
};

const updateUserEntries = db => async (req, res) => {
	const { id } = req.body;
	const user = await db('users').select('*').where({ id });

	if (user[0]) {
		try {
			const entries = await db('users')
				.returning('entries')
				.where({ id })
				.increment('entries', 1);
			res.status(200).json(entries[0]);
		} catch {
			res.status(404).json('Uh oh! Something went wrong.');
		}
	}
};

module.exports = {
	handleClarifaiRequest,
	updateUserEntries
};
