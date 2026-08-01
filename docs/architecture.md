# MotoCare Backend Architecture

## Project Overview

MotoCare is a motorcycle repair service platform backend built with Node.js and Express.js. It provides a RESTful API for user authentication, repair shop management, service request lifecycle, reviews and ratings, notifications, and an admin dashboard. The backend uses MongoDB as its database, accessed via Mongoose ODM, and JWT-based authentication for secure API access.

## High-Level Architecture

The backend follows a layered architecture with clear separation of concerns:

- **Routes** — Define HTTP endpoints and map them to controllers via middleware chains.
- **Middleware** — Handle cross-cutting concerns: JWT verification, role-based authorization, input validation, and account status checks.
- **Validators** — Use `express-validator` to define and enforce request payload and parameter constraints.
- **Controllers** — Contain business logic, orchestrate model and utility calls, and return formatted responses.
- **Models** — Mongoose schemas defining data structures and indexes.
- **Mappers** — Transform Mongoose documents into clean API response objects, with role-specific views.
- **Utilities** — Shared helper functions for token generation, notification creation, and rating recalculation.
- **Config** — Database connection setup.

```
Request → Route → Middleware Chain → Controller → Model/Utility → Response
```

## Request Lifecycle

1. An HTTP request arrives at the Express app and is matched to a route by method and path.
2. The route handler executes a chain of middleware:
   - `verifyToken` — Decodes the JWT from the `Authorization: Bearer <token>` header and attaches the user document (minus password) to `req.user`.
   - `authorizeRoles` — Checks that `req.user.role` is in the allowed roles list; returns 403 if not.
   - `ensureActiveUser` — Checks that `req.user.isActive` is `true`; returns 403 if the account is deactivated.
   - Route-specific validator — Validates request body, query, or params using `express-validator` rules.
   - `handleValidationErrors` — Checks `validationResult(req)` and returns a 400 response with field-level errors if validation failed.
3. The controller action executes:
   - Reads input from `req.body`, `req.query`, `req.params`, and `req.user`.
   - Performs business logic (queries, updates, notifications, rating recalculation).
   - Returns a JSON response using the standard response format.
4. Errors are caught with try/catch blocks in every controller action and return a 500 response.

## Folder Structure

```
backend/
├── index.js                    # Server entry point; loads env, connects DB, starts Express
├── app.js                      # Express app setup; middleware registration and route mounting
├── package.json                # Dependencies and scripts
├── .env                        # Environment variables (PORT, MONGO_URI, JWT_SECRET, JWT_EXPIRES_IN)
├── config/
│   └── db.js                   # MongoDB connection via Mongoose
├── controllers/
│   ├── auth.controller.js      # Registration, login, current user retrieval
│   ├── admin.controller.js     # Dashboard, user/shop/request/review management
│   ├── notification.controller.js # Notification CRUD for authenticated users
│   ├── profile.controller.js   # Profile read/update, password change, account deactivation
│   ├── repairShop.controller.js # Shop CRUD, nearby search, verification, reviews
│   └── serviceRequest.controller.js # Request lifecycle, quoting, review management
├── models/
│   ├── user.model.js           # User schema (name, email, password, role, phone, isActive)
│   ├── repairShop.model.js     # Repair shop schema (ownerId, location, status, rating)
│   ├── serviceRequest.model.js # Service request schema (customerId, shopId, status, expiresAt)
│   ├── review.model.js         # Review schema (serviceRequestId, customerId, shopId, rating)
│   ├── notification.model.js   # Notification schema (recipientId, type, read, archived)
│   └── shared/
│       └── geoPoint.schema.js  # Reusable GeoJSON Point sub-schema
├── routes/
│   ├── auth.routes.js          # /api/v1/auth
│   ├── admin.routes.js         # /api/v1/admin
│   ├── notification.routes.js  # /api/v1/notifications
│   ├── profile.routes.js       # /api/v1/profile
│   ├── repairShop.routes.js    # /api/v1/repair-shops
│   └── serviceRequest.routes.js # /api/v1/service-requests
├── middleware/
│   ├── auth.middleware.js      # verifyToken, authorizeRoles
│   ├── validation.middleware.js # handleValidationErrors
│   └── account.middleware.js   # ensureActiveUser
├── validators/
│   ├── auth.validator.js       # Registration and login validation rules
│   ├── admin.validator.js      # Admin endpoint query/param validation rules
│   ├── common.validator.js     # Shared phone number validator (Indian mobile format)
│   ├── notification.validator.js # Notification list/get validation rules
│   ├── profile.validator.js    # Profile update and password change validation
│   ├── repairShop.validator.js # Repair shop CRUD and review list validation
│   └── serviceRequest.validator.js # Service request lifecycle and review validation
├── mappers/
│   ├── user.mapper.js          # buildUserResponse
│   ├── admin.mapper.js         # Admin-specific list/detail response builders
│   ├── repairShop.mapper.js    # Public, mechanic, and admin shop response builders
│   ├── serviceRequest.mapper.js # Service request response builders (with/without contact)
│   ├── review.mapper.js        # Review response and list item builders
│   ├── notification.mapper.js  # buildNotificationResponse
│   └── profile.mapper.js       # buildProfileResponse
└── utils/
    ├── token.util.js           # JWT token generation
    ├── notification.util.js    # Notification creation helper
    └── rating.util.js          # Shop rating recalculation from reviews
```

