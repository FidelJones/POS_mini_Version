# Jambo POS

Calm, fast point of sale for modern retail and hospitality.

## Production API

Set `VITE_API_BASE_URL` in Netlify to point at the Render backend:

`https://pos-mini-version-1.onrender.com/api`

Example local env file:

```bash
VITE_API_BASE_URL=https://pos-mini-version-1.onrender.com/api
```

## Auth

The frontend uses JWT login against the backend auth endpoints.

- Username/password are submitted to `/api/auth/token/`
- Access tokens are attached as `Authorization: Bearer <token>`
- Expired access tokens are refreshed via `/api/auth/refresh/`
