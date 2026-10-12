# PujaCircle Priest Availability System — Implementation Plan

> **Goal:** Build a dynamic 3-month priest availability system where Purohits can visualize their 7:00 AM – 9:00 PM working schedule, manage full days off, block specific hours, and see confirmed bookings in real-time without conflicts.

---

## 1. System Overview & Core Principles

```
┌────────────────────────────────────────────────────────────────────────┐
│                        Dynamic 3-Month Calendar                        │
│                 Default Working Window: 7:00 AM – 9:00 PM              │
└───────────────────┬────────────────────────────────┬───────────────────┘
                    │                                │
                    ▼                                ▼
     [priest_availability_exceptions]          [bookings]
     - Full-Day Off: 07:00 – 21:00              - Status = 'CONFIRMED'
     - Blocked Hours: e.g. 13:00 – 16:00        - Occupies specific window
                    │                                │
                    └───────────────┬────────────────┘
                                    ▼
                    [Availability Computation Engine]
     Computes daily availability dynamically (No pre-generated 90 rows):
     🟢 Green  : Working hours available
     🔴 Red    : Full Day Off (Entire 7 AM – 9 PM blocked)
     🟠 Orange : Partial hours blocked
     🔵 Blue   : Confirmed devotee booking exists on that date
     *(A date can display BOTH a Blue booking indicator and an Orange partial block)*
```

### Key Business Rules
1. **Default Window**: Every day in the 90-day rolling window is automatically bookable from `07:00` to `21:00` (14 hours) unless blocked.
2. **Single Exception Type (`BLOCK`)**:
   - **Full-Day Off (Leave)**: Stored as `BLOCK` from `07:00` to `21:00` with reason (e.g., `"Full Day Leave"`).
   - **Specific Hours Block**: Stored as `BLOCK` from `startTime` to `endTime` with reason (e.g., `"Personal Work"`).
3. **Confirmed Booking Overlap Rule**:
   A block request is **strictly rejected** on the backend if it overlaps any confirmed booking:
   $$\text{RequestedStart} < \text{BookingEnd} \quad \text{AND} \quad \text{RequestedEnd} > \text{BookingStart}$$
   *Adjacent times (e.g., block ending exactly when booking starts) are permitted.*
4. **No Ghost Rows**: Regular availability is calculated mathematically on the fly, not stored as pre-generated database records.

---

## 2. Database Schema (`priest_availability_exceptions`)

| Column | Type | Constraints / Defaults | Description |
|---|---|---|---|
| `id` | `UUID` | `PRIMARY KEY DEFAULT gen_random_uuid()` | Unique exception identifier |
| `priest_id` | `UUID` | `NOT NULL REFERENCES priest_profiles(id) ON DELETE CASCADE` | Assigned Purohit profile |
| `exception_type` | `VARCHAR(20)` / `ENUM` | `NOT NULL DEFAULT 'BLOCK'` | Exception classification (`BLOCK`) |
| `start_at` | `TIMESTAMPTZ` | `NOT NULL` | Exact start timestamp (e.g. `2026-10-15 07:00:00+05:30`) |
| `end_at` | `TIMESTAMPTZ` | `NOT NULL` | Exact end timestamp (e.g. `2026-10-15 21:00:00+05:30`) |
| `reason` | `VARCHAR(255)` | `NULLABLE` | Optional context (e.g. Leave, Emergency, Personal) |
| `created_at` | `TIMESTAMPTZ` | `NOT NULL DEFAULT NOW()` | Record creation timestamp |
| `updated_at` | `TIMESTAMPTZ` | `NOT NULL DEFAULT NOW()` | Record last updated timestamp |

---

## 3. Required Backend API Routes

File: `backend/src/routes/priest.routes.ts`

