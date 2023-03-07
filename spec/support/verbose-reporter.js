const VerboseReporter = {
	specDone: function (result) {
		console.log (result.description + ': ' + result.passedExpectations.length);
	}
};

module.exports = VerboseReporter;
