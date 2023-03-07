const axios = require ("axios");
const VerboseReporter = require ('../support/verbose-reporter');

const base_url = "http://localhost:3000"

const { userValidationFields } = require ('../../source/models/user.js');

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
});
