const request = require('supertest');
const { MongoMemoryServer } = require('mongodb-memory-server');
const { MongoClient } = require('mongodb');
const serverless = require('serverless-http');
const { handler } = require('../../src/handler');

let mongod;
let client;
let db;
let app;

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  process.env.MONGODB_URI = mongod.getUri();
  client = await MongoClient.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
  db = client.db();
  app = serverless({ handler }, { provider: 'aws' });

  // Seed test data
  await db.collection('schools').insertOne({
    schoolId: '80701',
    name: 'MATTHEW HENSON MIDDLE SCHOOL',
    yearlyData: [
      {
        academicYear: { full: '2005-2006' },
        demographics: { black: 415, hispanic: 16, white: 352, other: 42, total: 825 },
      },
    ],
  });
});

afterAll(async () => {
  await client.close();
  await mongod.stop();
});

describe('API Integration Tests', () => {
  it('should get all schools', async () => {
    const res = await request(app).get('/schools');

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].schoolId).toBe('80701');
  });

  it('should get schools by academic year', async () => {
    const res = await request(app).get('/schools/year/2005-2006');

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].yearlyData[0].academicYear.full).toBe('2005-2006');
  });

  it('should return 400 for missing academic year', async () => {
    const res = await request(app).get('/schools/year/');

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: 'Academic year is required' });
  });

  it('should get school by ID', async () => {
    const res = await request(app).get('/schools/80701');

    expect(res.status).toBe(200);
    expect(res.body.schoolId).toBe('80701');
  });

  it('should return 404 for non-existent school ID', async () => {
    const res = await request(app).get('/schools/99999');

    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: 'School not found' });
  });
});