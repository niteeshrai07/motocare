# MotoCare Database Documentation

## Overview

- **Database**: MongoDB
- **ODM**: Mongoose (v9.7.4)
- **Design philosophy**: Normalized document model with explicit references between collections. GeoJSON is used for location data to support geospatial queries. Shared sub-schemas are used for reusable structures (e.g., GeoJSON Point).
- **Connection**: MongoDB via `mongoose.connect(process.env.MONGO_URI)` in `config/db.js`.

---

## Collection Overview

| Collection | Purpose | Primary Relationships |
|---|---|---|
| `users` | User accounts (customers, mechanics, admins) | References own repair shops, service requests (as customer), notifications, reviews (as customer) |
| `repairshops` | Repair shop listings owned by mechanics | References owner (User), service requests, reviews |
| `servicerequests` | Service requests created by customers for repair shops | References customer (User), shop (RepairShop), reviews |
| `reviews` | Customer reviews for completed service requests | References service request, customer (User), shop (RepairShop) |
| `notifications` | User-facing notifications for system events | References recipient (User) |

---

## User Model

**File**: `models/user.model.js`

**Purpose**: Represents a platform user. Users can be customers, mechanics, or admins. Mechanics own repair shops. Customers create service requests and write reviews. Admins manage the platform.

### Schema Fields

| Field | Type | Required | Default | Validation |
|---|---|---|---|---|
| `name` | String | Yes | — | Trimmed |
| `email` | String | Yes | — | Trimmed, lowercase, must match email regex `/^\S+@\S+\.\S+$/` |
| `password` | String | Yes | — | Minimum length 6 characters |
| `role` | String | No | `'customer'` | Enum: `['customer', 'mechanic', 'admin']` |
| `phone` | String | Yes | — | — |
| `isActive` | Boolean | No | `true` | — |

### Indexes

- `{ email: 1 }` — unique index on email.

### Timestamps

- `createdAt`, `updatedAt` (enabled via `timestamps: true`).

### Collection Name

`users`

### Password Hashing (pre-save Hook)

A `pre('save')` hook runs before every save. If the `password` field is modified, it generates a salt (10 rounds) using `bcrypt.genSalt` and hashes the password with `bcrypt.hash`. The hashed value replaces the plaintext password in the document.

### Helper Methods

- `user.comparePassword(candidatePassword)` — Compares a plaintext password against the stored bcrypt hash using `bcrypt.compare`. Returns a boolean.

---

## RepairShop Model

**File**: `models/repairShop.model.js`

**Purpose**: Represents a repair shop owned by a mechanic. Shops must be verified by an admin before they can accept service requests. Shops support geospatial queries for nearby search.

### Schema Fields

| Field | Type | Required | Default | Validation |
|---|---|---|---|---|
| `ownerId` | ObjectId (ref `User`) | Yes | — | References a User document |
| `shopName` | String | Yes | — | Trimmed, min length 2, max length 100 |
| `vehicleTypesServiced` | String array | Yes | — | Enum: `['two_wheeler', 'four_wheeler']` |
| `location` | GeoJSON Point (sub-schema) | Yes | — | See GeoJSON structure below |
| `address` | String | Yes | — | Trimmed, max length 300 |
| `phone` | String | Yes | — | Trimmed |
| `description` | String | No | — | Trimmed |
| `openingHours` | String | No | — | Trimmed |
| `photoUrl` | String | No | — | Must be a valid HTTP/HTTPS URL if provided |
| `rating` | Number | No | `0` | Min 0, max 5 |
| `totalReviews` | Number | No | `0` | Min 0 |
| `status` | String | No | `'pending'` | Enum: `['pending', 'verified', 'rejected']` |

### GeoJSON/Location Structure

The `location` field uses the shared `geoPointSchema` sub-schema (`models/shared/geoPoint.schema.js`):

