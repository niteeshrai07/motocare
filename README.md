# MotoCare Backend

A REST API for a vehicle repair service platform. Built with Node.js, Express, and MongoDB.
The API supports user management, repair shop lifecycle, service requests, reviews and
ratings, notifications, an admin dashboard, and user profile management.

---

## Features

### Authentication

- User registration with phone validation (Indian mobile format)
- Login with email and password
- JWT-based stateless authentication
- Password hashing with bcrypt
- Current user endpoint

### Repair Shops

- Mechanics can create one repair shop per account
- Mechanics can view and update their own shop
- Public nearby shop search with geospatial queries (GeoJSON Point, 2dsphere index)
- Public shop detail and shop reviews
- Admin verification and rejection of shops
- Admin listing of all shops with search and pagination

### Service Requests

- Customers can create service requests for a repair shop
- Status lifecycle: `pending` → `quoted` → `accepted` → `in_progress` → `completed`
- Cancellation and expiration (lazy) with configurable timeout
- Customers can accept or cancel their requests
- Mechanics can quote, reject, start, and complete requests
- Ownership-based access control on every request

### Reviews & Ratings

- Customers can review completed service requests
- One review per service request (unique constraint enforced)
- Rating range 1–5 with automatic shop rating recalculation
- Reviews can be viewed, updated, and deleted by the original customer

### Notifications

- In-app notifications for service request events, reviews, and shop status changes
- Filtering by unread and archived state
- Pagination with sort options
- Read and archive operations
- Automatic notifications triggered by service request lifecycle events

### Admin Dashboard

- Aggregate dashboard with user, shop, request, and review counts
- Paginated admin listings for users, repair shops, service requests, and reviews
- Search and sort on all admin list views
- Shop verification and rejection from the admin panel

### Profile

- View own profile (customer, mechanic, or admin)
- Update name and phone
- Change password with current-password verification
- Deactivate account (soft delete via `isActive` flag)
- Deactivated users are blocked from all authenticated endpoints

---

## Technology Stack

### Backend

- Node.js
- Express 5.x

### Database

- MongoDB 7+ (Mongoose ODM 9.x)

### Authentication

- JSON Web Tokens (`jsonwebtoken` 9.x)

### Security

- bcrypt (`bcryptjs` 3.x) — password hashing
- CORS (`cors` 2.x)
- Input validation (`express-validator` 7.x)

### Utilities

- dotenv — environment variable loading

### Development

- nodemon — hot-reload during development

---

## Project Architecture

The backend follows an **MVC (Model-View-Controller)** pattern adapted for an API
context. There are no views; responses are JSON. Additional layers include
**validators**, **middleware**, and **mappers** for clean separation of concerns.

### Components

| Layer | Directory | Responsibility |
|-------|-----------|----------------|
| Models | `models/` | Mongoose schemas and indexes |
| Controllers | `controllers/` | Request handling and business logic |
| Routes | `routes/` | Route definitions and middleware chains |
| Validators | `validators/` | `express-validator` chains per endpoint |
| Middleware | `middleware/` | Auth, authorization, validation error handler |
| Mappers | `mappers/` | Transforms Mongoose documents into safe JSON responses |
| Utilities | `utils/` | Token generation, notifications, rating calculation |
| Config | `config/` | Database connection |

### Request Flow

1. A request enters through `index.js`, which loads environment variables and starts the Express server.
2. `app.js` registers global middleware (`cors`, `express.json`) and mounts all route modules.
3. Each route file defines middleware chains in order: `verifyToken` → `ensureActiveUser` (when authenticated) → role authorization → validators → `handleValidationErrors` → controller.
4. The controller performs business logic, queries models, and returns a response via a mapper.
5. All responses follow the standard envelope: `{ success, message, data, errors }`.

---

## Folder Structure

