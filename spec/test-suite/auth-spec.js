const axios = require ("axios");
const VerboseReporter = require ('../support/verbose-reporter');
const config = require ('config');

const { UserModel, createUser } = require ('../../source/models/user');
const { createAccessToken, verifyAccessToken } = require ('../../source/auth/jwt');
const { connectToTestDB, deleteTestUsers } = require ('./utils');

const base_url = "http://localhost:3000"

if (config.get ('verbose_testing'))
	jasmine.getEnv ().addReporter (VerboseReporter);

describe ("jwt auth test suite", function () {
	const end_point = base_url + '/api/version';

	const test_users = [
		{
			screen_name: "test_user",
			email: "test_user_a@mail.com",
			password: "password" },
		{
			screen_name: "test_user",
			email: "test_user_b@mail.com",
			password: "password" }
	];

	beforeAll (function () { connectToTestDB (); });

	beforeEach (async function () {
		await deleteTestUsers ();

		for (user of test_users)
			await createUser (user.screen_name, user.email, user.password);
	});

	describe ("POST /api/user/sign-in", function () {
		const sign_in_end_point = base_url + '/api/user/sign-in';

		it ("verify token payload", async function () {
			for (const user_params of test_users) {
				const params = {
					email: user_params.email,
					password: user_params.password };

				await axios.post (sign_in_end_point, params)
					.then (async function (response) {
						user = await UserModel.findOne ({email: params.email});
						token_subject = verifyAccessToken (response.data ['auth-token']).sub;

						expect (token_subject).toBe (user.id);
					})
			}
		});
	});

	describe ("GET /api/version", function () {
		it ("valid token", async function () {
			for (const user of await UserModel.find ({})) {
				const header_config = {
					headers: { Authorization: "Bearer " + createAccessToken (user.id) }
				};

				await axios.get (end_point, header_config)
					.then (function (response) {
						expect (response.status).toBe (200);
					});
			}
		});
	});

	describe ("GET /api/version", function () {
		it ("missing token header", async function () {
			await axios.get (end_point)
				.then (function (response) {
					expect (true).toBe (false);
				})
				.catch (function (error) {
					expect (error.response.status).toBe (401);
				});
		});
	});

	describe ("GET /api/version", function () {
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
	});

	describe ("GET /api/version", function () {
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
	});
});
