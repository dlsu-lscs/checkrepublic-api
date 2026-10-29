# Document uploads and retrieval

Apply migrations with `npm run prisma:deploy` before starting the updated API.
The new `documents.uploaded_at` column records when a document row is created;
existing rows receive the migration timestamp.

Configure `S3_ENDPOINT`, `S3_REGION`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`, and
`S3_BUCKET` in `.env`. Use the Garage S3 API endpoint and its configured region.
The access key needs read and write access to the bucket. Keep the bucket private
and the credentials on the server. The endpoint must be reachable by callers who
use the returned download URLs.

## Upload

`POST /api/documents/upload` accepts `multipart/form-data` with exactly one file:

| Field | Value |
| --- | --- |
| `projectId` | An existing project UUID. |
| `documentType` | `PRE_ACTS` or `POST_ACTS`. |
| `file` | A nonempty PDF, DOCX, or XLSX file, at most 26,214,400 bytes. |

The fields can appear before or after the file. The filename extension and
declared MIME type must match:

| Extension | MIME type |
| --- | --- |
| `.pdf` | `application/pdf` |
| `.docx` | `application/vnd.openxmlformats-officedocument.wordprocessingml.document` |
| `.xlsx` | `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet` |

These checks validate the declared format; they do not inspect the document's contents.

In `/documentation`, expand `POST /api/documents/upload` and select **Try it out**.
Enter `projectId`, choose `documentType`, select a file, and execute the request.

Example in PowerShell, using a project ID from the seed command:

```powershell
curl.exe http://localhost:3000/api/documents/upload -F "projectId=22222222-2222-4222-8222-222222222222" -F "documentType=PRE_ACTS" -F "file=@proposal.pdf;type=application/pdf"
```

The API returns `201` with `documentId`, `filename`, `fileUrl`, `mimeType`,
`sizeBytes` (a JSON number), and `uploadedAt` (an ISO timestamp). The database
stores the private object key, not the signed URL. If saving the row fails, the
service attempts to remove the uploaded object and logs any cleanup failure.

## Retrieve

`GET /api/documents/:documentId` returns the same metadata with a freshly signed
`fileUrl`. The URL permits a GET request directly to Garage for 15 minutes, so a
server-side consumer can fetch its contents using `fetch(document.fileUrl)`.
Responses use `Cache-Control: no-store`; signed URLs are not logged. Missing or
soft-deleted documents return `404`.

Like the current projects endpoints, these routes do not yet have session
authentication. Owner authorization is marked as a TODO in the service and must
be connected to session authentication before exposing private files publicly.

## Errors and tests

Errors use the application's existing structured response format.

| Status | Code | Cause |
| --- | --- | --- |
| 400 | `FILE_REQUIRED` | No file was supplied. |
| 400 | `EMPTY_FILE` | The file contains no bytes. |
| 400 | `VALIDATION_ERROR` | Missing or invalid upload metadata. |
| 400 | `BAD_REQUEST` | Malformed multipart data, duplicate fields, or multiple files. |
| 413 | `FILE_TOO_LARGE` | The file exceeds 25 MB. |
| 415 | `UNSUPPORTED_FILE_TYPE` | The extension and MIME type are not an approved pair. |
| 415 | `UNSUPPORTED_MEDIA_TYPE` | The request is not multipart. |
| 404 | `NOT_FOUND` | The project or document does not exist. |
| 502 | `STORAGE_ERROR` | Uploading or URL signing failed. |
| 500 | `INTERNAL_SERVER_ERROR` | Saving the document failed. |

HTTP tests exercise the real multipart parser, controller, service, and repository
with mocked S3 requests, URL signing, and Prisma operations:

```sh
npm test -- src/features/documents/tests/documents.routes.test.ts
```