## Controllers

### auth.controller.js
- `register` — Creates a new user, hashes password with bcrypt, generates JWT, returns user + token.
- `login` — Authenticates user by email/password, compares password with bcrypt, generates JWT.
- `getCurrentUser` — Returns the authenticated user's profile from `req.user`.

### admin.controller.js
- `getDashboard` — Aggregates counts and statistics across users, shops, service requests, and reviews.
- `getAllUsers` — Paginated, filterable, sortable user list for admins.
- `getUserById` — Fetches a single user by ID.
- `getAllRepairShops` — Paginated, filterable, sortable repair shop list.
- `getRepairShopDetail` — Fetches a single shop with owner populated.
- `verifyRepairShop` — Updates shop status to `verified`.
- `rejectRepairShop` — Updates shop status to `rejected`.
- `getAllServiceRequests` — Paginated, filterable, sortable service request list.
- `getServiceRequestDetail` — Fetches a single request with customer and shop populated.
- `getAllReviews` — Paginated, filterable, sortable review list.
- `getReviewDetail` — Fetches a single review with customer and shop populated.

### notification.controller.js
- `getMyNotifications` — Lists notifications for the authenticated user with pagination, unread filter, and archive filter.
- `getNotificationById` — Fetches a single notification, scoped to the authenticated user.
- `markAsRead` — Marks a notification as read, scoped to the authenticated user.
- `markAllAsRead` — Marks all unread, non-archived notifications as read.
- `archiveNotification` — Archives a notification, scoped to the authenticated user.

### profile.controller.js
- `getMyProfile` — Returns the authenticated user's profile with their repair shop (if mechanic).
- `updateMyProfile` — Updates name and/or phone for the authenticated user.
- `changePassword` — Changes password after verifying the current password.
- `deactivateAccount` — Sets `isActive` to `false` for the authenticated user.

### repairShop.controller.js
- `createRepairShop` — Creates a new shop for the authenticated mechanic (one shop per mechanic enforced).
- `getMyRepairShop` — Fetches the authenticated mechanic's shop.
- `updateMyRepairShop` — Updates shop details; triggers re-verification if key fields changed.
- `getNearbyRepairShops` — Geospatial query for verified shops near a coordinate.
- `getRepairShopById` — Fetches a verified shop by ID.
- `listRepairShops` — Admin paginated list of shops.
- `verifyRepairShop` — Delegates to `performShopStatusUpdate` with `verified`.
- `performShopStatusUpdate` — Shared function that updates status and sends a notification to the shop owner.
- `listShopReviews` — Lists reviews for a specific verified shop.

