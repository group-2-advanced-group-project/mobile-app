# Development Workflow

## Branch Structure
```
feature/your-feature → dev → prod
bugfix/your-fix    ↗
```

## Rules

- **`prod`** - Production code. Only accepts PRs from `dev`.
- **`dev`** - Integration branch. Accepts PRs from feature/bugfix branches.
- **`feature/*`** or **`bugfix/*`** - Your work. Deleted after merge.

## Workflow

### 1. Start new work
```bash
git checkout dev
git pull origin dev
git checkout -b feature/your-feature-name
```

### 2. Work and commit
```bash
git add .
git commit -m "Description of changes"
git push origin feature/your-feature-name
```

### 3. Create PR on GitHub
- Base: `dev` ← Compare: `feature/your-feature-name`
- Get 1+ approval
- Merge

### 4. Clean up
```bash
git checkout dev
git pull origin dev
git branch -d feature/your-feature-name
```

### 5. Release to production
- Create PR: `prod` ← `dev`
- Get 2+ approvals
- Merge

## Branch Naming
```
feature/   - New features (feature/push-notifications)
bugfix/    - Bug fixes (bugfix/sensor-timeout)
hotfix/    - Urgent prod fix (hotfix/critical-crash)
docs/      - Documentation (docs/setup-guide)
```

## Quick Commands
```bash
# Start work
git checkout dev && git pull && git checkout -b feature/name

# Save work  
git add . && git commit -m "msg" && git push origin feature/name

# After merge
git checkout dev && git pull && git branch -d feature/name
```

## Protection

- ✅ `prod` only accepts PRs from `dev` (enforced by GitHub Actions)
- ✅ Both `dev` and `prod` require PR approval
- ✅ CI checks must pass before merge


# Welcome to your Expo app 👋

This is an [Expo](https://expo.dev) project created with [`create-expo-app`](https://www.npmjs.com/package/create-expo-app).

## Get started

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the app

   ```bash
   npx expo start
   ```

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

You can start developing by editing the files inside the **app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).

## Get a fresh project

When you're ready, run:

```bash
npm run reset-project
```

This command will move the starter code to the **app-example** directory and create a blank **app** directory where you can start developing.

## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.