```
backend/
├── index.js
├── app.js
├── .env
├── package.json
├── config/
│   └── db.js
├── middleware/
│   ├── auth.middleware.js
│   ├── account.middleware.js
│   └── validation.middleware.js
├── models/
│   ├── user.model.js
│   ├── repairShop.model.js
│   ├── serviceRequest.model.js
│   ├── review.model.js
│   ├── notification.model.js
│   └── shared/
│       └── geoPoint.schema.js
├── controllers/
│   ├── auth.controller.js
│   ├── repairShop.controller.js
│   ├── serviceRequest.controller.js
│   ├── notification.controller.js
│   ├── admin.controller.js
│   └── profile.controller.js
├── routes/
│   ├── auth.routes.js
│   ├── repairShop.routes.js
│   ├── serviceRequest.routes.js
│   ├── notification.routes.js
│   ├── admin.routes.js
│   └── profile.routes.js
├── validators/
│   ├── auth.validator.js
│   ├── repairShop.validator.js
│   ├── serviceRequest.validator.js
│   ├── notification.validator.js
│   ├── admin.validator.js
│   ├── profile.validator.js
│   └── common.validator.js
├── mappers/
│   ├── user.mapper.js
│   ├── repairShop.mapper.js
│   ├── serviceRequest.mapper.js
│   ├── review.mapper.js
│   ├── notification.mapper.js
│   ├── admin.mapper.js
│   └── profile.mapper.js
└── utils/
    ├── token.util.js
    ├── notification.util.js
    └── rating.util.js
```

---

## Installation

### Prerequisites

- Node.js 20+
- MongoDB 7+ (running locally or accessible via connection string)

### Setup

```bash
git clone https://github.com/niteeshrai07/motocare.git
cd motocare/backend
npm install
```

### Environment Variables

Create a `.env` file in `backend/` with the following variables:

| Variable | Purpose |
|---|---|
| `PORT` | HTTP port for the Express server (default: `5000`) |
| `MONGO_URI` | MongoDB connection string (e.g. `mongodb://localhost:27017/motocare`) |
| `JWT_SECRET` | Secret key used to sign and verify JWT tokens |
| `JWT_EXPIRES_IN` | JWT expiration duration (e.g. `7d`) |
| `SERVICE_REQUEST_TIMEOUT_MINUTES` | Optional. Overrides the default 60-minute timeout for expirable service requests (`pending` and `quoted` statuses) |

### Running the Server

```bash
npm run dev    # development (with nodemon hot-reload)
npm start      # production
```

---

## API Overview

All endpoints are mounted under the `/api/v1` base path.

### Authentication

| Method | Endpoint | Access |
|--------|----------|--------|
| POST | `/auth/register` | Public |
| POST | `/auth/login` | Public |
| GET | `/auth/me` | Authenticated |

### Repair Shops

| Method | Endpoint | Access |
|--------|----------|--------|
| POST | `/repair-shops` | Mechanic |
| GET | `/repair-shops/me` | Mechanic |
| PATCH | `/repair-shops/me` | Mechanic |
| GET | `/repair-shops/nearby` | Public |
| PATCH | `/repair-shops/:id/verify` | Admin |
| PATCH | `/repair-shops/:id/reject` | Admin |
| GET | `/repair-shops/:shopId/reviews` | Public |
| GET | `/repair-shops/:id` | Public |
| GET | `/repair-shops` | Admin |

### Service Requests

| Method | Endpoint | Access |
|--------|----------|--------|
| POST | `/service-requests` | Customer |
| GET | `/service-requests/my` | Customer |
| GET | `/service-requests/shop` | Mechanic |
| GET | `/service-requests/:id` | Authenticated |
| PATCH | `/service-requests/:id/accept` | Customer |
| PATCH | `/service-requests/:id/cancel` | Customer |
| PATCH | `/service-requests/:id/quote` | Mechanic |
| PATCH | `/service-requests/:id/reject` | Mechanic |
| PATCH | `/service-requests/:id/start` | Mechanic |
| PATCH | `/service-requests/:id/complete` | Mechanic |
| POST | `/service-requests/:id/review` | Customer |
| GET | `/service-requests/:id/review` | Authenticated |
| PATCH | `/service-requests/:id/review` | Authenticated |
| DELETE | `/service-requests/:id/review` | Authenticated |