### serviceRequest.controller.js
- `createServiceRequest` — Creates a request for a verified shop; validates vehicle type, prevents duplicates.
- `quoteServiceRequest` — Mechanic quotes on a pending request.
- `rejectServiceRequest` — Mechanic rejects a pending request.
- `acceptServiceRequest` — Customer accepts a quote.
- `cancelServiceRequest` — Customer cancels a pending or quoted request.
- `startServiceRequest` — Mechanic marks an accepted request as in progress.
- `completeServiceRequest` — Mechanic marks an in-progress request as completed.
- `getMyServiceRequests` — Lists requests for the authenticated customer.
- `getShopServiceRequests` — Lists requests for the authenticated mechanic's shop.
- `getServiceRequestById` — Fetches a request with access control (customer, mechanic owner, or admin).
- `createReview` — Customer creates a review for a completed request; recalculates shop rating.
- `getReview` — Fetches a review for a service request with access control.
- `updateReview` — Customer updates their review; recalculates shop rating.
- `deleteReview` — Customer deletes their review; recalculates shop rating.

## Models

### User (`models/user.model.js`)
- **Fields**: `name` (String, required), `email` (String, required, unique, lowercase), `password` (String, required, min 6 chars), `role` (enum: `customer`, `mechanic`, `admin`, default `customer`), `phone` (String, required), `isActive` (Boolean, default `true`).
- **Indexes**: Unique index on `email`.
- **Hooks**: Pre-save hook hashes password with bcrypt (10 salt rounds) only when modified.
- **Methods**: `comparePassword(candidatePassword)` — compares a plaintext password against the hash.

### RepairShop (`models/repairShop.model.js`)
- **Fields**: `ownerId` (ObjectId ref User, required, unique), `shopName` (String, required, 2–100 chars), `vehicleTypesServiced` (String array, enum `two_wheeler`/`four_wheeler`, required), `location` (GeoJSON Point, required), `address` (String, required, max 300), `phone` (String, required), `description` (String, optional), `openingHours` (String, optional), `photoUrl` (String, optional, URL format), `rating` (Number, default 0, min 0 max 5), `totalReviews` (Number, default 0), `status` (enum: `pending`, `verified`, `rejected`, default `pending`).
- **Indexes**: 2dsphere index on `location`, unique index on `ownerId`, index on `status`.

### ServiceRequest (`models/serviceRequest.model.js`)
- **Fields**: `customerId` (ObjectId ref User, required), `shopId` (ObjectId ref RepairShop, required), `vehicleType` (enum `two_wheeler`/`four_wheeler`, required), `issueDescription` (String, required, 5–500 chars), `location` (GeoJSON Point, required), `status` (enum: `pending`, `quoted`, `accepted`, `in_progress`, `completed`, `rejected`, `cancelled`, `expired`, default `pending`), `estimatedCost` (Number, optional), `estimatedDuration` (String, optional, max 50), `mechanicNotes` (String, optional, max 500), `expiresAt` (Date, required, set at creation time).
- **Indexes**: Compound index on `shopId` + `status`, index on `customerId`.
- **Note**: `expiresAt` is computed at creation time (current time + configured timeout). Lazy expiration is checked on read.

### Review (`models/review.model.js`)
- **Fields**: `serviceRequestId` (ObjectId ref ServiceRequest, required, unique), `customerId` (ObjectId ref User, required), `shopId` (ObjectId ref RepairShop, required), `rating` (Number, required, 1–5), `comment` (String, optional, max 500).
- **Indexes**: Unique index on `serviceRequestId`, index on `shopId`, index on `customerId`.

### Notification (`models/notification.model.js`)
- **Fields**: `recipientId` (ObjectId ref User, required), `type` (String, enum of 11 notification types, required), `title` (String, required, max 200), `message` (String, required, max 1000), `resourceType` (String, optional), `resourceId` (ObjectId, optional), `metadata` (Mixed, default `{}`), `read` (Boolean, default `false`), `archived` (Boolean, default `false`).
- **Indexes**: Compound indexes on `recipientId` + `createdAt`, `recipientId` + `read` + `createdAt`, `recipientId` + `archived` + `createdAt`.

