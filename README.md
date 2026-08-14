# Mental Math Game

An interactive quick mental math app designed for efficient practice using analytics to hone in on weaknesses.

**Live site:** [synapse.tkimify.com](https://synapse.tkimify.com)

## Features

- Gamified mental math practice sessions
- Ability to change question set, save presets 
- Score, accuracy, and progress tracking
- Target Weaknesses mode for personalized practice
- Performance-based identification of weaker math skills
- Account registration and login
- Persistent user progress across sessions
- Personalized practice history
- Secure logout and session handling
- Responsive design for desktop and mobile devices
- Reusable React components
- Fast development and production builds with Vite

## Technical Architecture

The client application is built with React and bundled with Vite. React components manage the game interface, authentication flow, question presentation, answer feedback, and session results.

The game engine is responsible for:

- Generating math problems
- Applying question set preset settings
- Validating submitted answers
- Recording correct and incorrect responses
- Calculating scores and accuracy
- Categorizing performance by mathematical operation
- Selecting questions for Target Weaknesses sessions

The authentication and persistence layer handles:

- User registration and login
- Authenticated sessions
- Saved player progress
- Practice history
- Skill-performance data
- Personalized weakness targeting

**Technology

- React
- JavaScript
- Vite
- CSS3
- Lucide React
- npm
- User authentication
- Persistent player data

## Project Structure

```text
.
├── public/
│   ├── synapselogo.png          # Synapse favicon and application logo
│   └── tkimifylight.png         # Footer branding
├── src/
│   ├── components/              # Reusable interface components
│   ├── features/
│   │   ├── analytics/           # Summaries, trends, and weakness analytics
│   │   ├── game/                # Timed mental-math gameplay
│   │   ├── landing/             # Main menu and game-mode selection
│   │   ├── progress/            # Account and progress-saving interface
│   │   ├── results/             # Post-game results
│   │   └── settings/            # Presets and operation settings
│   ├── lib/
│   │   ├── analytics.js         # Performance analysis
│   │   ├── problems.js          # Math-problem generation
│   │   ├── progressStorage.js   # Local progress persistence
│   │   ├── syncApi.js           # Account and cloud-sync client
│   │   ├── targeting.js         # Target Weaknesses selection logic
│   │   └── trends.js            # Historical trend calculations
│   ├── styles/
│   │   └── math-game.css        # Application visual system
│   ├── App.jsx                  # Application state and navigation
│   └── main.jsx                 # React entry point
├── functions/
│   ├── _shared/                 # Shared API and database helpers
│   └── api/
│       ├── account/             # Login, registration, saving, and deletion
│       └── sync/                # Cloudflare progress-sync endpoints
├── migrations/
│   ├── 0001_progress_codes.sql  # Legacy progress-code schema
│   └── 0002_accounts.sql        # User-account schema
├── index.html                   # Application HTML entry point
├── package.json                 # Dependencies and project scripts
├── vite.config.mjs              # Vite configuration
└── wrangler.toml                # Cloudflare Pages and D1 configuration
```
