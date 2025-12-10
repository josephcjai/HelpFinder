# HelpFinder Functionalities

This document serves as the single source of truth for the existing functionalities in the HelpFinder application. It should be updated whenever a new feature is implemented or an existing one is modified.

## 1. User Management & Roles

### Roles
- **Guest**: Can view the landing page, register, and login.
- **User (Requester/Helper)**: Standard authenticated user. Can switch between roles implicitly by posting tasks or bidding on them.
- **Admin**: Has elevated privileges to manage users and content.
- **Super Admin**: Has highest level privileges (including deleting admins).

### Capabilities
| Action | Guest | User | Admin |
|--------|-------|------|-------|
| Register/Login | ✅ | ❌ | ❌ |
| View Tasks | ❌ | ✅ | ✅ |
| Post Task | ❌ | ✅ | ✅ |
| Place Bid | ❌ | ✅ (on others' tasks) | ✅ |
| Edit Own Task | ❌ | ✅ (Only in 'Open' state) | ✅ (Any state) |
| Delete Own Task | ❌ | ✅ (Only in 'Open' state) | ✅ (Any state) |
| Manage Users | ❌ | ❌ | ✅ |
| Manage Categories | ❌ | ❌ | ✅ |

### User Profile
- Users can manage their profile details, including **Address**, **Country**, and **Zip Code**.
- Users can set a **Default Location** on the map.
- This default location is used for:
    - Pre-filling the map when posting a new task.
    - Defaulting the location filter on the home page.

## 2. Task Lifecycle

The task lifecycle defines the flow of a help request from creation to completion.

1.  **Open**: Task is created by a Requester. Bids can be placed.
2.  **Accepted**: Requester accepts a bid.
    *   *Triggers*: Contract creation (Pending).
    *   *Restrictions*: No new bids allowed.
3.  **In Progress**: Helper clicks "Start Task".
    *   *Triggers*: Contract status updates to 'Started'.
    *   *restrictions*: Requester cannot edit task details.
4.  **Review Pending**: Helper requests completion.
    *   *Triggers*: Contract status updates to 'Delivered'.
5.  **Completed**: Requester approves the work.
    *   *Triggers*: Contract status updates to 'Approved'.
    *   *Logic*: Task marked as done.

**Reopening**: A completed task can be reopened by the Requester within **14 days** (e.g., if issues arise after approval).

## 3. Bidding System

- **Placing Bids**: Helpers can bid on 'Open' tasks.
- **Editing Bids**: Helpers can edit their bids only if the task is still 'Open' and the bid is 'Pending'.
- **Withdrawing Bids**: Helpers can withdraw bids. If a bid was already accepted, withdrawing it **cancels the contract** and reopens the task.
- **Accepting Bids**: Only the Requester can accept a bid. This locks the task to that Helper.

## 4. Contracts & Payments
*Currently, payments are tracked via Contracts but strictly informational (no gateway integration).*

- **Creation**: Logic automatically creates a `Contract` entity when a bid is accepted.
- **States**: `Pending` -> `Started` -> `Delivered` -> `Approved` (or `Cancelled`).

## 5. Search & Discovery

- **Location Filter**: Users can filter tasks by radius (km) from a specific point on the map.
- **Category Filter**: Users can filter tasks by dynamic categories (e.g., "Moving", "Cleaning").
- **My Tasks**: Users can toggle between "All Tasks" and "My Tasks" (tasks they created).
- **Map Capabilities**:
    - **Interactive Map**: Visualize task locations on an interactive map using Leaflet.
    - **Location Search**: Users can search for specific places (e.g., "Central Park", "Coffee Shop") directly on the map to find and select locations quickly without manual scrolling.
    - **Geocoding Fallback**: Automatically defaults the map view to the user's saved profile address (or Zip/Country) when latitude/longitude are missing.

## 6. Notifications

- **Trigger**: Notifications are generated for critical events (e.g., Task Modified after acceptance).
- **Delivery**: In-app notifications accessible via the Navbar bell icon.

## 7. Security & Compliance

- **JWT Authentication**: Secured stateless authentication.
- **Deleted User Protection**: JWT strategy validates user existence in DB to preventing deleted users from accessing the API.
- **Role-Based Access Control (RBAC)**: Strict guards on API endpoints based on `UserRole`.
