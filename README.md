# Crab Stock Guardian System

A comprehensive inventory management system for tracking crab stock, quality control, and generating reports.

## Features

- Quality Control Dashboard
- Stock Management
- GRN (Goods Received Note) Generation
- Dead Crab Tracking
- Report Generation (TSF & Dutch Trails)
- WhatsApp Integration for Sharing Reports

## Tech Stack

- React
- TypeScript
- Supabase
- Tailwind CSS
- Shadcn/ui Components

## Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Supabase account

## Setup

1. Clone the repository:
```bash
git clone https://github.com/Kalpa111334/crab-stock-guardian-system.git
cd crab-stock-guardian-system
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory and add your Supabase credentials:
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

4. Run the development server:
```bash
npm run dev
```

## Database Setup

1. Install Supabase CLI
2. Run migrations:
```bash
supabase migration up
```

## Project Structure

```
src/
  ├── components/     # Reusable components
  ├── contexts/      # React contexts
  ├── hooks/         # Custom hooks
  ├── integrations/  # External integrations
  ├── lib/          # Utility functions
  ├── pages/        # Page components
  ├── services/     # API services
  └── types/        # TypeScript types
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

