// src/services/notificationService.ts
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { auth, db } from '../config/firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';

// Configure notifications
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

// Interface for notification data
interface NotificationData {
  title: string;
  body: string;
  data?: Record<string, string>;
}

/**
 * Register for push notifications
 */
export const registerForPushNotifications = async (): Promise<string | null> => {
  try {
    // Check if device is physical (not simulator/emulator)
    if (!Device.isDevice) {
      console.log('Push notifications are not available on simulator/emulator');
      return null;
    }
    
    // Check permissions
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    // Request permissions if not granted
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    
    // Return null if permission not granted
    if (finalStatus !== 'granted') {
      console.log('Permission for push notifications was denied');
      return null;
    }
    
    // Get push token
    const token = (await Notifications.getExpoPushTokenAsync({
      projectId: 'your-expo-project-id', // Replace with your actual Expo project ID
    })).data;
    
    // Save token to user profile
    const userId = auth.currentUser?.uid;
    if (userId) {
      await saveUserPushToken(userId, token);
    }
    
    // Configure notification categories for iOS
    if (Platform.OS === 'ios') {
      await configureIOSCategories();
    }
    
    return token;
  } catch (error) {
    console.error('Error registering for push notifications:', error);
    return null;
  }
};

/**
 * Save user push token to Firestore
 */
const saveUserPushToken = async (userId: string, token: string): Promise<void> => {
  try {
    const userRef = doc(db, 'users', userId);
    
    // Get existing user data
    const userDoc = await getDoc(userRef);
    const userData = userDoc.exists() ? userDoc.data() : {};
    
    // Update user data with push token
    await setDoc(userRef, {
      ...userData,
      pushToken: token,
      pushTokenUpdatedAt: new Date(),
      deviceInfo: {
        platform: Platform.OS,
        version: Platform.Version,
        deviceName: Device.deviceName || 'Unknown',
      },
    }, { merge: true });
  } catch (error) {
    console.error('Error saving push token:', error);
  }
};

/**
 * Configure notification categories for iOS
 */
const configureIOSCategories = async (): Promise<void> => {
  await Notifications.setNotificationCategoryAsync('game_invite', [
    {
      identifier: 'accept',
      buttonTitle: 'Join Game',
      options: {
        isDestructive: false,
        isAuthenticationRequired: false,
      },
    },
    {
      identifier: 'decline',
      buttonTitle: 'Decline',
      options: {
        isDestructive: true,
        isAuthenticationRequired: false,
      },
    },
  ]);
  
  await Notifications.setNotificationCategoryAsync('game_turn', [
    {
      identifier: 'play_now',
      buttonTitle: 'Play Now',
      options: {
        isDestructive: false,
        isAuthenticationRequired: false,
      },
    },
  ]);
};

/**
 * Schedule a local notification
 */
export const scheduleLocalNotification = async (
  notification: NotificationData,
  trigger: Notifications.NotificationTriggerInput = null
): Promise<string> => {
  try {
    const { title, body, data } = notification;
    
    // Schedule notification
    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data: data || {},
        sound: true,
        badge: 1,
      },
      trigger,
    });
    
    return notificationId;
  } catch (error) {
    console.error('Error scheduling notification:', error);
    throw error;
  }
};

/**
 * Send immediate local notification
 */
export const sendImmediateNotification = async (
  notification: NotificationData
): Promise<string> => {
  return await scheduleLocalNotification(notification);
};

/**
 * Cancel a scheduled notification
 */
export const cancelNotification = async (notificationId: string): Promise<void> => {
  try {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
  } catch (error) {
    console.error('Error canceling notification:', error);
  }
};

/**
 * Cancel all scheduled notifications
 */
export const cancelAllNotifications = async (): Promise<void> => {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
  } catch (error) {
    console.error('Error canceling all notifications:', error);
  }
};

/**
 * Set app badge number
 */
export const setBadgeCount = async (count: number): Promise<void> => {
  try {
    await Notifications.setBadgeCountAsync(count);
  } catch (error) {
    console.error('Error setting badge count:', error);
  }
};

