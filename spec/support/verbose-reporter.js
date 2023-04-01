// Add extra logging to the test run output, the number of expect() calls per
// spec.
const VerboseReporter = {
	specDone: function (result) {
		console.log (result.description + ': ' + result.passedExpectations.length);
	}
};

module.exports = VerboseReporter;
