# NiveshAI

A React + Vite investment dashboard using JWT authentication.

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```
2. Create an `.env.local` file with your API base URL:
   ```bash
   VITE_API_BASE_URL=https://your-api.example.com
   ```
3. Run the development server:
   ```bash
   npm run dev
   ```

## JWT Auth Endpoints

The app expects these auth endpoints in your backend:
- `POST /auth/login`
- `POST /auth/register`
- `POST /auth/forgot-password`
- `POST /auth/reset-password`
- `GET /auth/me`

If your backend uses different paths, update `src/api/authClient.js`.

## Notes

- The app stores the JWT in `localStorage` under `token`.
- The current setup removes all Base44 integration and watermarking.