### GeoPoint Schema (`models/shared/geoPoint.schema.js`)
- Reusable sub-schema for GeoJSON Point coordinates.
- **Fields**: `type` (String, enum `Point`, default `Point`), `coordinates` (Array of 2 Numbers, required, validated for longitude [-180, 180] and latitude [-90, 90]).
- Used by `RepairShop` and `ServiceRequest` models.

## Routes

All routes are mounted under `/api/v1` in `app.js`.

| Prefix | Route File | Description |
|---|---|---|
| `/api/v1/auth` | `auth.routes.js` | Registration, login, current user |
| `/api/v1/repair-shops` | `repairShop.routes.js` | Shop CRUD, nearby search, verification, reviews |
| `/api/v1/service-requests` | `serviceRequest.routes.js` | Full request lifecycle, quoting, reviews |
| `/api/v1/notifications` | `notification.routes.js` | Notification CRUD for authenticated users |
| `/api/v1/admin` | `admin.routes.js` | Dashboard, user/shop/request/review management |
| `/api/v1/profile` | `profile.routes.js` | Profile read/update, password change, deactivation |

**Route ordering note**: In `repairShop.routes.js`, `PATCH /:id/verify` is registered before `GET /:id` to ensure admin verification routes take precedence over the public shop detail route.

## Middleware

### auth.middleware.js
- `verifyToken` — Extracts JWT from `Authorization: Bearer <token>` header, verifies it with `JWT_SECRET`, attaches the user document (with password excluded) to `req.user`. Returns 401 on missing/invalid/expired tokens or if the user no longer exists.
- `authorizeRoles(...allowedRoles)` — Higher-order function that returns a middleware checking `req.user.role` against the allowed roles. Returns 403 if unauthorized.

### validation.middleware.js
- `handleValidationErrors` — Uses `express-validator`'s `validationResult` to check for validation errors. Returns 400 with field-level error details if any exist; otherwise calls `next()`.

### account.middleware.js
- `ensureActiveUser` — Checks `req.user.isActive`. Returns 403 if the account is deactivated. Used on profile routes.

## Validators

Validators use `express-validator` and are defined as arrays of validation chains. They are applied in the route middleware chain before the controller.

| Validator File | Validators |
|---|---|
| `auth.validator.js` | `registerValidator`, `loginValidator` |
| `admin.validator.js` | `listUsersValidator`, `getUserIdValidator`, `listRepairShopsValidator`, `getRepairShopIdValidator`, `listServiceRequestsValidator`, `getServiceRequestIdValidator`, `listReviewsValidator`, `getReviewIdValidator` |
| `common.validator.js` | `phoneValidator` — Validates Indian mobile numbers (optional `+91` prefix), normalizes to canonical 10-digit format |
| `notification.validator.js` | `listNotificationsValidator`, `getNotificationByIdValidator` |
| `profile.validator.js` | `updateProfileValidator`, `changePasswordValidator` |
| `repairShop.validator.js` | `createRepairShopValidator`, `updateRepairShopValidator`, `nearbyShopsValidator`, `getRepairShopByIdValidator`, `getShopIdValidator`, `listRepairShopsValidator`, `verifyRepairShopStatusValidator`, `listShopReviewsValidator` |
| `serviceRequest.validator.js` | `getServiceRequestByIdValidator`, `createServiceRequestValidator`, `quoteServiceRequestValidator`, `rejectServiceRequestValidator`, `acceptServiceRequestValidator`, `cancelServiceRequestValidator`, `startServiceRequestValidator`, `completeServiceRequestValidator`, `listServiceRequestsValidator`, `createReviewValidator`, `updateReviewValidator` |

## Mappers

Mappers transform Mongoose documents into clean API response objects. They provide role-specific views of the same underlying data.

