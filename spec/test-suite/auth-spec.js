const axios = require ("axios");
const ms = require ('ms');
const config = require ('config');

const common = require ('../support/common');
const {UserModel} = require ('../../source/models/user');
const {createAccessToken, verifyAccessToken} = require ('../../source/auth/jwt');

common.initTestSuite ();

fdescribe ("JWT auth tests:", function () {
	// Sample endpoint for verifying auth.  It must be an endpoint that
	// requires authorisation.
	const sample_endpoint = common.BASE_URL + '/api/post/list/all';

	beforeAll (common.connectToTestDB);
	beforeEach (async function () { this.test_users = await common.reloadTestUsers (); });

	// Verify that the payload created by sign-in contains the user id.
	it ("Payload must contain correct information.", async function () {
		const sign_in_endpoint = common.BASE_URL + '/api/user/sign-in';

		for (const user of this.test_users) {
			const params = {
				email: user.email,
				password: user.password_plain };

			await axios.post (sign_in_endpoint, params)
				.then (async function (res) {
					token_subject = verifyAccessToken (res.data['auth-token']).sub;

					expect (token_subject).toBe (user.id);
				})
		}
	});

	// Create a token and verify that it grants access to the sample endpoint.
	it ("Valid token grants access.", async function () {
		for (const user of this.test_users) {
			const header = {headers: common.createTokenHeader (user.id)};

			await axios.get (sample_endpoint, header)
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
		await axios.get (sample_endpoint)
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

		await axios.get (sample_endpoint, header)
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
		const valid_token = createAccessToken ('12345678DEADBEEF98765432');
		const header = {headers: {Authorization: "Bearer " + valid_token}};

		await axios.get (sample_endpoint, header)
			.then (function (res) {
				expect (true).toBe (false);
			})
			.catch (function (error) {
				expect (error.response.status).toBe (401);
			});
	});

	// Verify that token expiration works.
	it ("Token cannot expire.", async function () {
		for (const user of this.test_users) {
			// Use ms to convert time strings, e.g. '20m', to integer
			// milliseconds.
			const token_expiry_ms = ms (config.get ('jwt_access_token_expiry'));
			// Create a mock issue time 1 second longer than the configured
			// expiry.
			const mock_issue = new Date (Date.now () - (token_expiry_ms + 1000));

			// Fake the system time to the mock_issue time.
			jasmine.clock ().install ();
			jasmine.clock ().mockDate (mock_issue);

			// Create the token within the context of the faked system time.
			const token = createAccessToken (user.id);

			// Stop faking the system time.
			jasmine.clock ().uninstall ();

			const header = {headers: {Authorization: "Bearer " + token}};

			await axios.get (sample_endpoint, header)
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
