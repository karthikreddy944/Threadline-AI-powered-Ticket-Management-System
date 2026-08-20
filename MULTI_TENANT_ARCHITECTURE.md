# Multi-tenant ownership and assignment

The application uses `Organization` as the tenant boundary.

- Admin registration creates exactly one Organization and a unique Admin Code.
- Client registration requires that Admin Code and stores the Organization ID on the client.
- Employees are created only by an authenticated Admin and automatically receive that Admin's Organization ID.
- Client-created tickets receive the authenticated user's Organization ID.
- Admin ticket queries are filtered by Organization ID.
- Employee assignment validates both `organizationId` and `role: employee` before assignment.
- Automatic allocation selects employees only from the same Organization.
- Admin client lists/details are filtered by Organization ID.
- GitHub OAuth endpoints require the `admin` role.

Therefore the intended flow is:

Admin -> many Clients
Admin -> many Employees
Clients -> raise Tickets
Admin -> assign those Tickets to Employees belonging to the same Admin/Organization

Admin A cannot assign a ticket to an employee belonging to Admin B because the backend assignment query requires the same Organization ID.
