const axios = require ("axios");

const common = require ('../support/common');
const {UserModel, userValidationFields} = require ('../../source/models/user');

common.initTestSuite ();

// All axios requests include 'expect (true).toBe (false);' in one of the
// callbacks.  For example, if a request is expected to succeed, the error call
// back contains the above expect().  If a request fails when it is expected to
// succeed the expect() calls in the success call back won't be called and they
// won't appear as a failure to Jasmine.  The above expect() is guaranteed to
// fail, this ensures that the spec fails when it should.

describe ("Registration tests:", function () {
	const endpoint = common.BASE_URL + '/api/user/register';

	// Verify that required fields are enforced.
	it ("Request must include all required parameters.", async function () {
		const paramValues = {
			screen_name: 'screen_name',
			email: 'email@mail.com',
			password: 'password'
		};

		// A list of all parameter subsets which are missing a required
		// parameter.
		const keySubsets = [
			["screen_name"],
			["email"],
			["password"],
			["screen_name", "email"],
			["screen_name", "password"],
			["email", "password"]
		];

		// Test each subset.
		for (const keySubset of keySubsets) {
			let paramSubset = {};
			for (const key of keySubset)
				paramSubset[key] = paramValues[key];

			await axios.post (endpoint, paramSubset)
				.then (function (res) {
					expect (true).toBe (false);
				})
				.catch (function (error) {
					expect (error.response.status).toBe (400);
				});
		}
	});

	// Verify that string parameters must conform to length constraints.
	it ("Parameters must conform to length constraints.", async function () {
		// Short parameter values.
		const minParams = {screen_name: "a", email: "a@b.c", password: "a"};

		// Long parameter values, based on max lengths extracted from the
		// validation field array.
		const maxParams = {
			screen_name: "a".repeat (common.maxValidLength (userValidationFields, 'screen_name') + 1),
			email: "a".repeat (common.maxValidLength (userValidationFields, 'email') + 1) + "@mail.com",
			password: "a".repeat (common.maxValidLength (userValidationFields, 'password') + 1)
		};

		// Parameter values with valid lengths.
		const validParams = {
			screen_name: 'screen_name',
			email: 'email@mail.com',
			password: 'password'
		};

		// All parameter combinations with 1 invalid value.
		const testParams = [
			{
				screen_name: minParams.screen_name,
				email: validParams.email,
				password: validParams.password
			},
			{
				screen_name: maxParams.screen_name,
				email: validParams.email,
				password: validParams.password
			},
			{
				screen_name: validParams.screen_name,
				email: minParams.email,
				password: validParams.password
			},
			{
				screen_name: validParams.screen_name,
				email: maxParams.email,
				password: validParams.password
			},
			{
				screen_name: validParams.screen_name,
				email: validParams.email,
				password: minParams.password
			},
			{
				screen_name: validParams.screen_name,
				email: validParams.email,
				password: maxParams.password
			}
		];

		// Test each combination.
		for (params of testParams) {
			await axios.post (endpoint, params)
				.then (function (res) {
					expect (true).toBe (false);
				})
				.catch (function (error) {
					expect (error.response.status).toBe (400);
				});
		}
	});

	// Verify properly formatted email addresses.
	it ("Email must be the correct format.", async function () {
		const params = {
			screen_name: 'screen_name',
			email: 'bademail#mail.com',
			password: 'password'
		};

		await axios.post (endpoint, params)
			.then (function (res) {
				expect (true).toBe (false);
			})
			.catch (function (error) {
				expect (error.response.status).toBe (400);
			});
	});

	// The following tests require database initialisation, therefore they are
	// bundled in a describe to leverage Jasmine's beforeAll and beforeEach
	// setup functions.
	describe ("Tests requiring an initialised database:", function () {
		beforeAll (common.connectToTestDB);
		beforeEach (common.deleteTestUsers);

		const validParams = [
			{
				screen_name: 'screen_name_0',
				email: 'email_0@mail.com',
				password: 'password'
			},
			{
				screen_name: 'screen_name_1',
				email: 'email_1@mail.com',
				password: 'password'
			}
		];

		// Test that registration works.
		it ("Registration creates a user.", async function () {
			await axios.post (endpoint, validParams[0])
				.then (async function (res) {
					expect (res.status).toBe (200);

					const dbUser = await UserModel.findOne ({email: validParams[0].email});
					expect (dbUser.screen_name).toBe (validParams[0].screen_name);
				})
				.catch (function (error) {
					expect (true).toBe (false);
				});
		});

		// Test that the unique constraint on email works.
		it ("Duplicate emails cannot register.", async function () {
			// First user should be able to register.
			await axios.post (endpoint, validParams[0])
				.then (function (res) {
					expect (res.status).toBe (200);
				})
				.catch (function (error) {
					expect (true).toBe (false);
				});

			// First user should not be able to reregister.
			await axios.post (endpoint, validParams[0])
				.then (function (res) {
					expect (true).toBe (false);
				})
				.catch (function (error) {
					expect (error.response.status).toBe (400);
				});

			// Second user should be able to register.
			await axios.post (endpoint, validParams[1])
				.then (function (res) {
					expect (res.status).toBe (200);
				})
				.catch (function (error) {
					expect (true).toBe (false);
				});
		});
	});
});

describe ("Sign-in tests:", function () {
	const endpoint = common.BASE_URL + '/api/user/sign-in';

	// All tests in this suite require existing users in the database.
	beforeAll (common.connectToTestDB);
	beforeEach ( async function () { this.testUsers = await common.reloadTestUsers (); });

	// Verify that parameters must pass validation.
	it ("Parameters must pass validation.", async function () {
		// Test for malformed email and short password.
		const testParams = [
			{email: "bademail#mail.com", password: this.testUsers[0].passwordPlain},
			{email: this.testUsers[0].email, password: "p"}
		];

		for (const params of testParams) {
			await axios.post (endpoint, params)
				.then (function (res) {
					expect (true).toBe (false);
				})
				.catch (function (error) {
					expect (error.response.status).toBe (400);
				});
		}
	});

	// Verify that sign-in fails with invalid credentials.
	it ("Sign-in requires valid credentials.", async function () {
		// Test for wrong email/correct password and correct email/wrong
		// password.
		const testParams = [
			{
				email: "not_" + this.testUsers[0].email,
				password: this.testUsers[0].password
			},
			{
				email: this.testUsers[0].email,
				password: "not_" + this.testUsers[0].password
			}
		];

		for (const params of testParams) {
			await axios.post (endpoint, params)
				.then (function (res) {
					expect (true).toBe (false);
				})
				.catch (function (error) {
					expect (error.response.status).toBe (401);
				});
		}
	});

	// Verify that sign-in succeeds with valid credentials.
	it ("Sign-invalid credentials", async function () {
		for (const user of this.testUsers) {
			const params = {
				email: user.email,
				password: user.passwordPlain };

			await axios.post (endpoint, params)
				.then (async function (res) {
					expect (res.status).toBe (200);
					expect (res.data['auth-token']).toBeDefined ();
				})
				.catch (function (error) {
					expect (true).toBe (false);
				});
		}
	});
});
