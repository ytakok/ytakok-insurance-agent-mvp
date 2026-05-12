# Insurance Agent MVP

AI-powered insurance agent dashboard for policy management, alerts, and task automation.

## Features

- 📤 **Excel Upload** - Import client and policy data from Excel/CSV files
- 🤖 **AI Parsing** - Automatic data validation and insight generation
- 🔔 **AI Alerts** - Smart notifications for renewals, payments, and opportunities
- 📋 **Task Management** - AI-generated tasks with prioritization
- ✉️ **Email Center** - Compose and send emails with AI-generated templates
- 📊 **Dashboard** - Visual overview of portfolio performance
- 🔍 **Search** - Search across clients, policies, tasks, and alerts

## Quick Start

```bash
# Navigate to the project
cd insurance-agent-mvp

# Install dependencies
npm install

# Start development server
npm start

# Open browser at http://localhost:4201
```

## Build for Production

```bash
# Build optimized bundle
npm run build

# Output in dist/insurance-agent-mvp
```

## Docker Deployment

```bash
# Build Docker image
docker build -t insurance-agent-mvp .

# Run container
docker run -p 80:80 insurance-agent-mvp
```

## Project Structure

```
insurance-agent-mvp/
├── src/
│   ├── app/
│   │   ├── components/       # UI Components
│   │   │   ├── dashboard/
│   │   │   ├── excel-upload/
│   │   │   ├── alerts/
│   │   │   ├── tasks/
│   │   │   ├── email/
│   │   │   ├── search/
│   │   │   ├── clients/
│   │   │   └── policies/
│   │   ├── services/         # Business Logic
│   │   │   ├── data.service.ts
│   │   │   ├── ai.service.ts
│   │   │   ├── excel.service.ts
│   │   │   └── email.service.ts
│   │   ├── models/           # TypeScript Interfaces
│   │   └── data/             # Sample Data
│   └── styles.less           # Global Styles
├── deployment/
│   ├── Dockerfile
│   ├── docker-compose.yml
│   └── nginx.conf
└── package.json
```

## Technology Stack

- **Angular 19** - Modern web framework
- **Standalone Components** - No NgModules
- **Signals** - Reactive state management
- **TypeScript** - Type-safe development
- **LESS** - CSS preprocessor

## Sample Data

The app includes sample insurance data for demonstration:

- 6 sample clients
- 7 sample policies (Auto, Home, Life, Health, Business, Umbrella)
- AI-generated alerts and tasks
- Email templates

## Cloud Deployment

### Option 1: Docker

1. Build the image: `docker build -t insurance-agent-mvp .`
2. Push to registry: `docker push your-registry/insurance-agent-mvp`
3. Deploy to cloud provider (AWS ECS, Azure Container Instances, GCP Cloud Run)

### Option 2: Static Hosting

1. Build: `npm run build`
2. Upload `dist/insurance-agent-mvp/browser` to:
   - AWS S3 + CloudFront
   - Azure Blob Storage + CDN
   - Netlify
   - Vercel
   - Firebase Hosting

## Environment Variables

For production, configure these in your deployment:

```env
API_BASE_URL=https://your-api.com
AI_SERVICE_URL=https://ai-service.com
EMAIL_SERVICE_URL=https://email-service.com
```

## License

MIT License
