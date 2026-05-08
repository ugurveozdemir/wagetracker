# Chickaree API

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