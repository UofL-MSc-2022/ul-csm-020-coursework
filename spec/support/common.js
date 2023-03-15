const mongoose = require ('mongoose');
const config = require ('config');
require ('dotenv/config');

const VerboseReporter = require ('./verbose-reporter');
const { UserModel } = require ('../../source/models/user');

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

module.exports.TEST_APP_BASE_URL = TEST_APP_BASE_URL
module.exports.initTestSuite = initTestSuite
module.exports.connectToTestDB = connectToTestDB
module.exports.deleteTestUsers = deleteTestUsers
