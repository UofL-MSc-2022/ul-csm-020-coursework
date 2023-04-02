const axios = require ("axios");

const common = require ('../support/common');
const {PostModel, postValidationFields} = require ('../../source/models/post');
const {CommentModel} = require ('../../source/models/comment');
const {LikeModel} = require ('../../source/models/like');

common.initTestSuite ();

describe ("Post endpoint tests:", function () {
	const endpointBase = common.BASE_URL + '/api/post';
	const createEndpoint = endpointBase + '/create';
	const readEndpoint = endpointBase + '/read';
	const updateEndpoint = endpointBase + '/update';
	const deleteEndpoint = endpointBase + '/delete';
	const listEndpoint = endpointBase + '/list';

	const validParams = {title: 'title', body: 'body'};

	// All tests in this suite require existing users and posts.
	beforeAll (common.connectToTestDB);
	beforeEach (async function () {
		this.testUsers = await common.reloadTestUsers ();
		this.testPosts = await common.reloadTestPosts (); });

	// Verify that all endpoints require an auth token.
	it ("All endpoints require authorisation.", async function () {
		// Endpoints that take an ObjectID as a parameter can use a nonsense
		// value, since the authorisation check happens before parameter
		// validation.
		const endpoints = [
			{method: 'post', url: createEndpoint},
			{method: 'get', url: readEndpoint + '/DEADBEEF'},
			{method: 'patch', url: updateEndpoint + '/DEADBEEF'},
			{method: 'delete', url: deleteEndpoint + '/DEADBEEF'},
			{method: 'get', url: listEndpoint + '/all'},
			{method: 'get', url: listEndpoint + '/user'}
		];

		for (const endpoint of endpoints)
			await axios ({method: endpoint.method, url: endpoint.url})
				.then (function (res) {
					expect (true).toBe (false);
				})
				.catch (function (error) {
					expect (error.response.status).toBe (401);
				});
	});

	// Verify that only the owner of a post can update or delete it.
	it ("Only the post owner can update or delete a post.", async function () {
		for (const user of this.testUsers) {
			const header = common.createTokenHeader (user.id);

			for (const post of this.testPosts) {
				// Skip the owner.
				if (user.id == post.owner.id)
					continue;

				const requestParams = [
					{
						method: 'patch',
						endpoint: updateEndpoint + '/' + post.id,
						params: validParams
					},
					{
						method: 'delete',
						endpoint: deleteEndpoint + '/' + post.id,
						params: {}
					}
				];

				for (const params of requestParams) {
					requestConfig = {
						method: params.method,
						url: params.endpoint,
						data: params.params,
						headers: header
					};

					await axios (requestConfig)
						.then (function (res) {
							expect (true).toBe (false);
						})
						.catch (function (error) {
							expect (error.response.status).toBe (400);
						});
				}
			}
		}
	});

	// Test all CRUD methods.
	describe ("CRUD tests:", function () {
		// Short parameter values.
		const minParams = {title: "a", body: "a"};

		// Long parameter values, based on max lengths extracted from the
		// validation field array.
		const maxParams = {
			title: "a".repeat (common.maxValidLength (postValidationFields, 'title') + 1),
			body: "a".repeat (common.maxValidLength (postValidationFields, 'body') + 1)
		};

		describe ("Create tests:", function () {
			// Clear the posts collection before each spec.
			beforeEach (common.deleteTestPosts);

			// Verify that required fields are enforced.
			it ("Request must include all required parameters.", async function () {
				// Test when either the title or body is missing.
				const testParams = [{title: 'title'}, {body: 'body'}];

				for (const user of this.testUsers) {
					const header = {headers: common.createTokenHeader (user.id)};

					for (const params of testParams)
						await axios.post (createEndpoint, params, header)
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
				// All parameter combinations with 1 invalid value.
				const testParams = [
					{title: minParams.title, body: validParams.body},
					{title: maxParams.title, body: validParams.body},
					{title: validParams.title, body: minParams.body},
					{title: validParams.title, body: maxParams.body}
				];

				for (const user of this.testUsers) {
					const header = {headers: common.createTokenHeader (user.id)};

					// Test each combination.
					for (const params of testParams) {
						await axios.post (createEndpoint, params, header)
							.then (function (res) {
								expect (true).toBe (false);
							})
							.catch (function (error) {
								expect (error.response.status).toBe (400);
							});
					}
				}
			});

			// Test that post creation works.
			it ("Users can create posts.", async function () {
				for (const user of this.testUsers) {
					const header = {headers: common.createTokenHeader (user.id)};

					await axios.post (createEndpoint, validParams, header)
						.then (function (res) {
							expect (res.status).toBe (200);
						})
						.catch (function (error) {
							expect (true).toBe (false);
						});
				}
			});
		});

		describe ("Read tests:", function () {
			// Verify that the read endpoint requires a post id.
			it ("Request must include a post id.", async function () {
				const header = {headers: common.createTokenHeader (this.testUsers[0].id)};

				// Make the request without adding a post id to the
				// readEndpoint.
				await axios.get (readEndpoint, header)
					.then (function (res) {
						expect (true).toBe (false);
					})
					.catch (function (error) {
						expect (error.response.status).toBe (404);
					});
			});

			// Verify that the post id is valid.
			it ("Post id must be valid.", async function () {
				const header = {headers: common.createTokenHeader (this.testUsers[0].id)};
				const endpoints = [
					// Malformed post id.
					readEndpoint + '/DEADBEEF',
					// Nonexistent Post id.
					readEndpoint + '/12345678DEADBEEF98765432'
				];

				for (endpoint of endpoints)
					await axios.get (endpoint, header)
						.then (function (res) {
							expect (true).toBe (false);
						})
						.catch (function (error) {
							expect (error.response.status).toBe (400);
						});
			});

			// User can read post.
			it ("Users can read posts.", async function () {
				// Add matcher that verifies comment and like ordering.
				jasmine.addMatchers ({
					toHaveAscendingCreationTimes: common.ascendingCreationTimesMatcher
				});

				// Load comments and likes in order to verify ordering.
				await common.reloadTestComments ();
				await common.reloadTestLikes ();

				for (const post of this.testPosts) {
					const header = {headers: common.createTokenHeader (this.testUsers[0].id)};
					const endpoint = readEndpoint + '/' + post.id;

					await axios.get (endpoint, header)
						.then (function (res) {
							expect (res.status).toBe (200);
							expect (res.data.id).toBe (post.id);

							expect (res.data.comments).toHaveAscendingCreationTimes ();
							expect (res.data.likes).toHaveAscendingCreationTimes ();
						})
						.catch (function (error) {
							expect (true).toBe (false);
						});
				}
			});
		});

		describe ("Update tests:", function () {
			// Verify that required fields are enforced.
			it ("Request must include all required parameters.", async function () {
				// Only one parameter is required, therefore the test requires
				// requests with no parameters.
				for (const post of this.testPosts) {
					const endpoint = updateEndpoint + '/' + post.id;
					const header = {headers: common.createTokenHeader (post.owner.id)};

					await axios.patch (endpoint, {}, header)
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
				// All parameter combinations with 1 invalid value.
				const testParams = [
					{title: minParams.title},
					{title: maxParams.title},
					{body: minParams.body},
					{body: maxParams.body},
					{title: minParams.title, body: validParams.body},
					{title: maxParams.title, body: validParams.body},
					{title: validParams.title, body: minParams.body},
					{title: validParams.title, body: maxParams.body}
				];

				for (const post of this.testPosts) {
					const endpoint = updateEndpoint + '/' + post.id;
					const header = {headers: common.createTokenHeader (post.owner.id)};

					// Test each combination.
					for (params of testParams)
						await axios.patch (endpoint, params, header)
							.then (function (res) {
								expect (true).toBe (false);
							})
							.catch (function (error) {
								expect (error.response.status).toBe (400);
							});
				}
			});

			// Test that post updating works.
			it ("Users can update posts.", async function () {
				// Test multiple updates to posts.
				const testParams = {
					firstUpdate: {title: 'first_title_change'},
					secondUpdate: {body: 'first_body_change'},
					thirdUpdate: {title: 'second_title_change', body: 'second_body_change'}
				};

				for (const post of this.testPosts) {
					const originalBody = post.body;

					const endpoint = updateEndpoint + '/' + post.id;
					const header = {headers: common.createTokenHeader (post.owner.id)};

					// First update, only title changed.
					await axios.patch (endpoint, testParams.firstUpdate, header)
						.then (function (res) {
							expect (res.status).toBe (200);

							const updatedPost = res.data;

							expect (updatedPost.title).toBe (testParams.firstUpdate.title);
							expect (updatedPost.body).toBe (originalBody);
						})
						.catch (function (error) {
							expect (true).toBe (false);
						});

					// Second update, only body changed, title already changed.
					await axios.patch (endpoint, testParams.secondUpdate, header)
						.then (function (res) {
							expect (res.status).toBe (200);

							const updatedPost = res.data;

							expect (updatedPost.title).toBe (testParams.firstUpdate.title);
							expect (updatedPost.body).toBe (testParams.secondUpdate.body);
						})
						.catch (function (error) {
							expect (true).toBe (false);
						});

					// Third update, both parameters changed.
					await axios.patch (endpoint, testParams.thirdUpdate, header)
						.then (function (res) {
							expect (res.status).toBe (200);

							const updatedPost = res.data;

							expect (updatedPost.title).toBe (testParams.thirdUpdate.title);
							expect (updatedPost.body).toBe (testParams.thirdUpdate.body);
						})
						.catch (function (error) {
							expect (true).toBe (false);
						});
				}
			});
		});

		describe ("Delete tests:", function () {
			// Verify that the delete endpoint requires a post id.
			it ("Request must include a post id.", async function () {
				const header = {headers: common.createTokenHeader (this.testUsers[0].id)};

				// Make the request without adding a post id to the
				// deleteEndpoint.
				await axios.delete (deleteEndpoint, header)
					.then (function (res) {
						expect (true).toBe (false);
					})
					.catch (function (error) {
						expect (error.response.status).toBe (404);
					});
			});

			// Verify that the post id is valid.
			it ("Post id must be valid.", async function () {
				const header = {headers: common.createTokenHeader (this.testUsers[0].id)};
				const endpoints = [
					// Malformed post id.
					deleteEndpoint + '/DEADBEEF',
					// Nonexistent post id.
					deleteEndpoint + '/12345678DEADBEEF98765432'
				];

				for (endpoint of endpoints)
					await axios.delete (endpoint, header)
						.then (function (res) {
							expect (true).toBe (false);
						})
						.catch (function (error) {
							expect (error.response.status).toBe (400);
						});
			});

			// Test that post deletion works.
			it ("Users can delete posts.", async function () {
				// Load comments and like to verify that deleting a post
				// deletes the associated comments and likes.
				await common.reloadTestComments ();
				await common.reloadTestLikes ();

				for (const post of await this.testPosts) {
					const header = {headers: common.createTokenHeader (post.owner.id)};
					const endpoint = deleteEndpoint + '/' + post.id;

					let nComments = await CommentModel.countDocuments ({post: post.id});
					let nLikes = await LikeModel.countDocuments ({post: post.id});

					// Verify that there are comments and likes to be deleted.
					expect (nComments).toBeGreaterThan (0);
					expect (nLikes).toBeGreaterThan (0);

					await axios.delete (endpoint, header)
						.then (async function (res) {
							expect (res.status).toBe (200);
							expect (res.data.deletedCount).toBe (1);

							nComments = await CommentModel.countDocuments ({post: post.id});
							nLikes = await LikeModel.countDocuments ({post: post.id});

							expect (nComments).toBe (0);
							expect (nLikes).toBe (0);
						})
						.catch (function (error) {
							expect (true).toBe (false);
						});
				}
			});
		});
	});

	describe ("List tests:", function () {
		beforeAll (function () {
			// Add matcher that verifies post ordering.
			jasmine.addMatchers ({toHaveCorrectPostOrder: common.postOrderMatcher});
		});

		// Verify that the scope must be valid.
		it ("Scope is not 'all' or 'user'.", async function () {
			const header = {headers: common.createTokenHeader (this.testUsers[0].id)};
			const endpoint = listEndpoint + '/not_a_valid_scope';

			await axios.get (endpoint, header)
				.then (function (res) {
					expect (true).toBe (false);
				})
				.catch (function (error) {
					expect (error.response.status).toBe (404);
				});
		});

		describe ("Scope is 'all' tests:", function () {
			const endpoint = listEndpoint + '/all';

			// Load a random assortment of posts and likes to verify correct
			// ordering.
			beforeEach (async function () { await common.loadRandomPostsAndLikes (15, 45); });

			// Do 3 tests to mitigate blindspots in randomly generated objects.
			for (let i=0; i<3; i++)
				it ("Iteration " + i + ".", async function () {
					const header = {headers: common.createTokenHeader (this.testUsers[0].id)};

					await axios.get (endpoint, header)
						.then (async function (res) {
							expect (res.status).toBe (200);

							const nExpected = await PostModel.countDocuments ();
							expect (res.data.length).toBe (nExpected);

							expect (res.data).toHaveCorrectPostOrder ();
						})
						.catch (function (error) {
							expect (true).toBe (false);
						});
				});
		});

		describe ("Scope is 'user' tests:", function () {
			const endpoint = listEndpoint + '/user';

			// Load a random assortment of posts and likes to verify correct
			// ordering.
			beforeEach (async function () { await common.loadRandomPostsAndLikes (15, 45); });

			// Do 3 tests to mitigate blindspots in randomly generated objects.
			for (let i=0; i<3; i++)
				it ("Iteration " + i + ".", async function () {
					for (const user of this.testUsers) {
						const header = {headers: common.createTokenHeader (user.id)};

						await axios.get (endpoint, header)
							.then (async function (res) {
								expect (res.status).toBe (200);

								const nExpected = await PostModel.countDocuments ({owner: user});
								expect (res.data.length).toBe (nExpected);

								expect (res.data).toHaveCorrectPostOrder ();
							})
							.catch (function (error) {
								expect (true).toBe (false);
							});
					}
				});
		});
	});
});
