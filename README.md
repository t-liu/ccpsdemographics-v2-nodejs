# CCPS Demographics API

[![CI/CD Pipeline](https://github.com/t-liu/ccpsdemographics-v2-nodejs/actions/workflows/cicd.yml/badge.svg)](https://github.com/t-liu/ccpsdemographics-v2-nodejs/actions/workflows/cicd.yml)
[![codecov](https://codecov.io/gh/t-liu/ccpsdemographics-v2-nodejs/branch/main/graph/badge.svg)](https://codecov.io/gh/t-liu/ccpsdemographics-v2-nodejs)

A serverless Node.js API for retrieving Charles County Public Schools demographic data from a MongoDB Atlas collection. Built with AWS Lambda, API Gateway, and deployed via the Serverless Framework with automated CI/CD through GitHub Actions.

## 🚀 Features

- **RESTful API** with three endpoints for querying school demographic data
- **MongoDB Atlas** integration with connection caching for optimal performance
- **AWS Lambda** serverless functions with API Gateway
- **Automated CI/CD** pipeline with GitHub Actions
- **Comprehensive testing** with unit and integration tests
- **Code coverage** reporting with Codecov integration
- **Optimized deployments** using serverless-esbuild for bundle size reduction

## 📋 Prerequisites

- **Node.js** 20.x or higher
- **npm** (comes with Node.js)
- **MongoDB Atlas** account with a cluster set up
- **AWS Account** with appropriate IAM permissions
- **Serverless Framework** (installed via npm)
- **Git** for version control

## 🛠️ Local Development Setup

### 1. Clone the Repository

```bash
git clone https://github.com/t-liu/ccpsdemographics-v2-nodejs.git
cd ccpsdemographics-v2-nodejs
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Configuration

Create a `.env` file in the project root:

```bash
touch .env
```

Add your MongoDB connection string:

```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/project?retryWrites=true&w=majority
```

**Note:** Replace `username`, `password`, `cluster`, and `project` with your actual MongoDB Atlas credentials and database name.

### 4. MongoDB Atlas Setup

#### Configure Network Access:
1. Go to **MongoDB Atlas** → **Network Access**
2. Click **Add IP Address**
3. For local development: Add your current IP address
4. For AWS Lambda: Add `0.0.0.0/0` (allow from anywhere)

#### Verify Database Structure:
- Database name: `project`
- Collection name: `schools`
- Ensure you have data in the collection

### 5. Running Locally (Optional - for testing handlers directly)

You can test the Lambda handlers locally using the Serverless Framework:

```bash
# Invoke a specific function locally
serverless invoke local --function getAllSchools

# With custom event data
serverless invoke local --function getSchoolById --data '{"pathParameters":{"schoolId":"80701"}}'
```

Or use the Serverless Offline plugin:

```bash
npm install --save-dev serverless-offline
```

Add to `serverless.yml`:
```yaml
plugins:
  - serverless-esbuild
  - serverless-offline
```

Then run:
```bash
serverless offline
```

## 🧪 Testing

### Run All Tests

```bash
npm test
```

### Run Unit Tests Only

```bash
npm run test:unit
```

Unit tests mock MongoDB connections and test handler logic in isolation.

### Run Integration Tests Only

```bash
npm run test:integration
```

Integration tests use MongoDB Memory Server to test against a real (in-memory) database.

### Run Tests with Coverage

```bash
npm run test:coverage
```

This generates:
- Terminal output with coverage summary
- HTML report in `coverage/lcov-report/index.html`
- LCOV file for coverage tools

### Coverage Thresholds

The project enforces minimum coverage thresholds:
- **Branches:** 80%
- **Functions:** 80%
- **Lines:** 80%
- **Statements:** 80%

## 📦 Deployment

### Manual Deployment

```bash
npm run deploy
```

This deploys to AWS using the Serverless Framework. Make sure you have:
- AWS credentials configured (`aws configure`)
- Proper IAM permissions for Lambda, API Gateway, CloudFormation, S3, and IAM

### Automated Deployment (CI/CD)

The project uses GitHub Actions for automated testing and deployment:

1. **On Pull Request:** Runs unit and integration tests
2. **On Push to Main:** Runs tests and deploys to AWS

#### Required GitHub Secrets:

Set these in **Settings** → **Secrets and variables** → **Actions**:

- `AWS_ACCESS_KEY_ID`: Your AWS access key
- `AWS_SECRET_ACCESS_KEY`: Your AWS secret key
- `MONGODB_URI`: Production MongoDB connection string
- `MONGODB_URI_TEST`: Test MongoDB connection string (optional)
- `CODECOV_TOKEN`: Codecov token for coverage reports (optional)

#### AWS IAM Permissions

Your `GitHubDeploy` IAM user needs the following permissions:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "cloudformation:*",
        "s3:*",
        "logs:*",
        "iam:GetRole",
        "iam:CreateRole",
        "iam:DeleteRole",
        "iam:PutRolePolicy",
        "iam:DeleteRolePolicy",
        "iam:GetRolePolicy",
        "iam:PassRole",
        "iam:TagRole",
        "iam:UntagRole",
        "iam:ListRoleTags",
        "lambda:*",
        "apigateway:*",
        "events:*"
      ],
      "Resource": "*"
    }
  ]
}
```

## 🌐 API Endpoints

Base URL: `https://YOUR_API_ID.execute-api.us-east-1.amazonaws.com/prod`

### Get All Schools

```http
GET /schools
```

**Response:**
```json
[
  {
    "schoolId": "80701",
    "name": "MATTHEW HENSON MIDDLE SCHOOL",
    "yearlyData": [
      {
        "academicYear": { "full": "2005-2006" },
        "demographics": {
          "black": 415,
          "hispanic": 16,
          "white": 352,
          "other": 42,
          "total": 825
        }
      }
    ]
  }
]
```

### Get Schools by Academic Year

```http
GET /schools/year/{academicYear}
```

**Parameters:**
- `academicYear` (path): Academic year in format `YYYY-YYYY` (e.g., `2005-2006`)

**Response:** Array of schools with data for the specified academic year

**Error Responses:**
- `400 Bad Request`: Academic year is missing
- `200 OK`: Empty array if no schools found for that year

### Get School by ID

```http
GET /schools/{schoolId}
```

**Parameters:**
- `schoolId` (path): Unique school identifier (e.g., `80701`)

**Response:** Single school object

**Error Responses:**
- `400 Bad Request`: School ID is missing
- `404 Not Found`: School with specified ID does not exist

## 📁 Project Structure

```
ccpsdemographics-v2-nodejs/
├── .github/
│   └── workflows/
│       └── cicd.yml           # GitHub Actions CI/CD pipeline
├── src/
│   └── handler.js             # Lambda function handlers
├── tests/
│   ├── fixtures/
│   │   └── schools.json       # Test data fixtures
│   ├── integration/
│   │   └── api.test.js        # Integration tests
│   └── unit/
│       └── handler.test.js    # Unit tests
├── .env                       # Environment variables (not committed)
├── .gitignore                 # Git ignore rules
├── package.json               # Project dependencies and scripts
├── serverless.yml             # Serverless Framework configuration
└── README.md                  # This file
```

## 🏗️ Architecture

```
GitHub Actions → AWS CloudFormation → AWS Lambda Functions
                                    ↓
                              API Gateway (REST API)
                                    ↓
                              MongoDB Atlas
```

### Lambda Functions

- **getAllSchools**: Retrieves all schools from the database
- **getSchoolsByYear**: Filters schools by academic year
- **getSchoolById**: Retrieves a specific school by ID

Each function:
- Has 10-second timeout
- Uses 512MB memory
- Implements connection caching for MongoDB
- Returns proper HTTP status codes and CORS headers

## 🐛 Troubleshooting

### Common Issues

#### 1. "Cannot find module 'mongodb'"
```bash
npm install
```

#### 2. "MONGODB_URI is not defined"
- Check that `.env` file exists and contains `MONGODB_URI`
- For AWS deployment, verify GitHub secret is set

#### 3. Lambda Timeout (502 Error)
- Verify MongoDB Atlas Network Access allows `0.0.0.0/0`
- Check CloudWatch Logs for detailed error messages
- Ensure MongoDB URI is correct with proper database name

#### 4. Empty Array Response
- Verify database name in MongoDB URI matches your Atlas database
- Check collection name is `schools` (case-sensitive)
- Confirm data exists in MongoDB Atlas

#### 5. Jest Did Not Exit
- This is handled by `forceExit: true` in Jest config
- If persistent, check for unclosed MongoDB connections

### Viewing Logs

**CloudWatch Logs:**
1. Go to AWS CloudWatch Console
2. Navigate to **Log groups**
3. Find `/aws/lambda/ccpsdemographics-v2-api-[function-name]`
4. View recent log streams

**GitHub Actions Logs:**
1. Go to your repository → **Actions** tab
2. Click on the workflow run
3. Expand job steps to see detailed logs

## 🔒 Security Considerations

- MongoDB Atlas credentials stored as GitHub Secrets
- API Gateway can be configured with API keys or AWS IAM authorization
- MongoDB Atlas Network Access controls IP whitelisting
- Lambda functions run with minimal IAM permissions
- No sensitive data committed to repository (`.env` in `.gitignore`)

## 📊 Monitoring

- **CloudWatch Metrics**: Monitor Lambda invocations, duration, errors
- **CloudWatch Logs**: Detailed execution logs for debugging
- **API Gateway Metrics**: Track API requests, latency, errors
- **MongoDB Atlas Monitoring**: Database performance and connection metrics

### Code Quality Standards

- All tests must pass
- Maintain minimum 80% code coverage
- Follow existing code style
- Add tests for new features
- Update documentation as needed

**Built with ❤️ using Node.js, MongoDB, and AWS Lambda**