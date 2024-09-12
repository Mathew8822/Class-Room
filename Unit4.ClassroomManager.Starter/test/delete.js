const request = require('supertest');
const express = require('express');
const { PrismaClient } = require('@prisma/client');
const router = require('../server/api/students'); // Replace with the correct path to your router file

// Create an Express app and use the router
// const app = express();
// app.use(express.json());
// app.use('/', router);

// Mock PrismaClient
jest.mock('@prisma/client', () => {
  const mockPrisma = {
    student: {
      deleteMany: jest.fn(),
    },
  };
  return { PrismaClient: jest.fn(() => mockPrisma) };
});

// Create a fake user for testing purposes
const fakeUser = { id: 1 };

const prisma = new PrismaClient();

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

describe('DELETE /:id', () => {
  it('should delete a student when valid id is provided', async () => {
    const studentId = 1;

    // Mock PrismaClient method implementation
    prisma.student.deleteMany.mockResolvedValue({ count: 1 });

    // Make request using Supertest
    const res = await request(app)
      .delete(`/${studentId}`)
      .set('Authorization', 'Bearer valid-token') // Assuming you have middleware that checks for a token
      .expect(200);

    // Verify the response
    expect(res.body).toEqual({ count: 1 });
  });

  it('should return 404 if student id does not exist', async () => {
    const studentId = 999; // Assuming this id does not exist in the database

    // Mock PrismaClient method implementation
    prisma.student.deleteMany.mockResolvedValue({ count: 0 });

    // Make request using Supertest
    const res = await request(app)
      .delete(`/${studentId}`)
      .set('Authorization', 'Bearer valid-token') // Assuming you have middleware that checks for a token
      .expect(404);

    // Verify the response
    expect(res.text).toBe('Student not found');
  });

});