| Mapper File | Functions |
|---|---|
| `user.mapper.js` | `buildUserResponse` — Public user profile (id, name, email, phone, role) |
| `admin.mapper.js` | `buildAdminUserListItem`, `buildAdminUserDetail`, `buildAdminRepairShopListItem`, `buildAdminRepairShopDetail`, `buildAdminServiceRequestListItem`, `buildAdminReviewListItem` |
| `repairShop.mapper.js` | `buildPublicRepairShopResponse` — Public view (no status, no owner), `buildMechanicRepairShopResponse` — Adds status and timestamps, `buildAdminRepairShopResponse` — Adds owner info |
| `serviceRequest.mapper.js` | `buildServiceRequestResponse` — Hides contact info, `buildServiceRequestResponseWithContact` — Includes customer/shop phone (for accepted/in_progress/completed) |
| `review.mapper.js` | `buildReviewResponse` — Full review with populated customer/shop, `buildReviewListItem` — List view without serviceRequestId |
| `notification.mapper.js` | `buildNotificationResponse` — Notification with all fields |
| `profile.mapper.js` | `buildProfileResponse` — User profile with nested repair shop summary |

## Utilities

### token.util.js
- `generateToken(userId)` — Signs a JWT with `{ id: userId }` using `JWT_SECRET` and `JWT_EXPIRES_IN` from environment variables.

### notification.util.js
- `createNotification({ recipientId, type, title, message, resourceType, resourceId, metadata })` — Creates a notification document. Errors are caught and logged; the function returns `null` on failure rather than throwing.

### rating.util.js
- `recalculateculateShopRating(shopId)` — Aggregates all reviews for a shop, computes the average rating (rounded to 2 decimal places) and total count, then updates the shop document.
- `roundRating(value)` — Rounds a rating to 2 decimal places.

## Authentication Flow

1. **Registration** — `POST /api/v1/auth/register` accepts `name`, `email`, `password`, `phone`, `role`. The password is hashed with bcrypt (10 salt rounds) in the pre-save hook. A JWT token is generated and returned alongside the user object.
2. **Login** — `POST /api/v1/auth/login` accepts `email` and `password`. The user is looked up by email, and `comparePassword` verifies the plaintext password against the bcrypt hash. On success, a JWT token is returned.
3. **Token Verification** — Subsequent requests include `Authorization: Bearer <token>`. The `verifyToken` middleware decodes the JWT, looks up the user by ID (excluding password), and attaches the user to `req.user`.
4. **Role-Based Authorization** — The `authorizeRoles` middleware restricts endpoints to specific roles (e.g., `customer`, `mechanic`, `admin`).
5. **Account Status Check** — The `ensureActiveUser` middleware prevents deactivated users from accessing profile endpoints.

## Error Handling

Every controller action wraps its logic in a try/catch block. Errors are logged to the console and a JSON error response is returned.

**Standard response format:**

Success:
```json
{
  "success": true,
  "message": "Operation succeeded",
  "data": { ... },
  "errors": null
}
```

Error:
```json
{
  "success": false,
  "message": "Error description",
  "data": null,
  "errors": null
}
```

**HTTP status codes used:**
- `200` — Successful GET/PATCH
- `201` — Successful POST (creation)
- `400` — Validation failure
- `401` — Missing or invalid/expired token
- `403` — Insufficient permissions or deactivated account
- `404` — Resource not found
- `409` — Conflict (duplicate email, duplicate shop, duplicate review, invalid state transition)
- `500` — Internal server error

**Validation errors** return a specialized format:
```json
{
  "success": false,
  "message": "Validation failed",
  "data": null,
  "errors": [
    { "field": "email", "message": "Please enter a valid email address" }
  ]
}
```

## Response Format

All API responses follow a consistent envelope structure:

- `success` — Boolean indicating success or failure.
- `message` — Human-readable description of the result.
- `data` — The response payload (object, array, or `null`).
- `errors` — Always `null` on success; contains validation error array or `null` on failure.

