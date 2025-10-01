const fs = require('fs');
const path = require('path');

// Load fixture data
const fixturePath = path.join(__dirname, '../fixtures/schools.json');
const schoolsFixture = JSON.parse(fs.readFileSync(fixturePath, 'utf8'));

describe('Handler Unit Tests', () => {
  let mockDb;
  let mockCollection;
  let getAllSchools, getSchoolsByYear, getSchoolById;
  let MongoClient;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
    
    // Mock mongodb AFTER resetModules
    jest.mock('mongodb');
    MongoClient = require('mongodb').MongoClient;

    mockCollection = {
      find: jest.fn().mockReturnThis(),
      findOne: jest.fn(),
      toArray: jest.fn(),
    };
    mockDb = {
      collection: jest.fn().mockReturnValue(mockCollection),
    };
    
    // Create mock client with db method
    const mockClient = {
      db: jest.fn().mockReturnValue(mockDb)
    };
    MongoClient.connect = jest.fn().mockResolvedValue(mockClient);

    // Require handler AFTER setting up mocks
    const handler = require('../../src/handler');
    getAllSchools = handler.getAllSchools;
    getSchoolsByYear = handler.getSchoolsByYear;
    getSchoolById = handler.getSchoolById;
  });

  describe('getAllSchools', () => {
    it('should return all schools from fixture', async () => {
      mockCollection.toArray.mockResolvedValue(schoolsFixture);

      const result = await getAllSchools({});

      expect(result.statusCode).toBe(200);
      expect(JSON.parse(result.body)).toEqual(schoolsFixture);
      expect(mockCollection.find).toHaveBeenCalledWith({});
      expect(JSON.parse(result.body)).toHaveLength(3);
      expect(JSON.parse(result.body)[0].schoolId).toBe('80701');
    });

    it('should handle errors', async () => {
      mockCollection.toArray.mockRejectedValue(new Error('Database error'));
    
      const result = await getAllSchools({});
    
      expect(result.statusCode).toBe(500);
      expect(JSON.parse(result.body)).toEqual({ error: 'Internal Server Error' });
    });
  });

  describe('getSchoolsByYear', () => {
    it('should return schools for a given academic year from fixture', async () => {
      const academicYear = '2005-2006';
      const filteredSchools = schoolsFixture.filter(school =>
        school.yearlyData.some(data => data.academicYear.full === academicYear)
      );
      mockCollection.toArray.mockResolvedValue(filteredSchools);

      const result = await getSchoolsByYear({
        pathParameters: { academicYear },
      });

      expect(result.statusCode).toBe(200);
      expect(JSON.parse(result.body)).toEqual(filteredSchools);
      expect(mockCollection.find).toHaveBeenCalledWith({
        'yearlyData.academicYear.full': academicYear,
      });
      expect(JSON.parse(result.body)).toHaveLength(3);
      expect(JSON.parse(result.body)[0].yearlyData[0].academicYear.full).toBe(academicYear);
    });

    it('should return empty array for non-existent academic year', async () => {
      mockCollection.toArray.mockResolvedValue([]);

      const result = await getSchoolsByYear({
        pathParameters: { academicYear: '9999-9999' },
      });

      expect(result.statusCode).toBe(200);
      expect(JSON.parse(result.body)).toEqual([]);
      expect(mockCollection.find).toHaveBeenCalledWith({
        'yearlyData.academicYear.full': '9999-9999',
      });
    });

    it('should return 400 if academic year is missing', async () => {
      const result = await getSchoolsByYear({});

      expect(result.statusCode).toBe(400);
      expect(JSON.parse(result.body)).toEqual({ error: 'Academic year is required' });
    });
  });

  describe('getSchoolById', () => {
    it('should return a school by ID from fixture', async () => {
      const schoolId = '80701';
      const school = schoolsFixture.find(s => s.schoolId === schoolId);
      mockCollection.findOne.mockResolvedValue(school);

      const result = await getSchoolById({
        pathParameters: { schoolId },
      });

      expect(result.statusCode).toBe(200);
      expect(JSON.parse(result.body)).toEqual(school);
      expect(mockCollection.findOne).toHaveBeenCalledWith({ schoolId });
      expect(JSON.parse(result.body).schoolId).toBe(schoolId);
    });

    it('should return 400 if school ID is missing', async () => {
      const result = await getSchoolById({});

      expect(result.statusCode).toBe(400);
      expect(JSON.parse(result.body)).toEqual({ error: 'School ID is required' });
    });

    it('should return 404 if school is not found', async () => {
      mockCollection.findOne.mockResolvedValue(null);

      const result = await getSchoolById({
        pathParameters: { schoolId: '99999' },
      });

      expect(result.statusCode).toBe(404);
      expect(JSON.parse(result.body)).toEqual({ error: 'School not found' });
    });
  });
});