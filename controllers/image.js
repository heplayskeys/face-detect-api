const Clarifai = require('clarifai');
const fs = require('fs');
const fileType = require('file-type');
const multiparty = require('multiparty');
const AWS = require('aws-sdk');

const FACE_DETECT_MODEL = process.env.CLARIFAI_FACE_DETECT_MODEL;

AWS.config.update({
	accessKeyId: process.env.AWS_ID,
	secretAccessKey: process.env.AWS_KEY
});

const s3 = new AWS.S3();

const app = new Clarifai.App({
	apiKey: process.env.API_CLARIFAI
});

const handleClarifaiRequest = async (req, res) => {
	try {
		const request = await app.models.predict(FACE_DETECT_MODEL, req.body.input);
		res.json(request);
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
			res.json(entries[0]);
		} catch {
			res.status(404).json('Uh oh! Something went wrong.');
		}
	}
};

const loadFile = (buffer, name, type) => {
	let params = {
		ACL: 'public-read',
		Bucket: process.env.AWS_BUCKET,
		Body: buffer,
		ContentType: type.mime,
		Key: `${name}.${type.ext}`
	};
	return s3.upload(params).promise();
};

const uploadFile = (req, res) => {
	const form = new multiparty.Form();
	form.parse(req, async (error, fields, files) => {
		if (error) {
			return res.status(500).send(error);
		}

		try {
			const path = files.file[0].path;
			const buffer = fs.readFileSync(path);
			const type = await fileType.fromBuffer(buffer);
			const fileName = `${req.params.id}/${Date.now().toString()}`;
			const data = await loadFile(buffer, fileName, type);
			return res.status(200).send(data);
		} catch (err) {
			return res.status(500).send(err);
		}
	});
};

const emptyS3Folder = async (req, res) => {
	const params = {
		Bucket: process.env.AWS_BUCKET,
		Prefix: `${req.params.id}/`
	};

	try {
		const listedObjects = await s3.listObjectsV2(params).promise();

		if (listedObjects.Contents.length === 0) return res.status(200);
		deleteKeys = listedObjects.Contents.map(image => ({ Key: image.Key }));

		const deleteParams = {
			Bucket: process.env.AWS_BUCKET,
			Delete: {
				Objects: deleteKeys
			}
		};

		await s3.deleteObjects(deleteParams).promise();

		if (listedObjects.IsTruncated) await emptyS3Folder(req.params.id);
	} catch (err) {
		console.log(err);
	}
};

module.exports = {
	handleClarifaiRequest,
	updateUserEntries,
	uploadFile,
	emptyS3Folder
};
