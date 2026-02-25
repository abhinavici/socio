const test = require("node:test");
const assert = require("node:assert/strict");
const { before, after, afterEach } = require("node:test");
const request = require("supertest");
const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");

const app = require("../app");
const User = require("../models/User");
const Task = require("../models/Task");
const Category = require("../models/Category");

let mongoServer;

before(async () => {
  process.env.JWT_SECRET = "test-secret-for-api-suite";
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
});

afterEach(async () => {
  await Promise.all([
    User.deleteMany({}),
    Task.deleteMany({}),
    Category.deleteMany({}),
  ]);
});

after(async () => {
  await mongoose.connection.close();
  await mongoServer.stop();
});

const registerAndLogin = async () => {
  const email = `tester_${Date.now()}_${Math.floor(Math.random() * 10000)}@example.com`;
  const password = "pass1234";

  const registerResponse = await request(app).post("/api/auth/register").send({
    name: "Tester",
    email,
    password,
  });

  assert.equal(registerResponse.statusCode, 201);

  const loginResponse = await request(app).post("/api/auth/login").send({
    email,
    password,
  });

  assert.equal(loginResponse.statusCode, 200);
  assert.equal(typeof loginResponse.body.token, "string");

  return loginResponse.body.token;
};

test("auth, categories, and task flow works end-to-end", async () => {
  const token = await registerAndLogin();

  const createCategoryResponse = await request(app)
    .post("/api/categories")
    .set("Authorization", `Bearer ${token}`)
    .send({ name: "Work" });

  assert.equal(createCategoryResponse.statusCode, 201);
  assert.equal(createCategoryResponse.body.name, "Work");
  const categoryId = createCategoryResponse.body._id;

  const categoriesResponse = await request(app)
    .get("/api/categories")
    .set("Authorization", `Bearer ${token}`);

  assert.equal(categoriesResponse.statusCode, 200);
  assert.equal(categoriesResponse.body.length, 1);

  const createTaskWithCategoryResponse = await request(app)
    .post("/api/tasks")
    .set("Authorization", `Bearer ${token}`)
    .send({
      title: "Write tests",
      description: "Cover auth, category and CRUD flow",
      category: categoryId,
    });

  assert.equal(createTaskWithCategoryResponse.statusCode, 201);
  assert.equal(createTaskWithCategoryResponse.body.title, "Write tests");
  assert.equal(createTaskWithCategoryResponse.body.category.name, "Work");

  const createTaskWithoutCategoryResponse = await request(app)
    .post("/api/tasks")
    .set("Authorization", `Bearer ${token}`)
    .send({
      title: "No category task",
      description: "Should stay uncategorized",
    });

  assert.equal(createTaskWithoutCategoryResponse.statusCode, 201);
  assert.equal(createTaskWithoutCategoryResponse.body.category, null);

  const taskId = createTaskWithCategoryResponse.body._id;

  const listTasksResponse = await request(app)
    .get("/api/tasks")
    .set("Authorization", `Bearer ${token}`);

  assert.equal(listTasksResponse.statusCode, 200);
  assert.equal(listTasksResponse.body.length, 2);

  const updateTaskResponse = await request(app)
    .put(`/api/tasks/${taskId}`)
    .set("Authorization", `Bearer ${token}`)
    .send({ status: "completed", category: "" });

  assert.equal(updateTaskResponse.statusCode, 200);
  assert.equal(updateTaskResponse.body.status, "completed");
  assert.equal(updateTaskResponse.body.category, null);

  const deleteTaskResponse = await request(app)
    .delete(`/api/tasks/${taskId}`)
    .set("Authorization", `Bearer ${token}`);

  assert.equal(deleteTaskResponse.statusCode, 200);
  assert.equal(deleteTaskResponse.body.message, "Task removed successfully");
});

test("rejects weak register input, duplicate category, and missing auth", async () => {
  const weakPasswordResponse = await request(app).post("/api/auth/register").send({
    name: "Weak User",
    email: "weak@example.com",
    password: "123",
  });

  assert.equal(weakPasswordResponse.statusCode, 400);
  assert.match(weakPasswordResponse.body.message, /Password must be at least/i);

  const token = await registerAndLogin();

  const firstCategoryResponse = await request(app)
    .post("/api/categories")
    .set("Authorization", `Bearer ${token}`)
    .send({ name: "Personal" });

  assert.equal(firstCategoryResponse.statusCode, 201);

  const duplicateCategoryResponse = await request(app)
    .post("/api/categories")
    .set("Authorization", `Bearer ${token}`)
    .send({ name: "personal" });

  assert.equal(duplicateCategoryResponse.statusCode, 400);
  assert.equal(duplicateCategoryResponse.body.message, "Category already exists");

  const unauthorizedTaskResponse = await request(app).post("/api/tasks").send({
    title: "No token should fail",
  });

  assert.equal(unauthorizedTaskResponse.statusCode, 401);
  assert.equal(unauthorizedTaskResponse.body.message, "Not authorized, no token");
});