### Notifications

| Method | Endpoint | Access |
|--------|----------|--------|
| GET | `/notifications` | Authenticated |
| GET | `/notifications/:id` | Authenticated |
| PATCH | `/notifications/:id/read` | Authenticated |
| PATCH | `/notifications/read-all` | Authenticated |
| DELETE | `/notifications/:id` | Authenticated |

### Admin Dashboard

| Method | Endpoint | Access |
|--------|----------|--------|
| GET | `/admin/dashboard` | Admin |
| GET | `/admin/users` | Admin |
| GET | `/admin/users/:id` | Admin |
| GET | `/admin/repair-shops` | Admin |
| GET | `/admin/repair-shops/:id` | Admin |
| PATCH | `/admin/repair-shops/:id/verify` | Admin |
| PATCH | `/admin/repair-shops/:id/reject` | Admin |
| GET | `/admin/service-requests` | Admin |
| GET | `/admin/service-requests/:id` | Admin |
| GET | `/admin/reviews` | Admin |
| GET | `/admin/reviews/:id` | Admin |

### Profile

| Method | Endpoint | Access |
|--------|----------|--------|
| GET | `/profile` | Authenticated |
| PATCH | `/profile` | Authenticated, active |
| PATCH | `/profile/password` | Authenticated, active |
| PATCH | `/profile/deactivate` | Authenticated, active |

---

## Authentication Flow

1. A user registers via `POST /auth/register` with `name`, `email`, `password`, `phone`, and `role`.
2. On login (`POST /auth/login`), the password is compared against the stored bcrypt hash using `bcrypt.compare`.
3. If valid, a JWT is signed with `{ id: userId }` using `JWT_SECRET` and `JWT_EXPIRES_IN`, and returned to the client.
4. The client sends the JWT in the `Authorization: Bearer <token>` header on subsequent requests.
5. `verifyToken` middleware decodes the token, loads the user from the database (excluding the password field), and attaches it to `req.user`.
6. `ensureActiveUser` middleware checks `req.user.isActive`. Deactivated users receive a `403 Forbidden`.
7. `authorizeRoles` middleware (admin and service request routes) checks `req.user.role` against the allowed list.
8. Passwords are hashed automatically via a Mongoose `pre('save')` hook before persistence.

---

## Database Overview

All models use Mongoose with explicit collection names and `versionKey: false`. Every document includes `createdAt` and `updatedAt` via `timestamps: true`.

### User

| Field | Type | Constraints |
|-------|------|-------------|
| `name` | String | Required, trimmed, max 100 |
| `email` | String | Required, lowercase, unique index, regex validation |
| `password` | String | Required, bcrypt hashed (min 6 chars) |
| `role` | String | Required, enum: `customer`, `mechanic`, `admin`, default `customer` |
| `phone` | String | Required, trimmed |
| `isActive` | Boolean | Default `true` |

### RepairShop

| Field | Type | Constraints |
|-------|------|-------------|
| `ownerId` | ObjectId (User) | Required, unique index |
| `shopName` | String | Required, 2–100 chars |
| `vehicleTypesServiced` | [String] | Required, enum `two_wheeler`, `four_wheeler` |
| `location` | GeoJSON Point | Required, 2dsphere index |
| `address` | String | Required, max 300 |
| `phone` | String | Required, Indian mobile format |
| `description` | String | Optional, max 1000 |
| `openingHours` | String | Optional, max 100 |
| `photoUrl` | String | Optional, HTTP/HTTPS validation |
| `rating` | Number | Default 0, 0–5 |
| `totalReviews` | Number | Default 0, min 0 |
| `status` | String | Default `pending`, enum: `pending`, `verified`, `rejected` |

### ServiceRequest

