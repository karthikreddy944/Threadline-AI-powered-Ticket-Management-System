# Admin Code display fix

Admin Settings now fetches the organization directly from `GET /api/organization`
and uses that response as the authoritative source for the Admin Code.

The Admin Code is displayed in Admin Settings with a Copy code button.
The existing profile value remains as a fallback.

Backend organization route already enforces the `admin` role and returns:
`id`, `name`, `adminCode`, and `createdAt`.

Local frontend API should use:
`VITE_API_URL=http://localhost:5000/api`
