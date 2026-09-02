# AgroLink Backend

This is the backend for the AgroLink app, built with Node.js, Express, TypeScript, PostgreSQL, and JWT authentication.

## Getting Started

1. Copy `.env.example` to `.env` and fill in your environment variables.
2. Install dependencies:
   ```sh
   npm install
   ```
3. Configure Prisma
   Make sure you have a valid prisma/schema.prisma file.
   Example for PostgreSQL:

   ```
   generator client {
   provider = "prisma-client-js"
   }

   datasource db {
   provider = "postgresql"
   url      = env("DATABASE_URL")
   }

   model User {
   id        Int      @id @default(autoincrement())
   email     String   @unique
   password  String
   createdAt DateTime @default(now())
   }
   ```

4. Set Up .env File
   Create a .env file in your backend root:
   `DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE"`

   Replace with your actual database credentials.

5. Generate Prisma Client
   `npx prisma generate`
6. Run Migrations (if needed)
   `npx prisma migrate dev --name init`
7. Start the Backend
   `npm run dev`

## Project Structure

- `src/controllers` - Route controllers
- `src/models` - Database models
- `src/routes` - Express routes
- `src/middleware` - Custom middleware
- `src/utils` - Utility functions
- `src/services` - Business logic/services

## License

MIT
