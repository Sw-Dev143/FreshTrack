import AsyncStorage from '@react-native-async-storage/async-storage';
import * as StoreReview from 'expo-store-review';

const APP_LAUNCH_COUNT_KEY = '@raf_omrum_launch_count';
const LAST_REVIEW_PROMPT_KEY = '@raf_omrum_last_review_prompt';
const ACTION_COUNT_KEY = '@raf_omrum_action_count';
const HAS_REVIEWED_KEY = '@raf_omrum_has_reviewed';

export const incrementLaunchCount = async () => {
  try {
    const launchCountStr = await AsyncStorage.getItem(APP_LAUNCH_COUNT_KEY);
    const count = launchCountStr ? parseInt(launchCountStr, 10) + 1 : 1;
    await AsyncStorage.setItem(APP_LAUNCH_COUNT_KEY, count.toString());
    return count;
  } catch (error) {
    return 1;
  }
};

export const incrementActionCount = async () => {
  try {
    const countStr = await AsyncStorage.getItem(ACTION_COUNT_KEY);
    const count = countStr ? parseInt(countStr, 10) + 1 : 1;
    await AsyncStorage.setItem(ACTION_COUNT_KEY, count.toString());
    return count;
  } catch (error) {
    return 1;
  }
};

export const requestReviewIfAppropriate = async (isAction: boolean = false) => {
  try {
    // Check if user already reviewed (manual flag, optional)
    const hasReviewed = await AsyncStorage.getItem(HAS_REVIEWED_KEY);
    if (hasReviewed === 'true') return;

    if (!(await StoreReview.hasAction())) {
      return;
    }

    const lastPromptStr = await AsyncStorage.getItem(LAST_REVIEW_PROMPT_KEY);
    const now = Date.now();
    // 7 günden önce tekrar sorma
    if (lastPromptStr) {
      const lastPrompt = parseInt(lastPromptStr, 10);
      const daysSinceLastPrompt = (now - lastPrompt) / (1000 * 60 * 60 * 24);
      if (daysSinceLastPrompt < 7) {
        return;
      }
    }

    let shouldPrompt = false;

    if (isAction) {
      // Aksiyona bağlı (Örn: 5. ürün ekleyişinde)
      const actionsStr = await AsyncStorage.getItem(ACTION_COUNT_KEY);
      const actions = actionsStr ? parseInt(actionsStr, 10) : 0;
      if (actions >= 3) {
        shouldPrompt = true;
      }
    } else {
      // Açılışa bağlı (Örn: 3. açılışta)
      const launchCountStr = await AsyncStorage.getItem(APP_LAUNCH_COUNT_KEY);
      const launches = launchCountStr ? parseInt(launchCountStr, 10) : 0;
      if (launches >= 3) {
        shouldPrompt = true;
      }
    }

    if (shouldPrompt) {
      await StoreReview.requestReview();
      await AsyncStorage.setItem(LAST_REVIEW_PROMPT_KEY, now.toString());
    }
  } catch (error) {
    console.warn('Store review error', error);
  }
};
