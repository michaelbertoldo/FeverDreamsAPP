# AI Party Game - iOS App

A hilarious multiplayer party game where players respond to silly prompts and AI generates funny images using their selfies. Vote for the funniest creations to win!

## 🎮 Features

- **Quiplash-style gameplay** with 3 rounds of increasing difficulty
- **AI-powered image generation** using player selfies and prompts
- **Real-time multiplayer** with Socket.IO
- **Firebase integration** for auth and storage
- **Professional UI** with smooth animations
- **Gallery** to save and share your funniest creations

## 🚀 Setup Instructions

### Prerequisites

- Node.js 18+
- Expo CLI
- iOS Simulator or physical iPhone
- Firebase account
- Replicate API key

### 1. Clone and Install

```bash
# Clone the repository
git clone <your-repo-url>
cd ai-party-game-ios

# Install client dependencies
npm install

# Install server dependencies
cd server
npm install
```

### 2. Configure Environment Variables

#### Client (.env):
```
FIREBASE_API_KEY=your_firebase_api_key
FIREBASE_AUTH_DOMAIN=your_auth_domain
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_STORAGE_BUCKET=your_storage_bucket
FIREBASE_MESSAGING_SENDER_ID=your_sender_id
FIREBASE_APP_ID=your_app_id
```

#### Server (server/env.example):
```
REPLICATE_API_TOKEN=your_replicate_api_token
PORT=3000
```

### 3. Firebase Setup

1. Create a new Firebase project
2. Enable Authentication (Email/Password and Apple Sign-In)
3. Create Firestore database
4. Enable Storage
5. Add iOS app configuration
6. Download GoogleService-Info.plist and add to project

### 4. Start Development

```bash
# Start the server
cd server
npm run dev

# In another terminal, start the client
cd ..
npm start

# Press 'i' to open iOS simulator
```

## 📱 Building for Production

### iOS Build:
```bash
# Build for iOS
expo build:ios

# Or use EAS Build
eas build --platform ios
```

### Server Deployment:
Deploy the server to your preferred hosting service (Heroku, AWS, etc.)

## 🐛 Troubleshooting

### Navigation Error Fix:
The navigation structure has been completely rebuilt to fix the "MainTabs" error. The app now properly handles authentication flow and game state transitions.

### Common Issues:

1. **Camera not working**: Ensure camera permissions are granted in iOS settings
2. **Socket connection failed**: Check server URL in socketService.ts
3. **Firebase auth error**: Verify Firebase configuration is correct
4. **AI image generation timeout**: Check Replicate API key and quota

## 🎯 Game Flow

1. **Sign Up/Login** → Upload selfie
2. **Home Screen** → Create or join game
3. **Game Lobby** → Wait for players (3-8 players)
4. **Round 1-3** → Answer prompts (60 seconds)
5. **Voting Phase** → Vote for funniest images
6. **Round Results** → See scores
7. **Final Results** → Crown the winner!

## 🛠️ Tech Stack

- **Frontend**: React Native, Expo, TypeScript
- **State Management**: Redux Toolkit
- **Navigation**: React Navigation
- **Backend**: Node.js, Express, Socket.IO
- **AI**: Replicate API (Flux + Face Swap)
- **Database**: Firebase Firestore
- **Storage**: Firebase Storage
- **Auth**: Firebase Auth

## 📄 License

MIT

## 🤝 Contributing

Pull requests are welcome! Please read contributing guidelines first.

## 📧 Support

For issues or questions, please open a GitHub issue or contact support.