| Field | Type | Required | Default | Validation |
|---|---|---|---|---|
| `type` | String | No | `'Point'` | Enum: `['Point']` |
| `coordinates` | [Number] | Yes | — | Array of exactly 2 numbers; longitude must be in [-180, 180], latitude in [-90, 90] |

Coordinates are stored as `[longitude, latitude]` per the GeoJSON specification.

### Indexes

- `{ location: '2dsphere' }` — geospatial index for `$near` queries.
- `{ ownerId: 1 }` — unique index, enforcing one shop per mechanic.
- `{ status: 1 }` — for filtering shops by status.

### Timestamps

- `createdAt`, `updatedAt` (enabled via `timestamps: true`).

### Collection Name

`repairshops`

---

## ServiceRequest Model

**File**: `models/serviceRequest.model.js`

**Purpose**: Represents a service request created by a customer for a specific repair shop. Requests progress through a defined status workflow. Expiration is computed at creation time and checked lazily on read.

### Schema Fields

| Field | Type | Required | Default | Validation |
|---|---|---|---|---|
| `customerId` | ObjectId (ref `User`) | Yes | — | References a User document |
| `shopId` | ObjectId (ref `RepairShop`) | Yes | — | References a RepairShop document |
| `vehicleType` | String | Yes | — | Enum: `['two_wheeler', 'four_wheeler']` |
| `issueDescription` | String | Yes | — | Trimmed, min length 5, max length 500 |
| `location` | GeoJSON Point (sub-schema) | Yes | — | Same structure as RepairShop location |
| `status` | String | No | `'pending'` | Enum: `['pending', 'quoted', 'accepted', 'in_progress', 'completed', 'rejected', 'cancelled', 'expired']` |
| `estimatedCost` | Number | No | — | Min 0 |
| `estimatedDuration` | String | No | — | Trimmed, max length 50 |
| `mechanicNotes` | String | No | — | Trimmed, max length 500 |
| `expiresAt` | Date | Yes | — | Set at creation time (current time + configured timeout in minutes) |

### Status Workflow

The request progresses through statuses in this order:

```
pending → quoted → accepted → in_progress → completed
pending → rejected
pending → cancelled
quoted → rejected
pending → expired (lazy, on read)
quoted → expired (lazy, on read)
```

- `pending` — Request created, awaiting mechanic quote.
- `quoted` — Mechanic has submitted a quote.
- `accepted` — Customer has accepted the quote.
- `in_progress` — Mechanic has started work.
- `completed` — Work is finished; customer can now review.
- `rejected` — Mechanic rejected the request, or customer rejected a quote.
- `cancelled` — Customer cancelled the request.
- `expired` — Request timed out (lazy expiration on read).

### Indexes

- `{ customerId: 1 }` — for listing a customer's requests.
- `{ shopId: 1, status: 1 }` — for listing a shop's requests filtered by status.

### Timestamps

- `createdAt`, `updatedAt` (enabled via `timestamps: true`).

### Collection Name

`servicerequests`

### Expiration

Expiration is not handled by a schema default or save hook. The `expiresAt` value is computed at creation time in the controller (`Date.now() + timeoutMinutes * 60 * 1000`). The timeout duration is read from `process.env.SERVICE_REQUEST_TIMEOUT_MINUTES` (default 60 minutes). Lazy expiration is checked on read via `applyLazyExpiration`, which compares `Date.now()` against `expiresAt` for requests in expirable statuses (`pending`, `quoted`).

---

## Review Model

**File**: `models/review.model.js`

**Purpose**: Represents a customer's review of a completed service request. Each service request can have at most one review. Reviews include a numeric rating (1–5) and an optional comment.

### Schema Fields

| Field | Type | Required | Default | Validation |
|---|---|---|---|---|
| `serviceRequestId` | ObjectId (ref `ServiceRequest`) | Yes | — | Unique; one review per service request |
| `customerId` | ObjectId (ref `User`) | Yes | — | References a User document |
| `shopId` | ObjectId (ref `RepairShop`) | Yes | — | References a RepairShop document |
| `rating` | Number | Yes | — | Min 1, max 5 |
| `comment` | String | No | — | Trimmed, max length 500 |

