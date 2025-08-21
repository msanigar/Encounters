# Encounters POC - Telehealth Platform

A production-quality proof-of-concept demonstrating an **Encounter-first architecture** for telehealth applications. This POC showcases a modern, resilient telehealth platform built with Next.js 14, Convex, and LiveKit.

## 🏗️ Architecture Overview

### Core Concepts
- **Encounter** is server-owned and long-lived. Media is a mode within it.
- One LiveKit **room per Encounter**, created at invite/check-in.
- **Join/Leave** toggles publish/subscribe only. The Encounter never tears down until explicitly ended.
- **Pre-join observability**: provider sees patient name/device preview activity before joining.
- **Resilience**: reloads or brief disconnects automatically recover state and media.
- **Handoff**: patient (or provider) can "Take this call elsewhere," issuing a new one-time link tied to the same Encounter.

### State Ownership
- **Convex (authoritative)**: encounters, invites, sessions, participants, rooms, journal_events, workflows, permissions
- **LiveKit**: room state, tracks, presence/RTM
- **Client local**: device selections, volumes, constraints, layout prefs (Zustand store)

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- pnpm
- Convex account
- LiveKit account (optional for full video functionality)

### Installation

1. **Clone and install dependencies**
   ```bash
   git clone <repository-url>
   cd encounters-poc
   pnpm install
   ```

2. **Set up Convex**
   ```bash
   pnpm convex:dev
   ```
   This will create a new Convex project and provide you with a deployment URL.

3. **Configure environment variables**
   ```bash
   cp env.example .env.local
   ```
   Update `.env.local` with your Convex URL and LiveKit credentials.

4. **Seed the database**
   ```bash
   pnpm seed
   ```

5. **Start the development server**
   ```bash
   pnpm dev
   ```

6. **Access the application**
   - Provider Dashboard: http://localhost:3000/provider/login
   - Demo Credentials: `provider@demo.test` / `demo123`

## 📋 Features

### Provider Dashboard
- **Left Rail**: Encounters list with status chips and quick actions
- **Center Stage**: Media canvas with PiP self-view, switches to Workflow mode when provider not publishing
- **Right Panel**: Journal with timeline over Chat, filters for All/System/Chat/Forms
- **Top Bar**: Provider avatar, device strip (mic/cam/speakers) persistent

### Patient Experience
- **Check-in Flow**: Simple name entry and device setup
- **Waiting Room**: Clear status indicators and next steps
- **Video Call**: Full WebRTC integration with LiveKit
- **Form Completion**: In-session form filling and submission

### Security & Tokens
- **OIT (One-time Invite Token)**: Single redemption invite links
- **RRT (Reconnect/Refresh Token)**: httpOnly cookies for session persistence
- **HOT (Handoff Token)**: One-time links for device handoff
- **LiveKit Tokens**: Server-side minted, provider never sees API keys

## 🧪 Testing

### Run E2E Tests
```bash
# Install Playwright browsers
npx playwright install

# Run all tests
pnpm test:e2e

# Run tests with UI
pnpm test:e2e:ui

# Run specific test
npx playwright test tests/prejoin-observability.spec.ts
```

### Test Scenarios
1. **Pre-join Observability**: Patient check-in → provider dashboard updates
2. **Warm Join/Switch**: Provider joins encounter A, switches to B and back in <250ms
3. **Pause and Workflow**: Provider leaves call, assigns form, patient submits, provider re-joins
4. **Resilience Reload**: Reload provider tab mid-call → automatic recovery within <2s
5. **Handoff**: Patient handoff to second device with provider approval

## 🏃‍♂️ Performance Targets

- **Warm join/switch**: <250ms
- **Cold join**: <500ms  
- **Reload recovery**: <2s
- **RTM updates**: <200ms

## 🛠️ Tech Stack

- **Frontend**: Next.js 14 (App Router) + TypeScript
- **Styling**: Tailwind CSS + shadcn/ui
- **Backend**: Convex (schema, queries, mutations, actions)
- **Real-time**: LiveKit (WebRTC + RTM)
- **State Management**: Zustand (devices), Convex subscriptions (app state)
- **Validation**: Zod
- **Testing**: Playwright
- **Package Manager**: pnpm

## 📁 Project Structure

```
├── app/                          # Next.js App Router pages
│   ├── provider/                 # Provider routes
│   │   ├── login/               # Provider authentication
│   │   └── dashboard/           # Main provider interface
│   └── [providerRoom]/[oit]/    # Patient check-in pages
├── components/                   # React components
│   ├── ui/                      # shadcn/ui components
│   ├── LeftRail/               # Encounter list
│   ├── CenterStage/            # Media canvas & workflow
│   ├── RightPanel/             # Journal & chat
│   └── TopBar/                 # Device controls
├── convex/                      # Convex backend
│   ├── schema.ts               # Database schema
│   ├── queries/                # Read operations
│   ├── mutations/              # Write operations
│   └── lib/                    # Shared utilities
├── lib/                         # Client utilities
│   ├── livekitClient.ts        # LiveKit integration
│   └── utils.ts                # Helper functions
├── stores/                      # Zustand stores
│   └── devices.ts              # Device state management
├── tests/                       # Playwright E2E tests
└── scripts/                     # Database seeding
```

## 🔧 Development

### Convex Development
```bash
# Start Convex dev server
pnpm convex:dev

# Deploy to production
pnpm convex:deploy
```

### Database Schema
The schema includes tables for:
- `encounters`: Main encounter records
- `invites`: One-time invite tokens
- `sessions`: Active participant sessions
- `participants`: Encounter participants
- `rooms`: LiveKit room mappings
- `journal_events`: Timeline of encounter events
- `workflows`: Form assignments and submissions
- `permissions`: Access control

### Adding New Features
1. **Backend**: Add queries/mutations in `convex/`
2. **Frontend**: Create components in `components/`
3. **Routes**: Add pages in `app/`
4. **Tests**: Add E2E tests in `tests/`

## 🚀 Deployment

### Vercel Deployment
1. Connect your GitHub repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy with `git push`

### Environment Variables
- `NEXT_PUBLIC_CONVEX_URL`: Your Convex deployment URL
- `LIVEKIT_URL`: LiveKit server URL
- `LIVEKIT_API_KEY`: LiveKit API key
- `LIVEKIT_API_SECRET`: LiveKit API secret

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For questions or issues:
1. Check the [Convex documentation](https://docs.convex.dev/)
2. Review the [LiveKit documentation](https://docs.livekit.io/)
3. Open an issue in this repository

---

**Note**: This is a proof-of-concept. For production use, implement proper authentication, error handling, and security measures.
