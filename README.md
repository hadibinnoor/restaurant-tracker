# Restaurant Tracker

A modern web application built with Next.js and Supabase for tracking your favorite restaurants. Keep track of restaurant details, locations, opening hours, and recommended dishes.

## Features

- **Google Authentication**: Secure user authentication using Supabase Auth with Google Sign-In
- **Restaurant Management**: Add and view restaurants with details like:
  - Name and location (using device geolocation)
  - Opening and closing hours
  - Recommended dishes
  - Restaurant images
- **Modern UI**: Built with shadcn/ui components for a sleek and consistent design
- **Responsive Design**: Optimized for both mobile and desktop views
- **Image Storage**: Secure image storage using Supabase Storage

## Tech Stack

- Next.js 14
- Supabase (Authentication, Database, and Storage)
- TypeScript
- Tailwind CSS
- shadcn/ui
- date-fns
- react-dropzone

## Setup Instructions

1. Clone the repository:
```bash
git clone https://github.com/yourusername/restaurant-tracker.git
cd restaurant-tracker
```

2. Install dependencies:
```bash
npm install
```

3. Create a Supabase project at https://supabase.com

4. Set up your environment variables:
   - Copy `.env.example` to `.env.local`
   - Fill in your Supabase project URL and anon key
   - Add your Google OAuth credentials
   - Add your Google Maps API key

5. Run the database migrations:
```bash
npx supabase db push
```

6. Start the development server:
```bash
npm run dev
```

7. Open http://localhost:3000 in your browser

## Environment Variables

Create a `.env.local` file with the following variables:
```
NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your-google-maps-api-key
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.
