const { MongoMemoryServer } = require('mongodb-memory-server');
const { MongoClient } = require('mongodb');

let mongod;
let client;
let db;
let getAllSchools, getSchoolsByYear, getSchoolById;

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  process.env.MONGODB_URI = mongod.getUri();
  
  client = await MongoClient.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
  db = client.db();

  // Seed test data
  await db.collection('schools').insertMany([
    {
      schoolId: '80701',
      name: 'MATTHEW HENSON MIDDLE SCHOOL',
      yearlyData: [
        {
          academicYear: { full: '2005-2006' },
          demographics: { black: 415, hispanic: 16, white: 352, other: 42, total: 825 },
        },
      ],
    },
    {
      schoolId: '80702',
      name: 'ANOTHER SCHOOL',
      yearlyData: [
        {
          academicYear: { full: '2006-2007' },
          demographics: { black: 200, hispanic: 10, white: 150, other: 20, total: 380 },
        },
      ],
    },
  ]);

  // Import handlers after MongoDB is set up
  const handler = require('../../src/handler');
  getAllSchools = handler.getAllSchools;
  getSchoolsByYear = handler.getSchoolsByYear;
  getSchoolById = handler.getSchoolById;
});

afterAll(async () => {
  await client.close();
  await mongod.stop();
  await connection.close();
});

describe('API Integration Tests', () => {
  it('should get all schools', async () => {
    const result = await getAllSchools({});

    expect(result.statusCode).toBe(200);
    const body = JSON.parse(result.body);
    expect(body).toHaveLength(2);
    expect(body[0].schoolId).toBe('80701');
  });

  it('should get schools by academic year', async () => {
    const result = await getSchoolsByYear({
      pathParameters: { academicYear: '2005-2006' },
    });

    expect(result.statusCode).toBe(200);
    const body = JSON.parse(result.body);
    expect(body).toHaveLength(1);
    expect(body[0].yearlyData[0].academicYear.full).toBe('2005-2006');
  });

  it('should return empty array for non-existent academic year', async () => {
    const result = await getSchoolsByYear({
      pathParameters: { academicYear: '9999-9999' },
    });

    expect(result.statusCode).toBe(200);
    const body = JSON.parse(result.body);
    expect(body).toEqual([]);
  });

  it('should return 400 for missing academic year', async () => {
    const result = await getSchoolsByYear({});

    expect(result.statusCode).toBe(400);
    const body = JSON.parse(result.body);
    expect(body).toEqual({ error: 'Academic year is required' });
  });

  it('should get school by ID', async () => {
    const result = await getSchoolById({
      pathParameters: { schoolId: '80701' },
    });

    expect(result.statusCode).toBe(200);
    const body = JSON.parse(result.body);
    expect(body.schoolId).toBe('80701');
  });

  it('should return 404 for non-existent school ID', async () => {
    const result = await getSchoolById({
      pathParameters: { schoolId: '99999' },
    });

    expect(result.statusCode).toBe(404);
    const body = JSON.parse(result.body);
    expect(body).toEqual({ error: 'School not found' });
  });

  it('should return 400 for missing school ID', async () => {
    const result = await getSchoolById({});

    expect(result.statusCode).toBe(400);
    const body = JSON.parse(result.body);
    expect(body).toEqual({ error: 'School ID is required' });
  });
});