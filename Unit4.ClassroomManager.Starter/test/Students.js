const request = require("supertest");
const express = require("express");
const router = require("../server/api/students"); // Replace with actual path
const { PrismaClient } = require("@prisma/client");

// Mock PrismaClient
jest.mock("@prisma/client");

// Create a fake user for testing purposes
const fakeUser = { id: 1 };

describe("GET /", () => {
  let app;

  beforeAll(() => {
    // Mock req.user for testing purposes
    const mockAuthMiddleware = (req, res, next) => {
      req.user = fakeUser;
      next();
    };

    app = express();
    app.use(mockAuthMiddleware); // Mock the authentication middleware
    app.use(router); // Mount the router

    // Mock PrismaClient methods for the test cases
    PrismaClient.prototype.student = {
      findMany: jest.fn(),
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should return all students for the logged-in instructor", async () => {
    // Mock data for findMany method
    const mockStudents = [
      { id: 1, name: "Student 1", cohort: "A" },
      { id: 2, name: "Student 2", cohort: "B" },
    ];

    // Mock PrismaClient method implementation
    PrismaClient.prototype.student.findMany.mockResolvedValue(mockStudents);

    // Make request using Supertest
    const res = await request(app).get("/").expect(200);

    // Verify the response
    expect(res.body).toEqual(mockStudents);
  });

  // it('should handle errors if they occur during retrieval', async () => {
  //   // Mock PrismaClient method to throw an error
  //   PrismaClient.prototype.student.findMany.mockRejectedValue(new Error('Database error'));

  //   // Make request using Supertest
  //   const res = await request(app)
  //     .get('/')
  //     .expect(500);

  //   // Verify the error response
  //   expect(res.text).toBe('Database error');
  // });
});

describe("GET /:id", () => {
  let app;

  beforeAll(() => {
    // Mock req.user for testing purposes
    const mockReqUserMiddleware = (req, res, next) => {
      req.user = fakeUser; // Mock the req.user object
      next();
    };

    app = express();
    app.use(mockReqUserMiddleware); // Use the mock req.user middleware
    app.use(router); // Mount the router

    // Mock PrismaClient methods for the test cases
    PrismaClient.prototype.student = {
      findFirst: jest.fn(),
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should return a student when a valid ID is provided", async () => {
    // Mock data for student.findFirst method
    const mockStudent = { id: 1, name: "Test Student", cohort: "2023" };

    // Mock PrismaClient method implementation
    PrismaClient.prototype.student.findFirst.mockResolvedValue(mockStudent);

    // Make request using Supertest
    const res = await request(app).get("/1").expect(200);

    // Verify the response
    expect(res.body).toEqual(mockStudent);
  });

  it("should return 404 if student with provided ID does not exist", async () => {
    // Mock PrismaClient method to return null (no student found)
    PrismaClient.prototype.student.findFirst.mockResolvedValue(null);

    // Make request using Supertest
    const res = await request(app)
      .get("/999") // Using a non-existing ID
      .expect(404);

    // Verify the response
    expect(res.text).toBe("Student not found.");
  });
});

describe("PUT /:id", () => {
  let app;

  beforeAll(() => {
    // Mock req.user for testing purposes
    const mockReqUserMiddleware = (req, res, next) => {
      req.user = fakeUser; // Mock the req.user object
      next();
    };

    app = express();
    app.use(express.json()); // Parse request body as JSON
    app.use(mockReqUserMiddleware); // Use the mock req.user middleware
    app.use(router); // Mount the router

    // Mock PrismaClient methods for the test cases
    PrismaClient.prototype.student = {
      updateMany: jest.fn(),
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should update a student when valid data is provided", async () => {
    const updatedStudent = {
      id: 1,
      name: "Updated Student Name",
      cohort: "2024",
    };

    // Mock PrismaClient method implementation
    PrismaClient.prototype.student.updateMany.mockResolvedValue([
      { id: 1, name: "Updated Student Name", cohort: "2024" },
    ]);

    // Make request using Supertest
    const res = await request(app).put("/1").send(updatedStudent).expect(200);

    // Verify the response
    expect(res.body[0]).toEqual(updatedStudent);
  });

  it("should return 404 if student with provided ID does not exist", async () => {
    const updatedStudent = {
      id: 999,
      name: "Updated Student Name",
      cohort: "2024",
    };

    // Mock PrismaClient method to return zero updated records
    PrismaClient.prototype.student.updateMany.mockResolvedValue({ count: 0 });

    // Make request using Supertest
    const res = await request(app).put("/999").send(updatedStudent).expect(404);

    // Verify the response
    expect(res.text).toBe("Student not found");
  });

  it("should return 401 if user is not logged in", async () => {
    // Create a new instance of express app without req.user middleware
    const appWithoutAuth = express();
    appWithoutAuth.use(express.json());
    appWithoutAuth.use(router);

    // Make request using Supertest
    const res = await request(appWithoutAuth)
      .put("/1")
      .send({ id: 1, name: "Updated Student Name", cohort: "2024" })
      .expect(401);

    // Verify the response
    expect(res.text).toBe("You must be logged in to do that.");
  });
});