### Indexes

- `{ serviceRequestId: 1 }` — unique index, enforcing one review per service request.
- `{ shopId: 1 }` — for aggregating reviews by shop (used in rating recalculation).
- `{ customerId: 1 }` — for querying reviews by customer.

### Timestamps

- `createdAt`, `updatedAt` (enabled via `timestamps: true`).

### Collection Name

`reviews`

---

## Notification Model

**File**: `models/notification.model.js`

**Purpose**: Stores user-facing notifications for system events such as service request submissions, quotes, status changes, and reviews. Notifications can be marked as read or archived.

### Schema Fields

| Field | Type | Required | Default | Validation |
|---|---|---|---|---|
| `recipientId` | ObjectId (ref `User`) | Yes | — | References a User document |
| `type` | String | Yes | — | Enum (see below) |
| `title` | String | Yes | — | Trimmed, max length 200 |
| `message` | String | Yes | — | Trimmed, max length 1000 |
| `resourceType` | String | No | — | Optional type identifier (e.g., `'repair-shop'`, `'service-request'`, `'review'`) |
| `resourceId` | ObjectId | No | — | Optional reference to the related resource |
| `metadata` | Mixed | No | `{}` | Flexible object for additional context |
| `read` | Boolean | No | `false` | — |
| `archived` | Boolean | No | `false` | — |

### Notification Type Enum

```
service_request_submitted
quote_received
quote_accepted
quote_rejected
service_started
service_completed
review_received
review_reminder
shop_verified
shop_rejected
system_notification
```

### Indexes

- `{ recipientId: 1, createdAt: -1 }` — for listing notifications by recipient, sorted by newest first.
- `{ recipientId: 1, read: 1, createdAt: -1 }` — for listing unread notifications by recipient.
- `{ recipientId: 1, archived: 1, createdAt: -1 }` — for listing non-archived notifications by recipient.

### Timestamps

- `createdAt`, `updatedAt` (enabled via `timestamps: true`).

### Collection Name

`notifications`

---

## Relationships

### User → RepairShop (One-to-One)

A User with role `mechanic` can own one RepairShop. The `ownerId` field on RepairShop references the User. A unique index on `ownerId` enforces one shop per mechanic.

### User → ServiceRequest (One-to-Many)

A User (as customer) can create multiple ServiceRequests. The `customerId` field on ServiceRequest references the User.

### RepairShop → ServiceRequest (One-to-Many)

A RepairShop can have multiple ServiceRequests. The `shopId` field on ServiceRequest references the RepairShop.

### ServiceRequest → Review (One-to-One)

A ServiceRequest can have at most one Review. The `serviceRequestId` field on Review references the ServiceRequest. A unique index on `serviceRequestId` enforces this constraint.

### User → Review (One-to-Many)

A User (as customer) can write multiple Reviews. The `customerId` field on Review references the User.

### RepairShop → Review (One-to-Many)

A RepairShop can have multiple Reviews. The `shopId` field on Review references the RepairShop.

### User → Notification (One-to-Many)

A User (as recipient) can have multiple Notifications. The `recipientId` field on Notification references the User.

---

## Database Indexes

