# WageTracker API

A comprehensive backend API for tracking work hours, calculating earnings, and managing overtime for freelancers and hourly workers.

## Features

- 🔐 **JWT Authentication** - Secure user registration and login
- 💰 **Automatic Earnings Calculation** - Calculates earnings with overtime (40h @ 1.5x)
- 📅 **Weekly Grouping** - Custom week start day for accurate overtime tracking
- ⏱️ **Flexible Time Entry** - Enter total hours or start/end times
- 📊 **Dashboard Analytics** - Total earnings, hours, and job statistics
- 🔄 **Historical Rate Tracking** - Preserves earnings even when hourly rates change

## Tech Stack

- **Framework**: ASP.NET Core 9.0
- **Database**: PostgreSQL (Supabase)
- **ORM**: Entity Framework Core
- **Authentication**: JWT Bearer Tokens
- **Password Hashing**: BCrypt
- **Documentation**: Swagger/OpenAPI

## Quick Start

### Prerequisites

- .NET 9.0 SDK
- Supabase account (or PostgreSQL database)

### Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd Wagetracker-app
   ```

2. **Configure Supabase**
   - Create a Supabase project
   - Get your connection string from Settings → Database

3. **Configure appsettings.json**
   
   Copy the example configuration file:
   
   **Windows (PowerShell):**
   ```powershell
   cd Wagetracker.API
   Copy-Item appsettings.Example.json appsettings.json
   ```
   
   **Linux/Mac:**
   ```bash
   cd Wagetracker.API
   cp appsettings.Example.json appsettings.json
   ```
   
   Then edit `appsettings.json` and replace the following values:
   - `YOUR_SUPABASE_HOST` → Your Supabase database host (from Supabase Dashboard → Settings → Database)
   - `YOUR_PASSWORD` → Your database password
   - `YOUR_SECRET_KEY_HERE_MINIMUM_32_CHARACTERS_LONG` → A strong secret key (minimum 32 characters)
   
   Example:
   ```json
   {
     "ConnectionStrings": {
       "DefaultConnection": "Host=db.xxxxx.supabase.co;Database=postgres;Username=postgres;Password=your_actual_password;SSL Mode=Require;Trust Server Certificate=true"
     },
     "Jwt": {
       "SecretKey": "my-super-secret-jwt-key-12345678"
     }
   }
   ```
   
   > [!IMPORTANT]
   > Never commit `appsettings.json` to Git! This file is already in `.gitignore` to protect your credentials.

4. **Run database migration**
   - Open Supabase SQL Editor
   - Execute `database/migrations/001_initial_schema.sql`

5. **Run the API**
   ```bash
   cd Wagetracker.API
   dotnet run
   ```

6. **Access Swagger UI**
   - Navigate to `https://localhost:7XXX/swagger`

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login and get JWT token

### Jobs (Protected)
- `GET /api/jobs` - Get all user jobs
- `POST /api/jobs` - Create new job
- `PUT /api/jobs/{id}` - Update job
- `DELETE /api/jobs/{id}` - Delete job

### Entries (Protected)
- `GET /api/entries` - Get all user entries
- `POST /api/entries` - Create new entry
- `PUT /api/entries/{id}` - Update entry
- `DELETE /api/entries/{id}` - Delete entry
- `GET /api/entries/job/{jobId}/weekly` - Get job details with weekly grouping

### Dashboard (Protected)
- `GET /api/dashboard/summary` - Get total earnings, hours, and jobs

## Project Structure

```
Wagetracker.API/
├── Controllers/        # API endpoints
├── Services/          # Business logic
├── Models/
│   ├── Entities/      # Database models
│   └── DTOs/          # Data transfer objects
├── Data/              # Database context
├── Utilities/         # Helper classes
└── Program.cs         # App configuration

database/
└── migrations/        # SQL migration scripts

reference_project/     # Frontend reference (TypeScript)
```

## Key Features Explained

### Overtime Calculation

The system automatically calculates overtime based on a 40-hour weekly threshold:
- First 40 hours: Regular hourly rate
- Hours 40+: 1.5x hourly rate

Example:
- 45 hours @ $65/hr
- Regular: 40h × $65 = $2,600
- Overtime: 5h × $65 × 1.5 = $487.50
- **Total: $3,087.50**

### Custom Week Start

Each job can have a custom first day of the week (Monday, Friday, etc.). This ensures overtime is calculated correctly for jobs with non-standard work weeks.

### Historical Rate Preservation

When an entry is created, the job's current hourly rate is saved as `HourlyRateSnapshot`. This means if you later change the job's rate, past entries maintain their original earnings calculation.

## Documentation

- [Setup Guide](docs/setup_guide.md) - Detailed configuration instructions
- [API Documentation](docs/api_docs.md) - Complete endpoint reference
- [Implementation Walkthrough](docs/walkthrough.md) - Architecture overview

## Development

### Build
```bash
dotnet build
```

### Run Tests
```bash
dotnet test
```

### Database Migrations
When entities change, update the migration script in `database/migrations/`.

## Security

- ✅ Passwords hashed with BCrypt
- ✅ JWT token-based authentication
- ✅ User data isolation
- ✅ CORS configured
- ⚠️ Update JWT SecretKey before production
- ⚠️ Configure CORS for specific origins in production

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## License

MIT License - see LICENSE file for details

## Support

For issues and questions, please open an issue on GitHub.

---

Built with ❤️ for freelancers and hourly workers