Paginated list responses include a `pagination` object with `page`, `limit`, `total`, and `totalPages`. Some responses also include `unreadCount` for notification endpoints.

## Security Architecture

- **JWT Authentication** — Tokens are signed with a secret key (`JWT_SECRET`) and expire after a configurable duration (`JWT_EXPIRES_IN`, default 7 days). Tokens are transmitted via the `Authorization` header.
- **Password Hashing** — Passwords are hashed with bcrypt (10 salt rounds) before storage. The `comparePassword` instance method is used for login verification.
- **Role-Based Access Control (RBAC)** — The `authorizeRoles` middleware enforces that only users with the correct role can access specific endpoints.
- **Account Status** — The `ensureActiveUser` middleware blocks deactivated accounts from accessing profile endpoints.
- **Input Validation** — All request inputs are validated with `express-validator` before reaching controller logic, preventing invalid or malicious data from entering the system.
- **Phone Number Sanitization** — The shared `phoneValidator` normalizes Indian mobile numbers by stripping spaces/hyphens and removing the `+91` prefix, storing them in canonical 10-digit format.
- **Email Validation** — Email addresses are validated with a regex pattern and stored in lowercase.
- **GeoJSON Coordinate Validation** — Coordinates are validated for correct range (longitude [-180, 180], latitude [-90, 90]).
- **CORS** — Enabled via the `cors` middleware for cross-origin requests.
- **MongoDB Injection Prevention** — Mongoose ODM automatically sanitizes queries against MongoDB injection.

## Design Principles

1. **Separation of Concerns** — Each layer (route, middleware, validator, controller, model, mapper, utility) has a single responsibility.
2. **Consistent Response Envelope** — Every endpoint returns the same `{ success, message, data, errors }` structure.
3. **Role-Specific Views via Mappers** — The same underlying data is transformed differently for public, mechanic, and admin consumers through dedicated mapper functions.
4. **Lazy Expiration** — Service requests are not expired at a scheduled time; instead, expiration is checked on read (`applyLazyExpiration`), comparing the current time against `expiresAt` for requests in expirable statuses (`pending`, `quoted`).
5. **Pagination by Default** — All list endpoints support `page` and `limit` query parameters with sensible defaults and caps.
6. **Shared Validation** — Common rules (phone number format, MongoDB ID format) are centralized in `common.validator.js` and reused across validators.
7. **Business Logic in Controllers** — Controllers orchestrate model queries, utility calls, and mapper transformations. There is no service layer; controllers contain the application logic directly.
8. **Explicit Indexes** — Mongoose indexes are defined explicitly in each model schema rather than relying on auto-generated indexes, making indexing decisions visible and reviewable.

## Extensibility

The architecture supports extension through its modular structure:

- **New Routes** — Add a new route file in `routes/`, define the Express router, and mount it in `app.js`.
- **New Controllers** — Add controller functions in `controllers/` following the existing try/catch + standard response pattern.
- **New Models** — Add a new Mongoose schema in `models/`, define explicit indexes, and import it in controllers.
- **New Validators** — Add validation chains in `validators/` and import them in route definitions.
- **New Mappers** — Add mapper functions in `mappers/` to transform documents for specific API consumers.
- **New Middleware** — Add middleware functions in `middleware/` and insert them into route middleware chains.
- **New Utilities** — Add helper functions in `utils/` for cross-cutting concerns shared across controllers.

The middleware chain pattern (`verifyToken → authorizeRoles → validator → handleValidationErrors → controller`) is consistent across all routes and can be extended by inserting additional middleware steps as needed.

## Summary

The MotoCare backend is a role-based REST API for a motorcycle repair marketplace. It authenticates users via JWT, supports three roles (customer, mechanic, admin), and provides full CRUD operations for repair shops, service requests, reviews, and notifications. The architecture emphasizes consistent response formats, input validation, separation of concerns, and secure access control. The data model uses MongoDB with Mongoose, including GeoJSON support for location-based queries and bcrypt for password security.