| Collection | Indexed Field(s) | Type | Purpose |
|---|---|---|---|
| `users` | `email` | Unique | Fast lookup by email during login; prevent duplicate registrations |
| `repairshops` | `location` | 2dsphere | Geospatial `$near` queries for nearby shop search |
| `repairshops` | `ownerId` | Unique | Enforce one shop per mechanic |
| `repairshops` | `status` | Ascending | Filter shops by status (pending/verified/rejected) |
| `servicerequests` | `customerId` | Ascending | List requests for a specific customer |
| `servicerequests` | `shopId`, `status` | Compound | List requests for a specific shop filtered by status |
| `reviews` | `serviceRequestId` | Unique | Enforce one review per service request |
| `reviews` | `shopId` | Ascending | Aggregate reviews by shop for rating recalculation |
| `reviews` | `customerId` | Ascending | Query reviews by customer |
| `notifications` | `recipientId`, `createdAt` | Compound | List notifications by recipient, newest first |
| `notifications` | `recipientId`, `read`, `createdAt` | Compound | List unread notifications by recipient |
| `notifications` | `recipientId`, `archived`, `createdAt` | Compound | List non-archived notifications by recipient |

---

## Validation Rules

### Required Fields

- `User`: `name`, `email`, `password`, `phone`
- `RepairShop`: `ownerId`, `shopName`, `vehicleTypesServiced`, `location`, `address`, `phone`
- `ServiceRequest`: `customerId`, `shopId`, `vehicleType`, `issueDescription`, `location`, `expiresAt`
- `Review`: `serviceRequestId`, `customerId`, `shopId`, `rating`
- `Notification`: `recipientId`, `type`, `title`, `message`

### Enums

- `User.role`: `['customer', 'mechanic', 'admin']`
- `RepairShop.vehicleTypesServiced`: `['two_wheeler', 'four_wheeler']`
- `RepairShop.status`: `['pending', 'verified', 'rejected']`
- `ServiceRequest.status`: `['pending', 'quoted', 'accepted', 'in_progress', 'completed', 'rejected', 'cancelled', 'expired']`
- `Notification.type`: 11 predefined types (see Notification Type Enum above)

### Min/Max Values

- `User.password`: min length 6
- `RepairShop.shopName`: min length 2, max length 100
- `RepairShop.address`: max length 300
- `RepairShop.rating`: min 0, max 5
- `RepairShop.totalReviews`: min 0
- `ServiceRequest.issueDescription`: min length 5, max length 500
- `ServiceRequest.estimatedDuration`: max length 50
- `ServiceRequest.mechanicNotes`: max length 500
- `Review.rating`: min 1, max 5
- `Review.comment`: max length 500
- `Notification.title`: max length 200
- `Notification.message`: max length 1000

### Unique Constraints

- `User.email` — unique index prevents duplicate registrations.
- `RepairShop.ownerId` — unique index enforces one shop per mechanic.
- `Review.serviceRequestId` — unique index enforces one review per service request.

### Defaults

- `User.role`: `'customer'`
- `User.isActive`: `true`
- `RepairShop.status`: `'pending'`
- `RepairShop.rating`: `0`
- `RepairShop.totalReviews`: `0`
- `ServiceRequest.status`: `'pending'`
- `Notification.read`: `false`
- `Notification.archived`: `false`
- `Notification.metadata`: `{}`
- `geoPointSchema.type`: `'Point'`

---

## Data Integrity

### ObjectId References

All relationships between collections use Mongoose ObjectId references with `ref` declarations:

- `RepairShop.ownerId` → `User`
- `ServiceRequest.customerId` → `User`
- `ServiceRequest.shopId` → `RepairShop`
- `Review.serviceRequestId` → `ServiceRequest`
- `Review.customerId` → `User`
- `Review.shopId` → `RepairShop`
- `Notification.recipientId` → `User`

These references enable population (`.populate()`) in queries to resolve related documents.

### Required Ownership

- A mechanic can only create one repair shop (enforced by application logic in `repairShop.controller.js` and backed by a unique index on `ownerId`).
- A customer can only create a review for their own completed service request (checked in controller via `serviceRequest.customerId._id.toString() === req.user._id.toString()`).
- A mechanic can only quote, reject, start, or complete service requests for their own shop (checked via `shop.ownerId.toString() === req.user._id.toString()`).
- A customer can only accept or cancel their own service requests.
- Users can only access their own notifications (checked via `notification.recipientId.toString() !== req.user._id.toString()`).

