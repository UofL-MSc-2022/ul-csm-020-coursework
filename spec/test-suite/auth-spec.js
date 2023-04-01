const axios = require ("axios");
const ms = require ('ms');
const config = require ('config');

const common = require ('../support/common');
const {UserModel} = require ('../../source/models/user');
const {createAccessToken, verifyAccessToken} = require ('../../source/auth/jwt');

common.initTestSuite ();

// All axios requests include 'expect (true).toBe (false);' in one of the
// callbacks.  For example, if a request is expected to succeed, the error call
// back contains the above expect().  If a request fails when it is expected to
// succeed the expect() calls in the success call back won't be called and they
// won't appear as a failure to Jasmine.  The above expect() is guaranteed to
// fail, this ensures that the spec fails when it should.

describe ("JWT auth tests:", function () {
	// Sample endpoint for verifying auth.  It must be an endpoint that
	// requires authorisation.
	const sampleEndpoint = common.BASE_URL + '/api/post/list/all';

	beforeAll (common.connectToTestDB);
	beforeEach (async function () { this.testUsers = await common.reloadTestUsers (); });

	// Verify that the payload created by sign-in contains the user id.
	it ("Payload must contain correct information.", async function () {
		const signInEndpoint = common.BASE_URL + '/api/user/sign-in';

		for (const user of this.testUsers) {
			const params = {
				email: user.email,
				password: user.passwordPlain };

			await axios.post (signInEndpoint, params)
				.then (async function (res) {
					const tokenSubject = verifyAccessToken (res.data['auth-token']).sub;

					expect (tokenSubject).toBe (user.id);
				})
		}
	});

	// Create a token and verify that it grants access to the sample endpoint.
	it ("Valid token grants access.", async function () {
		for (const user of this.testUsers) {
			const header = {headers: common.createTokenHeader (user.id)};

			await axios.get (sampleEndpoint, header)
				.then (function (res) {
					expect (res.status).toBe (200);
				})
				.catch (function (error) {
					expect (true).toBe (false);
				});
		}
	});

	// Verify that requests with an Authorization header are rejected.
	it ("Token header is required.", async function () {
		await axios.get (sampleEndpoint)
			.then (function (res) {
				expect (true).toBe (false);
			})
			.catch (function (error) {
				expect (error.response.status).toBe (401);
			});
	});

	// Verify that tokens must conform to the expected format.
	it ("Token cannot be malformed.", async function () {
		const header = {headers: {Authorization: "Bearer DEADBEEF"}};

		await axios.get (sampleEndpoint, header)
			.then (function (res) {
				expect (true).toBe (false);
			})
			.catch (function (error) {
				expect (error.response.status).toBe (401);
			});
	});

	// Verify that the token payload must contain a user id that exists in the
	// database.  Fradulent ids that are not 24 digit hexidecimal numbers will
	// be rejected before attempting to load a user from the database.
	it ("Payload must contain a valid user id.", async function () {
		const validToken = createAccessToken ('12345678DEADBEEF98765432');
		const header = {headers: {Authorization: "Bearer " + validToken}};

		await axios.get (sampleEndpoint, header)
			.then (function (res) {
				expect (true).toBe (false);
			})
			.catch (function (error) {
				expect (error.response.status).toBe (401);
			});
	});

	// Verify that token expiration works.
	it ("Token cannot expire.", async function () {
		for (const user of this.testUsers) {
			// Use ms to convert time strings, e.g. '20m', to integer
			// milliseconds.
			const tokenExpiryMS = ms (config.get ('jwt_access_token_expiry'));
			// Create a mock issue time 1 second longer than the configured
			// expiry.
			const mockIssue = new Date (Date.now () - (tokenExpiryMS + 1000));

			// Fake the system time to the mockIssue time.
			jasmine.clock ().install ();
			jasmine.clock ().mockDate (mockIssue);

			// Create the token within the context of the faked system time.
			const token = createAccessToken (user.id);

			// Stop faking the system time.
			jasmine.clock ().uninstall ();

			const header = {headers: {Authorization: "Bearer " + token}};

			await axios.get (sampleEndpoint, header)
				.then (function (res) {
					expect (true).toBe (false);
				})
				.catch (function (error) {
					expect (error.response.status).toBe (401);
					expect (error.response.data.message).toBe ('Token has expired');
				});
		}
	});
});