/**
 * Get notification listeners
 */
export const getNotificationListeners = () => {
  // Handle notification received while app is running
  const notificationListener = Notifications.addNotificationReceivedListener(
    (notification) => {
      console.log('Notification received:', notification);
    }
  );
  
  // Handle notification response (user tapped notification)
  const responseListener = Notifications.addNotificationResponseReceivedListener(
    (response) => {
      console.log('Notification response:', response);
      
      // Handle notification action
      const { actionIdentifier, notification } = response;
      const { data } = notification.request.content;
      
      // Handle different actions
      switch (actionIdentifier) {
        case 'accept':
          // Handle game invite accept
          if (data.gameId) {
            // Navigate to game lobby
            // navigation.navigate('GameLobby', { gameId: data.gameId });
          }
          break;
        case 'play_now':
          // Handle play now action
          if (data.gameId) {
            // Navigate to game
            // navigation.navigate('Game', { gameId: data.gameId });
          }
          break;
        default:
          // Default action (notification tapped)
          if (data.gameId) {
            // Navigate to game
            // navigation.navigate('Game', { gameId: data.gameId });
          }
          break;
      }
    }
  );
  
  // Return cleanup function
  return () => {
    Notifications.removeNotificationSubscription(notificationListener);
    Notifications.removeNotificationSubscription(responseListener);
  };
};

/**
 * Game-specific notification functions
 */

// Notify player it's their turn
export const notifyPlayerTurn = async (
  playerName: string,
  promptText: string
): Promise<string> => {
  return await sendImmediateNotification({
    title: 'Your Turn!',
    body: `${playerName}, it's your turn to create an image for: "${promptText}"`,
    data: {
      type: 'player_turn',
      promptText,
    },
  });
};

// Notify player that voting has started
export const notifyVotingStarted = async (): Promise<string> => {
  return await sendImmediateNotification({
    title: 'Voting Time!',
    body: 'Time to vote on the funniest images! Your vote counts!',
    data: {
      type: 'voting_started',
    },
  });
};

// Notify player of round results
export const notifyRoundResults = async (
  roundNumber: number,
  winnerName: string,
  playerScore: number
): Promise<string> => {
  return await sendImmediateNotification({
    title: `Round ${roundNumber} Results`,
    body: `${winnerName} won the round! Your score: ${playerScore} points`,
    data: {
      type: 'round_results',
      roundNumber: roundNumber.toString(),
      winnerName,
      playerScore: playerScore.toString(),
    },
  });
};

// Notify player of game results
export const notifyGameResults = async (
  winnerName: string,
  playerScore: number,
  isWinner: boolean
): Promise<string> => {
  const title = isWinner ? 'You Won!' : 'Game Over!';
  const body = isWinner
    ? `Congratulations! You won with ${playerScore} points!`
    : `${winnerName} won with ${playerScore} points!`;
  
  return await sendImmediateNotification({
    title,
    body,
    data: {
      type: 'game_results',
      winnerName,
      playerScore: playerScore.toString(),
      isWinner: isWinner.toString(),
    },
  });
};

// Remind inactive player to return
export const remindInactivePlayer = async (
  gameId: string,
  timeLeft: number
): Promise<string> => {
  return await sendImmediateNotification({
    title: 'We Miss You!',
    body: `Your friends are waiting for you! ${timeLeft} seconds left to submit your image.`,
    data: {
      type: 'inactive_reminder',
      gameId,
      timeLeft: timeLeft.toString(),
    },
  });
};

// Notify player of game invitation
export const notifyGameInvitation = async (
  gameId: string,
  hostName: string,
  joinCode: string
): Promise<string> => {
  return await sendImmediateNotification({
    title: 'Game Invitation',
    body: `${hostName} invited you to play AI Party Game! Join code: ${joinCode}`,
    data: {
      type: 'game_invitation',
      gameId,
      hostName,
      joinCode,
    },
  });
};