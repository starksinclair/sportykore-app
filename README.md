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

## TODO

- Put all the querykeys in the hook file for each feature, instead of creating a new queryKey file for each features
  so for the manage screen, check if the user is logged in first, if not display a message to log in to view your leagues, and then if authenticated, first display a list of the user's leagues, and then the click on one, we will be using the users native password, biometries, face id, to grant them access to manage that resource, if they don't have passwords set up on their phone let them access the manage page,

then on the manage/[id] page, there will be three tabs for now:

Game: Three sections: Live Now, Upcoming, Results.

AddGameForm to schedule new games.

Live games: Open Match Center launches LiveMatchCenter — full-screen, busy-admin-friendly:

Big scoreboard with Auto vs Manual scoring toggle.

In Auto: tap player → pick event (Goal, Assist, Own Goal, Yellow, Red); goals & own goals auto-update the score.

In Manual: +/- buttons on each side.

Start Match, End Match, Undo last event, per-event delete.

Recent events feed with team labels.

Upcoming: Start button (sets status live and opens Match Center).

Completed: edit score inline, Reopen match, Delete.

Players tab: coming soon

Settings tab: Edit league info (name, season, description).

Add new season.
