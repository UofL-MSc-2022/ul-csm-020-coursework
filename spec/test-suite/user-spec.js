const axios = require ("axios");

const common = require ('../support/common');
const { userValidationFields } = require ('../../source/models/user');
const { verifyAccessToken } = require ('../../source/auth/jwt');

common.initTestSuite ();

describe ("registration test suite", function () {
	const end_point = common.TEST_APP_BASE_URL + '/api/user/register';

	it ("missing required params", async function () {
		const params = {
			screen_name: 'screen_name',
			email: 'email@mail.com',
			password: 'password' };

		const key_subsets = [
			["screen_name"],
			["email"],
			["password"],
			["screen_name", "email"],
			["screen_name", "password"],
			["email", "password"] ];

		for (key_subset of key_subsets) {
			param_subset = {};
			for (key of key_subset)
				param_subset [key] = params [key];

			await axios.post (end_point, param_subset)
				.then (function (response) {
					expect (true).toBe (false);
				})
				.catch (function (error) {
					expect (error.response.status).toBe (400);
				});
		}
	});

	it ("invalid parameter lengths", async function () {
		const min_params = {
			screen_name: "a",
			email: "a@b.c",
			password: "a" };

		const max_params = {
			screen_name: "a".repeat (common.maxValidLength (userValidationFields, 'screen_name') + 1),
			email: "a".repeat (common.maxValidLength (userValidationFields, 'email') + 1) + "@mail.com",
			password: "a".repeat (common.maxValidLength (userValidationFields, 'password') + 1) };

		const valid_params = {
			screen_name: 'screen_name',
			email: 'email@mail.com',
			password: 'password' };

		const test_params = [
			{
				screen_name: min_params.screen_name,
				email: valid_params.email,
				password: valid_params.password },
			{
				screen_name: max_params.screen_name,
				email: valid_params.email,
				password: valid_params.password },
			{
				screen_name: valid_params.screen_name,
				email: min_params.email,
				password: valid_params.password },
			{
				screen_name: valid_params.screen_name,
				email: max_params.email,
				password: valid_params.password },
			{
				screen_name: valid_params.screen_name,
				email: valid_params.email,
				password: min_params.password },
			{
				screen_name: valid_params.screen_name,
				email: valid_params.email,
				password: max_params.password } ];

		for (params of test_params) {
			await axios.post (end_point, params)
				.then (function (response) {
					expect (true).toBe (false);
				})
				.catch (function (error) {
					expect (error.response.status).toBe (400);
				});
		}
	});

	it ("invalid email", async function () {
		const params = {
			screen_name: 'screen_name',
			email: 'bademail#mail.com',
			password: 'password' };

		await axios.post (end_point, params)
			.then (function (response) {
				expect (true).toBe (false);
			})
			.catch (function (error) {
				expect (error.response.status).toBe (400);
			});
	});

	describe ("database-reaching tests", function () {
		beforeAll (common.connectToTestDB);
		beforeEach (common.deleteTestUsers);

		const valid_params = [
			{
				screen_name: 'screen_name',
				email: 'email_0@mail.com',
				password: 'password' },
			{
				screen_name: 'screen_name',
				email: 'email_1@mail.com',
				password: 'password' } ];

		it ("valid registration", async function () {
			await axios.post (end_point, valid_params [0])
				.then (function (response) {
					expect (response.status).toBe (200);
				})
				.catch (function (error) {
					expect (true).toBe (false);
				});
		});

		it ("duplicate registration", async function () {
			await axios.post (end_point, valid_params [0])
				.then (function (response) {
					expect (response.status).toBe (200);
				})
				.catch (function (error) {
					expect (true).toBe (false);
				});

			await axios.post (end_point, valid_params [0])
				.then (function (response) {
					expect (true).toBe (false);
				})
				.catch (function (error) {
					expect (error.response.status).toBe (400);
				});

			await axios.post (end_point, valid_params [1])
				.then (function (response) {
					expect (response.status).toBe (200);
				})
				.catch (function (error) {
					expect (true).toBe (false);
				});
		});
	});
});

describe ("sign-in test suite", function () {
	const end_point = common.TEST_APP_BASE_URL + '/api/user/sign-in';

	beforeAll (common.connectToTestDB);
	beforeEach ( async function () { this.test_users = await common.reloadTestUsers (); });

	it ("bad parameters", async function () {
		const params = [
			{
				email: "bademail#mail.com",
				password: this.test_users [0].password_plain },
			{
				email: this.test_users [0].email,
				password: "p" } ];

		for (const p of params) {
			await axios.post (end_point, p)
				.then (function (response) {
					expect (true).toBe (false);
				})
				.catch (function (error) {
					expect (error.response.status).toBe (400);
				});
		}
	});

	it ("invalid credentials", async function () {
		const params = [
			{
				email: "not_" + this.test_users [0].email,
				password: this.test_users [0].password },
			{
				email: this.test_users [0].email,
				password: "not_" + this.test_users [0].password } ];

		for (const p of params) {
			await axios.post (end_point, p)
				.then (function (response) {
					expect (true).toBe (false);
				})
				.catch (function (error) {
					expect (error.response.status).toBe (401);
				});
		}
	});

	it ("valid credentials", async function () {
		for (const user of this.test_users) {
			const params = {
				email: user.email,
				password: user.password_plain };

			await axios.post (end_point, params)
				.then (async function (response) {
					expect (response.status).toBe (200);
				})
				.catch (function (error) {
					expect (true).toBe (false);
				});
		}
	});
});
