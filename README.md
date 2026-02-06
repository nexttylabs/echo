# Echo

<div align="center">

![Echo Logo](public/logo-64.svg)

**Open-source product feedback platform for modern teams.**

Collect feedback, spot patterns, and ship what matters.

[Live Demo](https://https://echo-khaki-eta.vercel.app/)  - [Feedback](https://github.com/nexttylabs/echo/issues)

[![License: AGPL-3.0](https://img.shields.io/badge/License-AGPL--3.0-blue.svg)](https://www.gnu.org/licenses/agpl-3.0.en.html)
[![GitHub stars](https://img.shields.io/github/stars/nexttylabs/echo.svg)](https://github.com/nexttylabs/echo/stargazers)
[![GitHub forks](https://img.shields.io/github/forks/nexttylabs/echo.svg)](https://github.com/nexttylabs/echo/network)
[![GitHub issues](https://img.shields.io/github/issues/nexttylabs/echo.svg)](https://github.com/nexttylabs/echo/issues)

</div>

## Why Echo

Echo helps product teams centralize user feedback, identify themes, and make confident roadmap decisions without losing control of data or workflow.

## Quickstart

### Docker (recommended)

```bash
# Clone the repository
git clone https://github.com/nexttylabs/echo.git
cd echo

# Copy environment variables
cp .env.example .env

# Start services
docker-compose up -d
```

Visit http://localhost:3000

### Local development

```bash
# Install dependencies
bun install

# Copy environment variables
cp .env.example .env.local

# Run database migrations
bun run db:migrate

# Start development server
bun dev
```

Visit http://localhost:3000

## Core workflow

1. Create a project and customize your public feedback portal.
2. Collect feedback (embedded portal, admin entry, or API).
3. Triage, prioritize, and share progress with your users.

## Features

- **Feedback collection**: embedded portal, voting, attachments
- **Management workflow**: statuses, filters, and prioritization
- **AI assist**: basic auto-classification and duplicate hints
- **Team collaboration**: invitations and role-based access control
- **Self-hosting**: run on your infrastructure with Docker
- **API-ready**: integrate with existing product workflows

## Use cases

- **Product teams**: prioritize roadmap decisions with data
- **Support teams**: capture customer feedback and context
- **Engineering teams**: track requests from idea to shipping

## Tech stack

- **Frontend**: Next.js 16 + React 19 + TypeScript
- **UI**: Shadcn/ui + Tailwind CSS v4
- **Backend**: Next.js API Routes
- **Database**: PostgreSQL + Drizzle ORM
- **Deployment**: Docker + Docker Compose
- **Testing**: Playwright (E2E) + Vitest (Unit)

## Project structure

```
echo/
|-- app/                 # Next.js App Router
|   |-- (auth)/          # Authentication pages
|   |-- (dashboard)/     # Dashboard pages
|   |-- api/             # API routes
|   `-- portal/          # Public feedback portal
|-- components/          # React components
|   |-- ui/              # Shadcn/ui base components
|   |-- forms/           # Form components
|   `-- feedback/        # Feedback-related components
|-- lib/                 # Utility functions and config
|-- db/                  # Database schema and migrations
|-- public/              # Static assets
`-- docs/                # Project documentation
```

## Configuration

Create a `.env` file and set the following values:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/echo"

# Authentication
BETTER_AUTH_SECRET="your-secret-key"
BETTER_AUTH_URL="http://localhost:3000"

# Email (optional)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"

# AI (optional)
OPENAI_API_KEY="your-openai-api-key"
```

## Database

```bash
# Generate migration files
bun run db:generate

# Run migrations
bun run db:migrate

# Reset database (development environment)
bun run db:reset
```

## Testing

```bash
# Run unit tests
bun test

# Run E2E tests
bun run test:e2e

# Run tests with coverage
bun run test:coverage
```

## Get involved

- Join the conversation in our [Discord](https://discord.gg/echo)
- Review or open [issues](https://github.com/nexttylabs/echo/issues)
- Contribute via [pull requests](https://github.com/nexttylabs/echo/pulls)

## Contributing

We welcome contributions from the community.

1. Fork the project
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Roadmap

- **v1.0 (current)**: feedback collection, auth, Docker, basic AI classification
- **v1.1 (planned)**: comments, email notifications, public roadmap
- **v1.2 (future)**: advanced AI, white-labeling, SSO, mobile

## License

This project is licensed under the [GNU AGPL v3](LICENSE).

## Acknowledgments

- [Next.js](https://nextjs.org/) - React framework
- [Shadcn/ui](https://ui.shadcn.com/) - UI components
- [Drizzle ORM](https://orm.drizzle.team/) - TypeScript ORM
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS

---

<div align="center">

**[Star the repo](https://github.com/nexttylabs/echo) if Echo helps your team.**

Made by the nexttylabs Team

</div>