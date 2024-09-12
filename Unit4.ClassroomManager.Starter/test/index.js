const request = require('supertest');
const express = require('express');
const router = require('../server/auth/index'); // Replace with actual path
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Mock PrismaClient
jest.mock('@prisma/client');

// Create a fake user for testing purposes
const fakeUser = { id: 1 };

describe('POST /register', () => {
  let app;

  beforeAll(() => {
    // Mock req.body for testing purposes
    const mockReqBodyMiddleware = (req, res, next) => {
      req.body = {
        username: 'testuser',
        password: 'password123',
      };
      next();
    };

    app = express();
    app.use(express.json()); // Required to parse JSON bodies
    app.use(mockReqBodyMiddleware); // Mock the req.body
    app.use(router); // Mount the router

    // Mock PrismaClient methods for the test cases
    PrismaClient.prototype.instructor = {
      create: jest.fn(),
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should register a new user and return a 201 status code with a token', async () => {
    // Mock data for instructor.create method
    const mockInstructor = { id: 1 };

    // Mock PrismaClient method implementation
    PrismaClient.prototype.instructor.create.mockResolvedValue(mockInstructor);

    // Mock JWT sign method
    jest.spyOn(jwt, 'sign').mockReturnValue('mocked.token.jwt');

    // Mock bcrypt.hash method
    jest.spyOn(bcrypt, 'hash').mockResolvedValue('hashedPassword');

    // Make request using Supertest
    const res = await request(app)
      .post('/register')
      .expect(201);

    // Verify the response
    expect(res.body.token).toBe('mocked.token.jwt');
  });
});
