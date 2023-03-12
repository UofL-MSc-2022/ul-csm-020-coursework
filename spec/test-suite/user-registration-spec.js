const axios = require ("axios");
const mongoose = require ("mongoose");
const VerboseReporter = require ('../support/verbose-reporter');
const config = require ('config');
require ('dotenv/config');

const { UserModel, userValidationFields, createUser } = require ('../../source/models/user');
const { verifyAccessToken } = require ('../../source/auth/jwt');
const { connectToTestDB, deleteTestUsers } = require ('./utils');

const base_url = "http://localhost:3000"

if (config.get ('verbose_testing'))
	jasmine.getEnv ().addReporter (VerboseReporter);

describe ("registration test suite", function () {
	const end_point = base_url + '/api/user/register';

	describe ("GET /api/user/register", function () {
		it ("GET not found", async function () {
			await axios.get (end_point)
				.then (function (response) {
					expect (true).toBe (false);
				})
				.catch (function (error) {
					expect (error.response.status).toBe (404);
				});
		});
	});

	describe ("POST /api/user/register", function () {
		const params = {
			screen_name: "test_user",
			email: "test_user@mail.com",
			password: "password" };

		const subsets = [
			["screen_name"], ["email"], ["password"],
			["screen_name", "email"], ["screen_name", "password"], ["email", "password"] ];

		it ("missing required params", async function () {
			for (subset of subsets) {
				param_subset = {};
				for (p of subset)
					param_subset [p] = params [p];

				await axios.post (end_point, param_subset)
					.then (function (response) {
						expect (true).toBe (false);
					})
					.catch (function (error) {
						expect (error.response.status).toBe (400);
					});
			}
		});
	});

	describe ("POST /api/user/register", function () {
		const min_params = {
			screen_name: "a",
			email: "a@b.c",
			password: "a" };

		const max_length = (key) =>
			userValidationFields [key]._rules.filter (r => r.name == 'max') [0].args.limit;

		const max_params = {
			screen_name: "a".repeat (max_length ('screen_name') + 1),
			email: "a".repeat (max_length ('email') + 1) + "@mail.com",
			password: "a".repeat (max_length ('password') + 1) };

		const valid_params = {
			screen_name: "test_user",
			email: "test_user@mail.com",
			password: "password" };

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

		it ("invalid parameter lengths", async function () {
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
	});

	describe ("POST /api/user/register", function () {
		const params = {
			screen_name: "test_user",
			email: "test_user#mail.com",
			password: "password" };

		it ("invalid email", async function () {
			await axios.post (end_point, params)
				.then (function (response) {
					expect (true).toBe (false);
				})
				.catch (function (error) {
					expect (error.response.status).toBe (400);
				});
		});
	});

	describe ("POST /api/user/register", function () {
		beforeAll (function () { connectToTestDB (); });

		beforeEach (async function () { await deleteTestUsers (); });

		const params = [
			{
				screen_name: "test_user",
				email: "test_user_a@mail.com",
				password: "password" },
			{
				screen_name: "test_user",
				email: "test_user_b@mail.com",
				password: "password" } ];

		describe ("valid registration", function () {
			it ("valid registration", async function () {
				await axios.post (end_point, params [0])
					.then (function (response) {
						expect (response.status).toBe (200);
					});
			});
		});

		describe ("duplicate registration", function () {
			it ("duplicate registration", async function () {
				await axios.post (end_point, params [0])
					.then (function (response) {
						expect (response.status).toBe (200);
					});

				await axios.post (end_point, params [0])
					.then (function (response) {
						expect (true).toBe (false);
					})
					.catch (function (error) {
						expect (error.response.status).toBe (400);
					});

				await axios.post (end_point, params [1])
					.then (function (response) {
						expect (response.status).toBe (200);
					});
			});
		});
	});
});

describe ("sign-in test suite", function () {
	const end_point = base_url + '/api/user/sign-in';

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
		const params = [
			{
				email: "bademail#mail.com",
				password: "password" },
			{
				email: "test_user_a@mail.com",
				password: "p" } ];

		it ("bad parameters", async function () {
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
	});

	describe ("POST /api/user/sign-in", function () {
		const params = [
			{
				email: "not_" + test_users [0].email,
				password: test_users [0].password },
			{
				email: test_users [0].email,
				password: "not_" + test_users [0].password } ];

		it ("invalid credentials", async function () {
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
	});

	describe ("POST /api/user/sign-in", function () {
		it ("valid credentials", async function () {
			for (const user_params of test_users) {
				const params = {
					email: user_params.email,
					password: user_params.password };

				await axios.post (end_point, params)
					.then (async function (response) {
						expect (response.status).toBe (200);

						user = await UserModel.findOne ({email: params.email});
						token_subject = verifyAccessToken (response.data ['auth-token']).sub;

						expect (token_subject).toBe (user.id);
					})
			}
		});
	});
});