### Status Validation

- `RepairShop.status` is restricted to `['pending', 'verified', 'rejected']`.
- `ServiceRequest.status` is restricted to 8 predefined values.
- State transitions are enforced in controllers (e.g., only `pending` requests can be quoted, only `quoted` requests can be accepted, only `in_progress` requests can be completed).
- Expirable statuses (`pending`, `quoted`) are checked for expiration on read.

### Rating Limits

- `Review.rating` is constrained to integers between 1 and 5.
- `RepairShop.rating` is constrained to numbers between 0 and 5.
- Shop ratings are recalculated via `recalculateShopRating` after every review creation, update, or deletion using MongoDB aggregation (`$avg`).

### Notification Enums

- `Notification.type` is restricted to 11 predefined values defined in the `NOTIFICATION_TYPES` array on the model.

### Phone Number Normalization

- The shared `phoneValidator` in `validators/common.validator.js` strips spaces and hyphens, then removes the `+91` prefix if present, storing phone numbers in canonical 10-digit format.

---

## Design Decisions

### GeoJSON for Location

Both `RepairShop` and `ServiceRequest` use the shared `geoPointSchema` sub-schema for their `location` field. This follows the GeoJSON standard (type + coordinates array), enabling MongoDB's 2dsphere index and `$near` queries for the nearby shops feature. Coordinates are stored as `[longitude, latitude]` per the GeoJSON specification.

### Referenced Documents (Not Embedded)

User, RepairShop, ServiceRequest, Review, and Notification are separate collections with ObjectId references rather than embedded documents. This design:

- Avoids document size growth issues.
- Enables independent querying and indexing of each entity.
- Supports population for read-time resolution of related data.
- Allows updates to one entity without affecting others.

### Mixed Metadata in Notifications

The `Notification.metadata` field uses `mongoose.Schema.Types.Mixed` with a default of `{}`. This provides flexibility to store event-specific context (e.g., `customerId`, `shopId`, `rating`, `status`) without requiring schema migrations for each notification type.

### Lazy Expiration for Service Requests

Service request expiration is computed at creation time and stored in `expiresAt`. Rather than using a TTL index or a background job, expiration is checked lazily on read via `applyLazyExpiration`. This avoids the complexity of scheduled tasks while ensuring stale requests are correctly identified when accessed.

### Password Hashing in Pre-Save Hook

Password hashing is handled in a Mongoose `pre('save')` hook rather than in the controller. This ensures passwords are always hashed before being persisted to the database, regardless of the save path (create or update), and only when the password field is actually modified.

### Role-Based Response Shaping via Mappers

The same underlying documents are transformed into different response shapes for different consumers (public, mechanic, admin) through dedicated mapper functions. For example, `RepairShop` has three mapper functions: `buildPublicRepairShopResponse` (no status, no owner), `buildMechanicRepairShopResponse` (adds status and timestamps), and `buildAdminRepairShopResponse` (adds owner info).

### Shared Validation via Common Validator

The `phoneValidator` in `common.validator.js` is reused across `auth.validator.js`, `repairShop.validator.js`, and `profile.validator.js`, ensuring consistent phone number handling throughout the application.

### Explicit Index Definitions

All indexes are defined explicitly in the schema definitions rather than relying on Mongoose's auto-indexing. This makes indexing decisions visible, reviewable, and intentional.

---

## Summary

The MotoCare database uses MongoDB with Mongoose ODM. It consists of five collections: `users`, `repairshops`, `servicerequests`, `reviews`, and `notifications`. Relationships are maintained through ObjectId references with Mongoose population. The schema enforces data integrity through required fields, enum constraints, min/max validations, unique indexes, and pre-save hooks (password hashing). GeoJSON is used for location data to support geospatial queries. The design favors normalized documents with explicit references, lazy expiration for time-sensitive requests, and role-specific response shaping through mappers.