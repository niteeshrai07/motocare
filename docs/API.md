### GET /admin/dashboard

Returns aggregated statistics for the entire platform.

#### Response (200 OK)

```json
{
  "success": true,
  "message": "Dashboard overview fetched successfully",
  "data": {
    "overview": {
      "totalUsers": 0,
      "totalCustomers": 0,
      "totalMechanics": 0,
      "totalAdmins": 0,
      "totalRepairShops": 0,
      "pendingShops": 0,
      "verifiedShops": 0,
      "rejectedShops": 0,
      "totalServiceRequests": 0,
      "pendingRequests": 0,
      "quotedRequests": 0,
      "acceptedRequests": 0,
      "inProgressRequests": 0,
      "completedRequests": 0,
      "rejectedRequests": 0,
      "cancelledRequests": 0,
      "expiredRequests": 0,
      "totalReviews": 0,
      "averagePlatformRating": 0
    },
    "statistics": {
      "usersByRole": { "customer": 0, "mechanic": 0, "admin": 0 },
      "shopsByStatus": { "pending": 0, "verified": 0, "rejected": 0 },
      "requestsByStatus": {
        "pending": 0, "quoted": 0, "accepted": 0,
        "in_progress": 0, "completed": 0, "rejected": 0,
        "cancelled": 0, "expired": 0
      },
      "averagePlatformRating": 0,
      "totalReviews": 0
    }
  },
  "errors": null
}
averagePlatformRating is rounded to 2 decimal places. If no reviews exist, it defaults to 0.

GET /admin/users
Lists all users with optional filtering and search.

Query Parameters
Parameter	Type	Required	Validation	Default
role	String	No	customer, mechanic, admin	—
search	String	No	Max 100 chars, trimmed	—
page	Integer	No	Min 1	1
limit	Integer	No	1–100	20
sort	String	No	newest, oldest	newest
Search performs a case-insensitive regex match on name, email, and phone.

Response (200 OK)
{
  "success": true,
  "message": "Users fetched successfully",
  "data": {
    "users": [
      { "id", "name", "email", "phone", "role", "createdAt", "updatedAt" }
    ],
    "pagination": { "page": 1, "limit": 20, "total": 0, "totalPages": 0 }
  },
  "errors": null
}
Note: Passwords are excluded from all responses via the mapper.

GET /admin/users/:id
Fetches a single user by ID.

Path Parameters
Parameter	Type	Validation
id	String	Valid MongoDB ObjectId
Response (200 OK)
{
  "success": true,
  "message": "User fetched successfully",
  "data": {
    "user": { "id", "name", "email", "phone", "role", "createdAt", "updatedAt" }
  },
  "errors": null
}
Error Responses
404 Not Found — User not found
GET /admin/repair-shops
Lists all repair shops with optional filtering and search.

Query Parameters
Parameter	Type	Required	Validation	Default
status	String	No	pending, verified, rejected	—
search	String	No	Max 100 chars, trimmed	—
page	Integer	No	Min 1	1
limit	Integer	No	1–50	20
sort	String	No	newest, oldest	newest
Search performs a case-insensitive regex match on shopName and address. The ownerId field is populated with name and email.

Response (200 OK)
{
  "success": true,
  "message": "Repair shops fetched successfully",
  "data": {
    "repairShops": [
      {
        "id", "shopName", "status", "rating", "totalReviews",
        "owner": { "id", "name", "email" },
        "createdAt", "updatedAt"
      }
    ],
    "pagination": { "page": 1, "limit": 20, "total": 0, "totalPages": 0 }
  },
  "errors": null
}
GET /admin/repair-shops/:id
Fetches a single repair shop by ID with full owner details.

Path Parameters
Parameter	Type	Validation
id	String	Valid MongoDB ObjectId
Response (200 OK)
{
  "success": true,
  "message": "Repair shop fetched successfully",
  "data": {
    "repairShop": {
      "id", "shopName", "status", "rating", "totalReviews",
      "owner": { "id", "name", "email", "phone" },
      "createdAt", "updatedAt"
    }
  },
  "errors": null
}
Error Responses
404 Not Found — Repair shop not found
PATCH /admin/repair-shops/:id/verify
Verifies a repair shop (sets status to verified).

Authentication: Required
Allowed roles: admin
Side effect: Creates a shop_verified notification for the shop owner.
Path Parameters
Parameter	Type	Validation
id	String	Valid MongoDB ObjectId
Request Body
None.

Response (200 OK)
{
  "success": true,
  "message": "Repair shop verified successfully",
  "data": {
    "repairShop": {
      "id", "shopName", "status", "rating", "totalReviews",
      "owner": { "id", "name", "email" },
      "createdAt", "updatedAt"
    }
  },
  "errors": null
}
Error Responses
404 Not Found — Repair shop not found
PATCH /admin/repair-shops/:id/reject
Rejects a repair shop (sets status to rejected).

Authentication: Required
Allowed roles: admin
Side effect: Creates a shop_rejected notification for the shop owner.
Path Parameters
Parameter	Type	Validation
id	String	Valid MongoDB ObjectId
Request Body
None.

Response (200 OK)
{
  "success": true,
  "message": "Repair shop rejected successfully",
  "data": {
    "repairShop": {
      "id", "shopName", "status", "rating", "totalReviews",
      "owner": { "id", "name", "email" },
      "createdAt", "updatedAt"
    }
  },
  "errors": null
}
Error Responses
404 Not Found — Repair shop not found
GET /admin/service-requests
Lists all service requests with optional filtering and search.

Query Parameters
Parameter	Type	Required	Validation	Default
status	String	No	One of 8 statuses	—
search	String	No	Max 100 chars, trimmed	—
page	Integer	No	Min 1	1
limit	Integer	No	1–50	20
sort	String	No	newest, oldest	newest
Search performs a case-insensitive regex match on issueDescription. Results are populated with customer name and shop shopName.

Response (200 OK)
{
  "success": true,
  "message": "Service requests fetched successfully",
  "data": {
    "serviceRequests": [
      {
        "id", "status", "vehicleType",
        "customer": { "id", "name" },
        "shop": { "id", "shopName" },
        "createdAt", "updatedAt"
      }
    ],
    "pagination": { "page": 1, "limit": 20, "total": 0, "totalPages": 0 }
  },
  "errors": null
}
GET /admin/service-requests/:id
Fetches a single service request by ID with full contact information.

Path Parameters
Parameter	Type	Validation
id	String	Valid MongoDB ObjectId
Response (200 OK)
{
  "success": true,
  "message": "Service request fetched successfully",
  "data": {
    "serviceRequest": {
      "id", "vehicleType", "issueDescription", "location", "status",
      "estimatedCost", "estimatedDuration", "mechanicNotes", "expiresAt",
      "customer": { "id", "name", "email", "phone" },
      "shop": { "id", "shopName", "phone", "ownerId", "status" },
      "createdAt", "updatedAt"
    }
  },
  "errors": null
}
The admin view always includes full contact information (phone) regardless of status.

Error Responses
404 Not Found — Service request not found
GET /admin/reviews
Lists all reviews with optional search and sorting.

Query Parameters
Parameter	Type	Required	Validation	Default
search	String	No	Max 100 chars, trimmed	—
page	Integer	No	Min 1	1
limit	Integer	No	1–50	20
sort	String	No	newest, oldest, highest, lowest	newest
Search performs a case-insensitive regex match on comment. Results are populated with customer name and shop shopName.

Response (200 OK)
{
  "success": true,
  "message": "Reviews fetched successfully",
  "data": {
    "reviews": [
      {
        "id", "rating", "comment",
        "customer": { "id", "name" },
        "shop": { "id", "shopName" },
        "createdAt", "updatedAt"
      }
    ],
    "pagination": { "page": 1, "limit": 20, "total": 0, "totalPages": 0 }
  },
  "errors": null
}
GET /admin/reviews/:id
Fetches a single review by ID with full contact information.

Path Parameters
Parameter	Type	Validation
id	String	Valid MongoDB ObjectId
Response (200 OK)
{
  "success": true,
  "message": "Review fetched successfully",
  "data": {
    "review": {
      "id", "rating", "comment",
      "customer": { "id", "name", "email", "phone" },
      "shop": { "id", "shopName", "phone", "ownerId", "status" },
      "createdAt", "updatedAt"
    }
  },
  "errors": null
}
Error Responses
404 Not Found — Review not found
7. Profile
Base path: /api/v1/profile

All endpoints require authentication. The ensureActiveUser middleware blocks deactivated users before the controller is reached.

GET /profile
Returns the authenticated user's profile. For mechanics, includes a summary of their repair shop (if one exists).

Authentication: Required
Allowed roles: All authenticated, active users
Response (200 OK)
{
  "success": true,
  "message": "Profile fetched successfully",
  "data": {
    "profile": {
      "id", "name", "email", "phone", "role",
      "createdAt", "updatedAt",
      "repairShop": null
    }
  },
  "errors": null
}
For mechanics with a shop:

{
  "data": {
    "profile": {
      "id", "name", "email", "phone", "role": "mechanic",
      "createdAt", "updatedAt",
      "repairShop": {
        "id", "shopName", "status"
      }
    }
  }
}
Notes:

Password is never included in the response.
repairShop is null for customers, admins, and mechanics without a shop.
For mechanics, repairShop contains only id, shopName, and status.
Error Responses
401 Unauthorized — Token missing, invalid, expired, or user deleted between auth and controller
403 Forbidden — Deactivated account
PATCH /profile
Updates the authenticated user's name and/or phone.

Authentication: Required
Allowed roles: All authenticated, active users
Protected fields: email, password, role, isActive cannot be modified through this endpoint. Unknown fields are rejected.
Request Body (all fields optional)
Field	Type	Required	Validation
name	String	No	1–100 characters, trimmed
phone	String	No	Valid 10-digit Indian mobile, normalized to canonical form
Any fields other than name and phone in the request body cause a 400 validation error.

Response (200 OK)
{
  "success": true,
  "message": "Profile updated successfully",
  "data": {
    "profile": {
      "id", "name", "email", "phone", "role",
      "createdAt", "updatedAt",
      "repairShop": { "id", "shopName", "status" }   // for mechanics with a shop
    }
  },
  "errors": null
}
The repairShop summary is included for mechanics (matching GET /profile). The response always reflects the post-update state.

Error Responses
400 Bad Request — Validation failure (invalid name length, invalid phone format, unknown fields)
401 Unauthorized — Token issues
403 Forbidden — Deactivated account
Database Verification
Updated fields (name, phone) are persisted to MongoDB.
email, role, and isActive remain unchanged.
Phone is stored in canonical form (no +91 prefix, no spaces/hyphens).
PATCH /profile/password
Changes the authenticated user's password.

Authentication: Required
Allowed roles: All authenticated, active users
Protected fields: currentPassword and newPassword only. Any other fields in the request body cause a 400 validation error.
Request Body
Field	Type	Required	Validation
currentPassword	String	Yes	Non-empty
newPassword	String	Yes	Minimum 6 characters; must differ from currentPassword
Response (200 OK)
{
  "success": true,
  "message": "Password changed successfully",
  "data": null,
  "errors": null
}
The response contains no user data. Password is not returned.

Error Responses
400 Bad Request — Validation failure:
currentPassword is required
newPassword is required
newPassword must be at least 6 characters
newPassword must be different from currentPassword
Validation failed (unknown fields in body)
401 Unauthorized — Current password is incorrect (wrong currentPassword)
401 / 403 — Token or activation issues
Database Verification
The password hash is updated via the pre('save') hook (bcrypt, 10 rounds).
All other user fields (name, email, phone, role, isActive) remain unchanged.
PATCH /profile/deactivate
Deactivates the authenticated user's account (soft delete).

Authentication: Required
Allowed roles: All authenticated, active users
Behavior: Sets isActive to false and saves. The user document is not deleted. After deactivation, the JWT remains cryptographically valid but is rejected by ensureActiveUser on all subsequent authenticated requests.
Request Body
None.

Response (200 OK)
{
  "success": true,
  "message": "Account deactivated successfully",
  "data": null,
  "errors": null,
}
Error Responses
401 Unauthorized — Token missing, invalid, expired, or user not found
403 Forbidden — Your account has been deactivated (from ensureActiveUser middleware; applies to already-deactivated accounts attempting to re-deactivate)
404 Not Found — User not found (race condition: user deleted between token verification and controller)
Post-Deactivation Behavior
Action	Result
Login (POST /auth/login)	Still succeeds (login does not check isActive)
GET /profile	403 Forbidden
PATCH /profile	403 Forbidden
PATCH /profile/password	403 Forbidden
PATCH /profile/deactivate	403 Forbidden (from ensureActiveUser)
Any other protected endpoint	403 Forbidden
Public endpoints (GET /, GET /repair-shops/nearby)	Still accessible
Business Notes
The pre('save') hook skips password re-hashing when only isActive changes (since isModified('password') returns false).
A redundant if (!user.isActive) check exists in the controller returning 409, but is unreachable via the API because ensureActiveUser blocks deactivated users first (returns 403).
Common Query Parameters
These parameters are reused across multiple endpoints.

page
Type: Integer
Minimum: 1
Default: 1
Description: Page number for paginated results.
Used by: All list endpoints (notifications, service requests, reviews, admin listings, nearby shops)
limit
Type: Integer
Minimum: 1
Maximum: Varies by endpoint (20 default, 50–100 max)
Default: 20
Description: Number of results per page.
Used by: Same as page
sort
Type: String (enum, varies by endpoint)
Default: newest
Descriptions:
Most endpoints: newest or oldest (sort by createdAt)
Shop reviews: newest, highest, lowest (sort by rating)
Admin reviews: newest, oldest, highest, lowest
Used by: Notification list, service request list, shop reviews, admin listings
status
Type: String (enum, varies by context)
Description: Filter by status.
Used by:
Repair shops: pending, verified, rejected
Service requests: pending, quoted, accepted, in_progress, completed, rejected, cancelled, expired
Admin listings: same enums as above
search
Type: String
Max length: 100 characters
Description: Case-insensitive regex search on relevant fields (name, email, phone, shop name, address, issue description, comment).
Used by: Admin user, repair shop, service request, and review listings
unreadOnly
Type: Boolean
Default: false
Description: When true, returns only unread notifications.
Used by: GET /notifications
archived
Type: Boolean
Default: false
Description: When true, returns only archived notifications.
Used by: GET /notifications
Error Codes
Status Code	Meaning	Typical Cause
200	OK	Successful GET, PATCH, DELETE
201	Created	Successful POST (registration, shop creation, service request creation, review creation)
400	Bad Request	Validation failure, empty fields, invalid data, no valid fields provided
401	Unauthorized	Missing, invalid, or expired JWT; user deleted after token issuance
403	Forbidden	Deactivated account, insufficient role, ownership violation
404	Not Found	Resource not found (shop, service request, review, notification, user)
409	Conflict	Duplicate resource (email, shop, review), invalid status transition, active request exists
500	Internal Server Error	Unexpected server error (logged server-side)
Authorization Matrix
Endpoint Group	Guest	Customer	Mechanic	Admin
Authentication				
POST /auth/register	✅	—	—	—
POST /auth/login	✅	✅	✅	✅
GET /auth/me	❌	✅	✅	✅
Repair Shops				
POST /repair-shops	❌	❌	✅	❌
GET /repair-shops/me	❌	❌	✅	❌
PATCH /repair-shops/me	❌	❌	✅	❌
GET /repair-shops/nearby	✅	✅	✅	✅
GET /repair-shops/:id	✅	✅	✅	✅
GET /repair-shops/:shopId/reviews	✅	✅	✅	✅
PATCH /repair-shops/:id/verify	❌	❌	❌	✅
GET /repair-shops	❌	❌	❌	✅
Service Requests				
POST /service-requests	❌	✅	❌	❌
GET /service-requests/my	❌	✅	❌	❌
GET /service-requests/shop	❌	❌	✅	❌
GET /service-requests/:id	❌	✅	✅	✅
PATCH /service-requests/:id/accept	❌	✅	❌	❌
PATCH /service-requests/:id/cancel	❌	✅	❌	❌
PATCH /service-requests/:id/quote	❌	❌	✅	❌
PATCH /service-requests/:id/reject	❌	❌	✅	❌
PATCH /service-requests/:id/start	❌	❌	✅	❌
PATCH /service-requests/:id/complete	❌	❌	✅	❌
POST /service-requests/:id/review	❌	✅	❌	❌
GET /service-requests/:id/review	❌	✅	✅	✅
PATCH /service-requests/:id/review	❌	✅¹	✅¹	✅¹
DELETE /service-requests/:id/review	❌	✅¹	✅¹	✅¹
Notifications				
GET /notifications	❌	✅	✅	✅
GET /notifications/:id	❌	✅	✅	✅
PATCH /notifications/:id/read	❌	✅	✅	✅
PATCH /notifications/read-all	❌	✅	✅	✅
DELETE /notifications/:id	❌	✅	✅	✅
Admin Dashboard				
GET /admin/dashboard	❌	❌	❌	✅
GET /admin/users	❌	❌	❌	✅
GET /admin/users/:id	❌	❌	❌	✅
GET /admin/repair-shops	❌	❌	❌	✅
GET /admin/repair-shops/:id	❌	❌	❌	✅
PATCH /admin/repair-shops/:id/verify	❌	❌	❌	✅
PATCH /admin/repair-shops/:id/reject	❌	❌	❌	✅
GET /admin/service-requests	❌	❌	❌	✅
GET /admin/service-requests/:id	❌	❌	❌	✅
GET /admin/reviews	❌	❌	❌	✅
GET /admin/reviews/:id	❌	❌	❌	✅
Profile				
GET /profile	❌	✅²	✅²	✅²
PATCH /profile	❌	✅²	✅²	✅²
PATCH /profile/password	❌	✅²	✅²	✅²
PATCH /profile/deactivate	❌	✅²	✅²	✅²
Authenticated users can access, but the controller enforces ownership — only the review's customer can update/delete.
Must be an active (non-deactivated) user.
Data Models Overview
User
Field	Type	Notes
name	String	Required
email	String	Required, unique, lowercase
password	String	Required, bcrypt hashed
role	String	customer, mechanic, admin; default customer
phone	String	Required, stored in canonical 10-digit format
isActive	Boolean	Default true; false when deactivated
createdAt	Date	Auto-managed
updatedAt	Date	Auto-managed
RepairShop
Field	Type	Notes
ownerId	ObjectId(User)	Required, unique (one shop per mechanic)
shopName	String	Required, 2–100 chars
vehicleTypesServiced	[String]	Required; two_wheeler, four_wheeler
location	GeoJSON Point	Required; 2dsphere index
address	String	Required, max 300
phone	String	Required, Indian mobile format
description	String	Optional, max 1000
openingHours	String	Optional, max 100
photoUrl	String	Optional, HTTP/HTTPS URL
rating	Number	Default 0, range 0–5
totalReviews	Number	Default 0, min 0
status	String	pending, verified, rejected; default pending
createdAt / updatedAt	Date	Auto-managed
ServiceRequest
Field	Type	Notes
customerId	ObjectId(User)	Required, indexed
shopId	ObjectId(RepairShop)	Required
vehicleType	String	two_wheeler or four_wheeler
issueDescription	String	Required, 5–500 chars
location	GeoJSON Point	Required
status	String	8 statuses; default pending
estimatedCost	Number	Optional, min 0
estimatedDuration	String	Optional, max 50
mechanicNotes	String	Optional, max 500
expiresAt	Date	Required, computed at creation (createdAt + timeout)
Review
Field	Type	Notes
serviceRequestId	ObjectId(ServiceRequest)	Required, unique
customerId	ObjectId(User)	Required, indexed
shopId	ObjectId(RepairShop)	Required, indexed
rating	Integer	Required, 1–5
comment	String	Optional, max 500
Notification
Field	Type	Notes
recipientId	ObjectId(User)	Required, indexed
type	String	Required; enum of 10 types
title	String	Required, max 200
message	String	Required, max 1000
resourceType	String	Optional
resourceId	ObjectId	Optional
metadata	Mixed	Default {}
read	Boolean	Default false
archived	Boolean	Default false
API Version
The API is versioned via URL prefix: /api/v1/.

Current version: v1

No additional versioning strategy (headers, media types) is implemented.

Future API Enhancements
The following are not yet implemented:

OpenAPI / Swagger documentation — no spec file or interactive docs generated
API versioning strategy — only URL-based v1 prefix; no semantic versioning of the API contract
Rate limiting — no request rate limiting or throttling middleware
Email APIs — no email-based password reset, registration confirmation, or notification delivery
Push notification APIs — no mobile push integration; notifications are in-app only
File upload endpoint — no multipart upload support (photoUrl must be a pre-existing URL)
Advanced filtering — search and sort parameters are not consistently available across all list endpoints
Pagination metadata standardization — different endpoints use different limit maximums (50 vs 100)
Webhook support — no external event delivery mechanism
GraphQL endpoint — REST only
Contributing
This project was developed using a structured release workflow:

Feature branch — A new branch is created from main for each module (e.g., profile).
Architecture — Models, controllers, routes, validators, mappers, and middleware are organized following an MVC pattern adapted for an API context.
Implementation — All layers are implemented for a module before the next begins.
Code review — Each module undergoes a thorough review covering logic, security, validation, error handling, and code quality. Findings are fixed before proceeding.
Endpoint testing — Comprehensive positive and negative test cases are executed against every endpoint, verifying HTTP responses, database state, and security properties.
Commit and merge — Changes are committed, merged into main via fast-forward, and pushed to origin.
Tagging — An annotated Git tag (e.g., profile-v1) is created at the release commit and pushed to origin.
Freeze — The feature branch is deleted. The code on main under the tag is considered frozen and released.
License
No license has been specified. ```