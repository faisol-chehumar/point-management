# SaaS Member System

A complete SaaS member management system with user registration, admin approval workflows, credit-based access control, and automated daily credit deduction.

## Tech Stack

- **Frontend**: Next.js 15 with TypeScript
- **Styling**: Tailwind CSS + Shadcn/ui components
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js with credentials provider
- **Automation**: node-cron for scheduled tasks

## Getting Started

### Prerequisites

- Node.js 18+ 
- PostgreSQL database
- npm or yarn

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env.local
   ```
   Update the database URL and other environment variables.

4. Set up the database:
   ```bash
   npm run db:generate
   npm run db:push
   ```

5. Run the development server:
   ```bash
   npm run dev
   ```

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run db:generate` - Generate Prisma client
- `npm run db:push` - Push schema to database
- `npm run db:migrate` - Run database migrations
- `npm run db:studio` - Open Prisma Studio

## Project Structure

```
src/
├── app/                 # Next.js app directory
│   ├── api/            # API routes
│   ├── globals.css     # Global styles
│   ├── layout.tsx      # Root layout
│   └── page.tsx        # Home page
├── components/         # React components
│   └── ui/            # Shadcn/ui components
├── lib/               # Utility libraries
│   ├── auth.ts        # NextAuth configuration
│   ├── prisma.ts      # Prisma client
│   └── utils.ts       # Utility functions
└── types/             # TypeScript type definitions
    └── next-auth.d.ts # NextAuth type extensions
```

## Features

- User registration and authentication
- Admin approval workflows
- Credit-based access control
- Automated daily credit deduction
- Modern responsive UI
- Type-safe database operations
- Secure session management

## Environment Variables

See `.env.example` for required environment variables.

## License

MIT