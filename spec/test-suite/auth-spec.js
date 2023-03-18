const axios = require ("axios");
const ms = require ('ms');
const config = require ('config');

const common = require ('../support/common');
const { UserModel } = require ('../../source/models/user');
const { createAccessToken, verifyAccessToken } = require ('../../source/auth/jwt');

common.initTestSuite ();

describe ("jwt auth test suite", function () {
	const end_point = common.TEST_APP_BASE_URL + '/api/version';

	beforeAll (common.connectToTestDB);
	beforeEach (async function () { this.test_users = await common.reloadTestUsers (); });

	it ("verify token payload", async function () {
		const sign_in_end_point = common.TEST_APP_BASE_URL + '/api/user/sign-in';

		for (const user of this.test_users) {
			const params = {
				email: user.email,
				password: user.password_plain };

			await axios.post (sign_in_end_point, params)
				.then (async function (response) {
					token_subject = verifyAccessToken (response.data ['auth-token']).sub;

					expect (token_subject).toBe (user.id);
				})
		}
	});

	it ("valid token", async function () {
		for (const user of this.test_users) {
			const req_config = {headers: common.createTokenHeader (user.id)};

			await axios.get (end_point, req_config)
				.then (function (response) {
					expect (response.status).toBe (200);
				});
		}
	});

	it ("missing token header", async function () {
		await axios.get (end_point)
			.then (function (response) {
				expect (true).toBe (false);
			})
			.catch (function (error) {
				expect (error.response.status).toBe (401);
			});
	});

	it ("malformed token", async function () {
		const header_config = {
			headers: { Authorization: "Bearer DEADBEEF" }
		};

		await axios.get (end_point, header_config)
			.then (function (response) {
				expect (true).toBe (false);
			})
			.catch (function (error) {
				expect (error.response.status).toBe (401);
			});
	});

	it ("invalid payload", async function () {
		const header_config = {
			headers: { Authorization: "Bearer " + createAccessToken ('12345678DEADBEEF98765432') }
		};

		await axios.get (end_point, header_config)
			.then (function (response) {
				expect (true).toBe (false);
			})
			.catch (function (error) {
				expect (error.response.status).toBe (401);
			});
	});

	it ("expired token", async function () {
		for (const user of await UserModel.find ({})) {
			const token_expiry_ms = ms (config.get ('jwt_access_token_expiry'));
			const mock_issue = new Date (Date.now () - (token_expiry_ms + 1000));

			jasmine.clock ().install ();
			jasmine.clock ().mockDate (mock_issue);

			const token = createAccessToken (user.id);

			jasmine.clock ().uninstall ();

			const header_config = {
				headers: { Authorization: "Bearer " + token }
			};

			await axios.get (end_point, header_config)
				.then (function (response) {
					expect (true).toBe (false);
				})
				.catch (function (error) {
					expect (error.response.status).toBe (401);
					expect (error.response.data.message).toBe ('Token has expired');
				});
		}
	});
});
