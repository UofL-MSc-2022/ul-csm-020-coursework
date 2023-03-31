const axios = require ("axios");

const common = require ('../support/common');
const { PostModel, postValidationFields } = require ('../../source/models/post');
const { CommentModel } = require ('../../source/models/comment');
const { LikeModel } = require ('../../source/models/like');

common.initTestSuite ();

describe ("post test suite", function () {
	const end_point_base = common.TEST_APP_BASE_URL + '/api/post';
	const create_end_point = end_point_base + '/create';
	const read_end_point = end_point_base + '/read';
	const update_end_point = end_point_base + '/update';
	const delete_end_point = end_point_base + '/delete';
	const list_end_point = end_point_base + '/list';

	const valid_params = { title: 'title', body: 'body' };

	beforeAll (common.connectToTestDB);
	beforeEach (async function () {
		this.test_users = await common.reloadTestUsers ();
		this.test_posts = await common.reloadTestPosts (); });

	it ("verify auth required", async function () {
		const end_points = [
			{
				method: 'post',
				url: create_end_point },
			{
				method: 'get',
				url: read_end_point + '/DEADBEEF' },
			{
				method: 'patch',
				url: update_end_point + '/DEADBEEF' },
			{
				method: 'delete',
				url: delete_end_point + '/DEADBEEF' },
			{
				method: 'get',
				url: list_end_point + '/all' },
			{
				method: 'get',
				url: list_end_point + '/user' } ];

		for (const end_point of end_points)
			await axios ({method: end_point.method, url: end_point.url})
				.then (function (response) {
					expect (true).toBe (false);
				})
				.catch (function (error) {
					expect (error.response.status).toBe (401);
				});
	});

	it ("wrong user", async function () {
		for (const user of this.test_users) {
			const auth_header = common.createTokenHeader (user.id);

			for (const post of this.test_posts) {
				if (user.id == post.owner.id)
					continue;

				const requests = [
					{
						method: 'delete',
						end_point: delete_end_point + '/' + post.id,
						params: {} },
					{
						method: 'patch',
						end_point: update_end_point + '/' + post.id,
						params: valid_params } ];

				for (const req of requests) {
					req_config = {
						method: req.method,
						url: req.end_point,
						data: req.params,
						headers: auth_header};

					await axios (req_config)
						.then (function (response) {
							expect (true).toBe (false);
						})
						.catch (function (error) {
							expect (error.response.status).toBe (400);
						});
				}
			}
		}
	});

	describe ("verify CRUD methods", function () {
		const min_params = {
			title: "a",
			body: "a" };

		const max_params = {
			title: "a".repeat (common.maxValidLength (postValidationFields, 'title') + 1),
			body: "a".repeat (common.maxValidLength (postValidationFields, 'body') + 1) };

		describe ("create tests", function () {
			beforeEach (common.deleteTestPosts);

			it ("missing parameters", async function () {
				const test_params = [{title: 'title'}, {body: 'body'}];

				for (const user of this.test_users) {
					const req_config = {headers: common.createTokenHeader (user.id)};

					for (const params of test_params)
						await axios.post (create_end_point, params, req_config)
							.then (function (response) {
								expect (true).toBe (false);
							})
							.catch (function (error) {
								expect (error.response.status).toBe (400);
							});
				}
			});

			it ("invalid parameters", async function () {
				const test_params = [
					{ title: min_params.title, body: valid_params.body },
					{ title: max_params.title, body: valid_params.body },
					{ title: valid_params.title, body: min_params.body },
					{ title: valid_params.title, body: max_params.body } ];

				for (const user of this.test_users) {
					const req_config = {headers: common.createTokenHeader (user.id)};

					for (const params of test_params) {
						await axios.post (create_end_point, params, req_config)
							.then (function (response) {
								expect (true).toBe (false);
							})
							.catch (function (error) {
								expect (error.response.status).toBe (400);
							});
					}
				}
			});

			it ("valid parameters", async function () {
				for (const user of this.test_users) {
					const req_config = {headers: common.createTokenHeader (user.id)};

					await axios.post (create_end_point, valid_params, req_config)
						.then (function (response) {
							expect (response.status).toBe (200);
							expect (response.data ['owner']).toBe (user.id);
						})
						.catch (function (error) {
							expect (true).toBe (false);
						});
				}
			});
		});

		describe ("read tests", function () {
			it ("missing parameters", async function () {
				const auth_header = {headers: common.createTokenHeader (this.test_users [0].id)};

				await axios.get (read_end_point, auth_header)
					.then (function (response) {
						expect (true).toBe (false);
					})
					.catch (function (error) {
						expect (error.response.status).toBe (404);
					});
			});

			it ("invalid parameters", async function () {
				const req_config = {headers: common.createTokenHeader (this.test_users [0].id)};
				const end_points = [
					read_end_point + '/DEADBEEF', // Malformed ObjectID
					read_end_point + '/12345678DEADBEEF98765432' ]; // Nonexistent ObjectID

				for (end_point of end_points)
					await axios.get (end_point, req_config)
						.then (function (response) {
							expect (true).toBe (false);
						})
						.catch (function (error) {
							expect (error.response.status).toBe (400);
						});
			});

			it ("valid parameters", async function () {
				jasmine.addMatchers ({ toHaveAscendingCreationTimes: common.ascendingCreationTimesMatcher });

				await common.reloadTestComments ();
				await common.reloadTestLikes ();

				for (const post of this.test_posts) {
					const req_config = {headers: common.createTokenHeader (this.test_users [0].id)};
					const end_point = read_end_point + '/' + post.id;

					await axios.get (end_point, req_config)
						.then (function (response) {
							expect (response.status).toBe (200);
							expect (response.data ['_id']).toBe (post.id);

							expect (response.data.comments).toHaveAscendingCreationTimes ();
							expect (response.data.likes).toHaveAscendingCreationTimes ();
						})
						.catch (function (error) {
							expect (true).toBe (false);
						});
				}
			});
		});

		describe ("update tests", function () {
			it ("missing parameters", async function () {
				for (const post of this.test_posts) {
					const end_point = update_end_point + '/' + post.id;
					const req_config = {headers: common.createTokenHeader (post.owner.id)};

					await axios.patch (end_point, {}, req_config)
						.then (function (response) {
							expect (true).toBe (false);
						})
						.catch (function (error) {
							expect (error.response.status).toBe (400);
						});
				}
			});

			it ("invalid parameters", async function () {
				const test_params = [
					{ title: min_params.title },
					{ title: max_params.title },
					{ body: min_params.body },
					{ body: max_params.body },
					{ title: min_params.title, body: valid_params.body },
					{ title: max_params.title, body: valid_params.body },
					{ title: valid_params.title, body: min_params.body },
					{ title: valid_params.title, body: max_params.body } ];

				for (const post of this.test_posts) {
					const end_point = update_end_point + '/' + post.id;
					const req_config = {headers: common.createTokenHeader (post.owner)};

					for (params of test_params)
						await axios.patch (end_point, params, req_config)
							.then (function (response) {
								expect (true).toBe (false);
							})
							.catch (function (error) {
								expect (error.response.status).toBe (400);
							});
				}
			});

			it ("valid parameters", async function () {
				const test_params = {
					first_title_change: { title: 'first_title_change' },
					first_body_change: { body: 'first_body_change' },
					second_change: { title: 'second_title_change', body: 'second_body_change' } };

				for (const post of this.test_posts) {
					const original_body = post.body;

					const end_point = update_end_point + '/' + post.id;
					const req_config = {headers: common.createTokenHeader (post.owner)};

					// First title change
					await axios.patch (end_point, test_params.first_title_change, req_config)
						.then (function (response) {
							expect (response.status).toBe (200);

							const updated_post = response.data;

							expect (updated_post.title).toBe (test_params.first_title_change.title);
							expect (updated_post.body).toBe (original_body);
						})
						.catch (function (error) {
							expect (true).toBe (false);
						});

					// First body change (title already changed)
					await axios.patch (end_point, test_params.first_body_change, req_config)
						.then (function (response) {
							expect (response.status).toBe (200);

							const updated_post = response.data;

							expect (updated_post.title).toBe (test_params.first_title_change.title);
							expect (updated_post.body).toBe (test_params.first_body_change.body);
						})
						.catch (function (error) {
							expect (true).toBe (false);
						});

					// Second change (both parameters changed)
					await axios.patch (end_point, test_params.second_change, req_config)
						.then (function (response) {
							expect (response.status).toBe (200);

							const updated_post = response.data;

							expect (updated_post.title).toBe (test_params.second_change.title);
							expect (updated_post.body).toBe (test_params.second_change.body);
						})
						.catch (function (error) {
							expect (true).toBe (false);
						});
				}
			});
		});

		describe ("delete tests", function () {
			it ("missing parameters", async function () {
				const auth_header = {headers: common.createTokenHeader (this.test_users [0].id)};

				await axios.delete (delete_end_point, auth_header)
					.then (function (response) {
						expect (true).toBe (false);
					})
					.catch (function (error) {
						expect (error.response.status).toBe (404);
					});
			});

			it ("invalid parameters", async function () {
				const auth_header = {headers: common.createTokenHeader (this.test_users [0].id)};
				const end_points = [
					delete_end_point + '/DEADBEEF', // Malformed ObjectID
					delete_end_point + '/12345678DEADBEEF98765432' ]; // Nonexistent ObjectID

				for (end_point of end_points)
					await axios.delete (end_point, auth_header)
						.then (function (response) {
							expect (true).toBe (false);
						})
						.catch (function (error) {
							expect (error.response.status).toBe (400);
						});
			});

			it ("valid parameters", async function () {
				await common.reloadTestComments ();
				await common.reloadTestLikes ();

				for (const post of await this.test_posts) {
					const auth_header = {headers: common.createTokenHeader (post.owner)};
					const end_point = delete_end_point + '/' + post.id;

					await axios.delete (end_point, auth_header)
						.then (async function (response) {
							expect (response.status).toBe (200);
							expect (response.data.deletedCount).toBe (1);

							const n_comments = await CommentModel.countDocuments ({post: post.id});
							const n_likes = await LikeModel.countDocuments ({post: post.id});

							expect (n_comments).toBe (0);
							expect (n_likes).toBe (0);
						})
						.catch (function (error) {
							expect (true).toBe (false);
						});
				}
			});
		});
	});

	describe ("list tests", function () {
		beforeAll (async function () {
			jasmine.addMatchers ({ toHaveCorrectPostOrder: common.postOrderMatcher });
		});

		it ("invalid scope", async function () {
			const auth_header = {headers: common.createTokenHeader (this.test_users [0].id)};
			const end_point = list_end_point + '/asdf';

			await axios.get (end_point, auth_header)
				.then (function (response) {
					expect (true).toBe (false);
				})
				.catch (function (error) {
					expect (error.response.status).toBe (404);
				});
		});

		describe ("all scope", function () {
			const end_point = list_end_point + '/all';

			beforeEach (async function () { await common.loadRandomPostsAndLikes (15, 45); });

			for (let i=0; i<3; i++)
				it ("iteration " + i, async function () {
					const auth_header = {headers: common.createTokenHeader (this.test_users [0].id)};

					await axios.get (end_point, auth_header)
						.then (async function (response) {
							expect (response.status).toBe (200);

							const n_expected = await PostModel.countDocuments ();
							expect (response.data.length).toBe (n_expected);

							expect (response.data).toHaveCorrectPostOrder ();
						})
						.catch (function (error) {
							expect (true).toBe (false);
						});
				});
		});

		describe ("user scope", function () {
			const end_point = list_end_point + '/user';

			beforeEach (async function () { await common.loadRandomPostsAndLikes (15, 45); });

			for (let i=0; i<3; i++)
				it ("iteration " + i, async function () {
					for (const user of this.test_users) {
						const auth_header = {headers: common.createTokenHeader (user.id)};

						await axios.get (end_point, auth_header)
							.then (async function (response) {
								expect (response.status).toBe (200);

								const n_expected = await PostModel.countDocuments ({owner: user});
								expect (response.data.length).toBe (n_expected);

								expect (response.data).toHaveCorrectPostOrder ();
							})
							.catch (function (error) {
								expect (true).toBe (false);
							});
					}
				});
		});
	});
});