| Method | Endpoint | Middleware | Description |
|---|---|---|---|
| **`GET`** | `/api/v1/priests/me/exceptions` | `requireAuth`, `requireRole('PRIEST')` | Fetch all blocked intervals for current priest with optional `?startDate=&endDate=` filters. |
| **`POST`** | `/api/v1/priests/me/exceptions` | `requireAuth`, `requireRole('PRIEST')`, `validate(createPriestAvailabilityExceptionSchema)` | Create Full-Day Leave or Specific-Hours Block. |
| **`DELETE`** | `/api/v1/priests/me/exceptions/:exceptionId` | `requireAuth`, `requireRole('PRIEST')`, `validate(exceptionIdParamSchema, 'params')` | Cancel Day Off or unblock hours by exception ID. |
| **`GET`** | `/api/v1/priests/:id/exceptions` | `validate(uuidParamSchema, 'params')` | Public/Devotee endpoint to check a priest's blocked times during ceremony booking. |

---

## 4. Required Controller Functions

File: `backend/src/controllers/priest.controller.ts`

### 1. `getMyExceptions(req: Request, res: Response, next: NextFunction)`
- **Input**: `req.user.id`, Query: `startDate?`, `endDate?`.
- **Logic**: Calls `priestService.getPriestExceptions(priestId, { startDate, endDate })`.
- **Response**: `200 OK` with JSON array of exception objects.

### 2. `createMyException(req: Request, res: Response, next: NextFunction)`
- **Input**:
  ```json
  {
    "date": "2026-10-15",
    "isFullDay": false,
    "startTime": "13:00",
    "endTime": "16:00",
    "reason": "Personal Work"
  }
  ```
- **Logic**:
  1. Calls `priestService.createPriestException(req.user.id, req.body)`.
  2. If an overlapping confirmed booking exists: Throws `409 Conflict` with clear error message.
  3. If validations succeed: Inserts block record.
- **Response**: `201 Created` with newly created exception record.

### 3. `deleteMyException(req: Request, res: Response, next: NextFunction)`
- **Input**: `req.params.exceptionId`, `req.user.id`.
- **Logic**: Calls `priestService.deletePriestException(req.user.id, req.params.exceptionId)`.
- **Response**: `200 OK` with `"Availability exception deleted successfully."`.

---

## 5. Required Service Functions

File: `backend/src/services/priest.service.ts`

### 1. `getPriestExceptions(priestId: string, query?: { startDate?: string; endDate?: string })`
- Queries `priest_availability_exceptions` matching `priest_id = priestId`.
- Filters between `start_at >= startDate` and `end_at <= endDate` when query params are provided.
- Orders by `asc(priestAvailabilityExceptions.startAt)`.
- Formats dates and times cleanly for client display.

### 2. `createPriestException(priestId: string, data: CreateExceptionInput)`
**Step-by-Step Logic**:
1. **90-Day Range Guard**:
   - Ensures target date is between today and `today + 90 days`. Rejects dates in the past or beyond 90 days with `400 Bad Request`.
2. **Determine Time Range**:
   - **If `isFullDay === true`**:
     - `startTime = "07:00"`
     - `endTime = "21:00"`
     - `reason = data.reason || "Full Day Leave"`
   - **If `isFullDay === false`**:
     - Validates `startTime < endTime`.
     - Validates `startTime >= "07:00"` and `endTime <= "21:00"`.
3. **Confirmed Booking Overlap Check**:
   - Queries `bookings` where `priestId = priestId`, `bookingDate = data.date`, and `status = 'CONFIRMED'`.
   - Compares times:
     ```typescript
     const hasOverlap = confirmedBookings.some((booking) => {
       return requestedStartTime < booking.endTime && requestedEndTime > booking.startTime;
     });
     ```
   - If `hasOverlap === true`, throws:
     `"Cannot block time: Conflicts with a confirmed devotee booking from " + booking.startTime + " to " + booking.endTime`
4. **Duplicate Exception Check**:
   - Checks if an identical or overlapping exception already exists on that date for this priest.
5. **Database Insertion**:
   - Constructs ISO TIMESTAMPTZ strings for `start_at` and `end_at`.
   - Inserts record into `priest_availability_exceptions`.
   - Returns the created record.

