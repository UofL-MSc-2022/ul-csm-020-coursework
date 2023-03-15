const mongoose = require ('mongoose');
const config = require ('config');
require ('dotenv/config');

const VerboseReporter = require ('./verbose-reporter');
const { UserModel, createUser } = require ('../../source/models/user');

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

const TEST_USERS = [
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

async function deleteTestUsers () {
	delete_response = await UserModel.deleteMany ();

	if (config.get ('verbose_testing'))
		console.log ("users collection cleared, " + delete_response.deletedCount + " removed");
}

async function createTestUsers () {
	for (user of TEST_USERS)
		await createUser (user.screen_name, user.email, user.password);
}

async function reloadTestUsers () {
	await deleteTestUsers ();
	await createTestUsers ();
}

module.exports.TEST_APP_BASE_URL = TEST_APP_BASE_URL
module.exports.initTestSuite = initTestSuite
module.exports.connectToTestDB = connectToTestDB
module.exports.TEST_USERS = TEST_USERS
module.exports.deleteTestUsers = deleteTestUsers
module.exports.createTestUsers = createTestUsers
module.exports.reloadTestUsers = reloadTestUsers
