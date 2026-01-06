# API Tests

This directory contains API/network-level tests for Rhombus AI, following a black-box approach without assuming internal implementation details.

## Test Files

| File               | Tests | Coverage                                           |
| ------------------ | ----- | -------------------------------------------------- |
| `auth.spec.ts`     | 2     | Session validation, unauthorized access (negative) |
| `pipeline.spec.ts` | 1     | Project list retrieval                             |
| `upload.spec.ts`   | 1     | File upload verification                           |

## Running Tests

```bash
# Run all API tests
npm run test:api

# Run with visible browser
npx playwright test api-tests/ --headed

# Run specific test file
npx playwright test api-tests/auth.spec.ts
```

## Testing Approach

### Black-Box API Testing

Since Rhombus AI is a live production application without documented public APIs, I used a black-box testing approach. The challenge was to validate API behavior without access to source code, API documentation, or direct endpoints.

### Technique 1: Network Interception

I used Playwright's built-in network interception capabilities to capture and validate API calls:

```typescript
// Capture API response during UI navigation
const response = await page.waitForResponse((response) =>
  response.url().includes("/api/dataset/projects/all")
);
expect(response.status()).toBe(200);
```

This approach allows me to:

- Validate API responses triggered by UI actions
- Assert on status codes, headers, and response bodies
- Test error handling without mocking

### Technique 2: Network Sniffer (HAR Capture)

I built a custom network sniffer tool (`tools/network-sniffer.ts`) that:

1. Opens a browser session with HAR recording enabled
2. Navigates through the application workflow
3. Captures all network traffic to a HAR file
4. Extracts API endpoints for analysis

Usage:

```bash
npx ts-node tools/network-sniffer.ts
```

This helped me discover all backend API endpoints used by the application.

### Technique 3: Playwright Trace Viewer

I recorded test runs with `--trace on` and analyzed them in Playwright Trace Viewer:

1. Run tests with trace: `npx playwright test --trace on`
2. Open trace: `npx playwright show-report`
3. Navigate to Network tab to see all API calls
4. Filter by Fetch/XHR to see only API requests

This provided detailed timing, request/response bodies, and headers for each API call.

## Discovered Endpoints

Through trace analysis and network sniffing, I identified the following API endpoints:

### Authentication

| Endpoint                           | Method | Purpose           |
| ---------------------------------- | ------ | ----------------- |
| `/api/accounts/users/profile`      | GET    | User profile data |
| `/api/accounts/users/subscription` | GET    | Subscription tier |

### Projects

| Endpoint                    | Method | Purpose            |
| --------------------------- | ------ | ------------------ |
| `/api/dataset/projects/all` | GET    | List all projects  |
| `/api/dataset/projects/add` | POST   | Create new project |

### Datasets and Pipeline

| Endpoint                                                       | Method | Purpose                |
| -------------------------------------------------------------- | ------ | ---------------------- |
| `/api/dataset/datasets/upload/{projectId}`                     | POST   | Upload file to project |
| `/api/dataset/analyzer/v2/projects/{id}/datasets`              | GET    | Get project datasets   |
| `/api/dataset/analyzer/v2/projects/{id}/nodes`                 | GET    | Get pipeline nodes     |
| `/api/dataset/analyzer/v2/projects/{id}/pipeline/process`      | POST   | Execute pipeline       |
| `/api/dataset/analyzer/v2/projects/{id}/nodes/output-download` | GET    | Download output        |

### Background Jobs

| Endpoint                           | Method | Purpose                |
| ---------------------------------- | ------ | ---------------------- |
| `/api/background_jobs/jobs/{uuid}` | GET    | Check async job status |

## Test Coverage

| Requirement              | Status                     |
| ------------------------ | -------------------------- |
| At least 2 API tests     | 4 tests                    |
| Cover 2+ areas           | Auth, Upload, Pipeline     |
| At least 1 negative test | Invalid token returns 401  |
| Black-box approach       | No internal knowledge used |

## Future Enhancements

If I had direct API access or more time, I would add:

### Direct REST API Tests

- Bypass UI entirely for faster execution
- Test endpoints directly with `request.get()` / `request.post()`
- Validate request/response schemas with Zod or Ajv

### Performance Testing

- Measure API response times
- Establish latency baselines
- Test under concurrent load

### Edge Case Testing

- Invalid project IDs (404 handling)
- Malformed request bodies (400 handling)
- Rate limiting behavior
- Large file uploads (size limits)
- Special characters in filenames

### Contract Testing

- Define expected schemas for each endpoint
- Validate responses match contracts
- Catch breaking changes early

### Security Testing

- Test authentication token expiry
- Validate CORS headers
- Check for sensitive data exposure
- Test authorization boundaries