### 3. `deletePriestException(priestId: string, exceptionId: string)`
- Verifies the exception belongs to `priestId`.
- Deletes the record from `priest_availability_exceptions`.

---

## 6. Zod Validation Schemas

File: `backend/src/schemas/priest.schema.ts`

```typescript
export const createPriestAvailabilityExceptionSchema = z
  .object({
    date: z
      .string()
      .trim()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
    isFullDay: z.boolean().default(false),
    startTime: z
      .string()
      .trim()
      .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Valid start time (HH:MM) required')
      .optional(),
    endTime: z
      .string()
      .trim()
      .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Valid end time (HH:MM) required')
      .optional(),
    reason: z
      .string()
      .trim()
      .max(255, 'Reason cannot exceed 255 characters')
      .optional(),
  })
  .refine(
    (data) => {
      if (data.isFullDay) return true;
      if (!data.startTime || !data.endTime) return false;
      return data.startTime < data.endTime;
    },
    {
      message: 'For specific hours, start time must be earlier than end time',
      path: ['startTime'],
    }
  );

export type CreatePriestAvailabilityExceptionInput = z.infer<
  typeof createPriestAvailabilityExceptionSchema
>;
```

---

## 7. Frontend Integration

### 1. API Client Updates (`frontend/src/api/priest.api.ts`)
Add real API calls replacing `localStorage`:
```typescript
getPriestExceptions: async (query?: { startDate?: string; endDate?: string }): Promise<PriestException[]> => {
  const res = await apiClient.get('/priests/me/exceptions', { params: query });
  return (res as any).data || res || [];
},

createAvailabilityException: async (payload: {
  date: string;
  isFullDay: boolean;
  startTime?: string;
  endTime?: string;
  reason?: string;
}) => {
  const res = await apiClient.post('/priests/me/exceptions', payload);
  return res as any;
},

deleteAvailabilityException: async (exceptionId: string) => {
  const res = await apiClient.delete(`/priests/me/exceptions/${exceptionId}`);
  return res as any;
}
```

### 2. UI Updates (`frontend/src/pages/priest/PriestAvailabilityPage.tsx`)
- **Action A: Toggle Full Day Off**:
  Calls `createAvailabilityException({ date: selectedDate, isFullDay: true, reason: 'Full Day Off' })`.
  If already off, calls `deleteAvailabilityException(existingLeaveId)`.
- **Action B: Block Specific Hours**:
  Modal calls `createAvailabilityException({ date: selectedDate, isFullDay: false, startTime, endTime, reason })`.
  If backend returns `409 Conflict`, shows error toast with conflict details.
- **Dynamic 3-Month Calendar Badge Calculation**:
  For each day in the grid:
  - 🔴 **Day Off (Red)**: Full-day exception exists (`07:00 – 21:00`).
  - 🟠 **Blocked Hours (Orange)**: Partial exception exists.
  - 🔵 **Confirmed Booking (Blue)**: Has `booking.status === 'CONFIRMED'`.
  - 🟢 **Available (Green)**: Has bookable hours remaining.

---

## 8. Step-by-Step Implementation Roadmap

```
[Phase 1: Backend Service & Validation]
  ├── Update createPriestAvailabilityExceptionSchema in priest.schema.ts
  └── Implement getPriestExceptions, createPriestException, deletePriestException in priest.service.ts

[Phase 2: Backend Controller & Routing]
  ├── Wire getMyExceptions, createMyException, deleteMyException in priest.controller.ts
  └── Verify routes in priest.routes.ts

[Phase 3: Frontend API & Store]
  └── Connect priestApi.getPriestExceptions, createAvailabilityException, deleteAvailabilityException in priest.api.ts

[Phase 4: Frontend Calendar UI]
  ├── Update PriestAvailabilityPage.tsx to use live backend API
  └── Verify day indicators (Green, Red, Orange, Blue) and conflict error handling

[Phase 5: Verification & Quality Check]
  ├── Run backend typecheck (npm run typecheck)
  └── Run frontend typecheck (npm run typecheck)
```