| Field | Type | Constraints |
|-------|------|-------------|
| `customerId` | ObjectId (User) | Required, index |
| `shopId` | ObjectId (RepairShop) | Required |
| `vehicleType` | String | Required, enum `two_wheeler`, `four_wheeler` |
| `issueDescription` | String | Required, 5–500 chars |
| `location` | GeoJSON Point | Required |
| `status` | String | Default `pending`, 8 possible statuses |
| `estimatedCost` | Number | Optional, min 0 |
| `estimatedDuration` | String | Optional, max 50 |
| `mechanicNotes` | String | Optional, max 500 |
| `expiresAt` | Date | Required, computed at creation |

### Review

| Field | Type | Constraints |
|-------|------|-------------|
| `serviceRequestId` | ObjectId (ServiceRequest) | Required, **unique** |
| `customerId` | ObjectId (User) | Required, index |
| `shopId` | ObjectId (RepairShop) | Required, index |
| `rating` | Number | Required, 1–5 |
| `comment` | String | Optional, max 500 |

### Notification

| Field | Type | Constraints |
|-------|------|-------------|
| `recipientId` | ObjectId (User) | Required, compound index |
| `type` | String | Required, enum (11 types) |
| `title` | String | Required, max 200 |
| `message` | String | Required, max 1000 |
| `resourceType` | String | Optional |
| `resourceId` | ObjectId | Optional |
| `metadata` | Mixed | Default `{}` |
| `read` | Boolean | Default `false` |
| `archived` | Boolean | Default `false` |

### Relationships

- **User → RepairShop**: One-to-one (one mechanic can own one shop). `ownerId` references `User._id`.
- **User → ServiceRequest**: One-to-many (a customer creates many requests). `customerId` references `User._id`.
- **RepairShop → ServiceRequest**: One-to-many (a shop receives many requests). `shopId` references `RepairShop._id`.
- **User → Notification**: One-to-many (a user receives many notifications). `recipientId` references `User._id`.
- **ServiceRequest → Review**: One-to-one (each completed request can have one review). `serviceRequestId` references `ServiceRequest._id` with a unique constraint.
- **RepairShop → Review**: One-to-many (a shop has many reviews). `shopId` references `RepairShop._id`.
- **Review → Rating**: Aggregated via `recalculateShopRating()`, which computes the average and count on the RepairShop document.

---

## Security Features

| Feature | Implementation |
|---------|---------------|
| Password hashing | bcrypt via Mongoose `pre('save')` hook (10 salt rounds) |
| JWT authentication | Signed with HS256; verified on every protected route |
| Role authorization | `authorizeRoles` middleware restricts endpoints by role |
| Active account check | `ensureActiveUser` middleware blocks deactivated users with 403 |
| Input validation | `express-validator` chains on all mutating endpoints |
| Mass-assignment prevention | `body().custom()` validator rejects unknown fields in profile and password update |
| Password exclusion from responses | `verifyToken` uses `.select('-password')` to strip password from the loaded user |
| Ownership checks | Service request controllers verify `customerId`, `shopId.ownerId`, or `role: admin` before allowing access |
| Bcrypt comparison | `comparePassword` instance method for login verification |
| Unknown field rejection | Custom validators reject unexpected body fields on profile and password update endpoints |

---

## Response Format

All API responses follow this envelope:

```json
{
  "success": true,
  "message": "Description of the result",
  "data": null,
  "errors": null
}
```

| Field | Type | Description |
|-------|------|-------------|
| `success` | Boolean | Whether the request succeeded |
| `message` | String | Human-readable status message |
| `data` | Object or null | Response payload on success; `null` on failure |
| `errors` | Array or null | Validation errors (`{ field, message }` pairs) or `null` |

Validation errors use HTTP 400 and populate `errors` as an array:

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

---

## Error Handling

