const mongoose = require ('mongoose');
const config = require ('config');
require ('dotenv/config');

const VerboseReporter = require ('./verbose-reporter');
const { UserModel, createUser } = require ('../../source/models/user');
const { PostModel, createPost } = require ('../../source/models/post');
const { createAccessToken } = require ('../../source/auth/jwt');

const TEST_APP_BASE_URL = "http://localhost:3000"

function initTestSuite () {
	if (config.get ('verbose_testing'))
		jasmine.getEnv ().addReporter (VerboseReporter);
}

function connectToTestDB () {
	mongoose.set ('strictQuery', true);
	mongoose.connect (process.env.TEST_DB_URL, () => {
		if (config.get ('verbose_testing'))
			console.log ('MongoDB test db connected ...');
	});
}

async function deleteTestUsers () {
	delete_response = await UserModel.deleteMany ();

	if (config.get ('verbose_testing'))
		console.log ("users collection cleared, " + delete_response.deletedCount + " removed");
}

async function createTestUsers () {
	const test_user_params = [
		{
			screen_name: "Olga",
			email: "olga@miniwall.com",
			password: "olgapass" },
		{
			screen_name: "Nick",
			email: "nick@miniwall.com",
			password: "nickpass" },
		{
			screen_name: "Mary",
			email: "mary@miniwall.com",
			password: "marypass" } ];

	var test_users = [];
	for (const params of test_user_params) {
		test_user = await createUser (params.screen_name, params.email, params.password);
		test_user.password_plain = params.password;
		test_users.push (test_user);
	}

	return test_users;
}

async function reloadTestUsers () {
	await deleteTestUsers ();
	return await createTestUsers ();
}

function createTokenHeader (user) {
	return {Authorization: 'Bearer ' + createAccessToken (user.id)}
}

async function deleteTestPosts () {
	delete_response = await PostModel.deleteMany ();

	if (config.get ('verbose_testing'))
		console.log ("posts collection cleared, " + delete_response.deletedCount + " removed");
}

module.exports.TEST_APP_BASE_URL = TEST_APP_BASE_URL
module.exports.initTestSuite = initTestSuite
module.exports.connectToTestDB = connectToTestDB
module.exports.deleteTestUsers = deleteTestUsers
module.exports.createTestUsers = createTestUsers
module.exports.reloadTestUsers = reloadTestUsers
module.exports.createTokenHeader = createTokenHeader
module.exports.deleteTestPosts = deleteTestPosts