| Scenario | HTTP Status | Message Pattern |
|----------|-------------|-----------------|
| Missing JWT | 401 | `Not authorized, token missing` |
| Invalid/expired JWT | 401 | `Not authorized, token invalid or expired` |
| User not found after token decode | 401 | `Not authorized, user no longer exists` |
| Deactivated account | 403 | `Your account has been deactivated` |
| Insufficient role | 403 | `You do not have permission to perform this action` |
| Ownership violation | 403 | `You are not authorized to...` |
| Duplicate email (registration) | 409 | `Email already registered` |
| Duplicate repair shop | 409 | `You already have a repair shop` |
| Duplicate review | 409 | `You have already reviewed this service request` |
| Status transition not allowed | 409 | `This service request cannot be ...` / `This repair shop is not currently verified` |
| Resource not found | 404 | `... not found` |
| No shop for mechanic | 404 | `You have not created a repair shop yet` |
| Validation failure | 400 | `Validation failed` (with `errors` array) |
| Incorrect current password | 400 | `Current password is incorrect` |
| Server error | 500 | `Something went wrong...` |

---

## Completed Modules

| Module | Description | Status | Version Tag |
|--------|-------------|--------|-------------|
| Authentication | Registration, login, JWT, current user | Complete | — |
| Repair Shops | CRUD, search, admin verification | Complete | `repair-shop-v1` |
| Service Requests | Lifecycle, quoting, acceptance, completion, reviews | Complete | `service-request-v1`, `service-request-read-v1` |
| Reviews & Ratings | One review per request, automatic rating recalculation | Complete | `reviews-v1` |
| Notifications | In-app notifications with read/archive | Complete | `notifications-v1` |
| Admin Dashboard | Dashboard stats, user/shop/request/review management | Complete | `admin-dashboard-v1` |
| Profile | View, update, password change, deactivation | Complete | `profile-v1` |

---

## Git Release History

Tags are listed in chronological order (oldest first):

| Tag | Approximate Date | Description |
|-----|------------------|-------------|
| `repair-shop-v1` | 2026-07-25 | Repair shop CRUD, search, admin verification |
| `geo-point-schema-v1` | 2026-07-25 | Shared GeoJSON Point sub-schema |
| `service-request-v1` | 2026-07-26 | Service request lifecycle and actions |
| `service-request-read-v1` | 2026-07-28 | Service request read endpoints |
| `reviews-v1` | 2026-07-29 | Reviews and ratings with auto-recalculation |
| `notifications-v1` | 2026-07-29 | Notifications with read/archive/filtering |
| `admin-dashboard-v1` | 2026-07-30 | Admin dashboard, user/shop/request/review management |
| `profile-v1` | 2026-08-01 | Profile, password change, account deactivation |

---

## Future Enhancements

The following are **not yet implemented**:

- **Email notifications** — notifications are in-app only; no email or SMS delivery
- **Push notifications** — no mobile push integration
- **Docker deployment** — no Dockerfile or docker-compose configuration
- **Automated test suite** — no unit, integration, or end-to-end test framework configured
- **Frontend integration** — backend API only; frontend in separate repository
- **Rate limiting** — no request rate limiting middleware
- **API documentation** — no Swagger/OpenAPI spec generated
- **Password reset flow** — no token-based password reset endpoint
- **File upload** — no support for shop photo or document uploads
- **Caching** — no Redis or in-memory cache layer

---

## Contributing

The project follows a feature-branch release workflow:

1. **Feature branch** — Create a branch from `main` for each module (e.g., `profile`).
2. **Architecture** — Identify models, controllers, routes, validators, and mappers in the MVC structure.
3. **Implementation** — Implement the full module with models, validators, routes, controllers, and mappers.
4. **Code review** — Perform a thorough review for logic bugs, security issues, validation gaps, error handling, and code quality. Address findings before proceeding.
5. **Endpoint testing** — Execute comprehensive positive and negative test cases against each endpoint, verifying HTTP responses, database state, and security properties.
6. **Merge** — Commit all changes, checkout `main`, fast-forward merge the feature branch, and push to `origin/main`.
7. **Tag** — Create an annotated Git tag (e.g., `profile-v1`) at the release commit and push it to origin.
8. **Freeze** — Delete the local feature branch. The released code on `main` under the tag is considered frozen.

---

## License

No license has been specified.
