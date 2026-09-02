import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';
import i18n from '../i18n';

export const exportBackup = async () => {
  try {
    // 1. Get all keys
    const keys = await AsyncStorage.getAllKeys();
    // Filter out keys we don't want to backup (optionally, here we backup everything)
    const result = await AsyncStorage.multiGet(keys);
    
    // 2. Convert to JSON
    const backupData = result.reduce((acc, [key, value]) => {
      acc[key] = value;
      return acc;
    }, {} as Record<string, string | null>);

    const jsonString = JSON.stringify(backupData, null, 2);
    const dateStr = new Date().toISOString().split('T')[0];
    const fileUri = FileSystem.documentDirectory + `rafomrum-yedek-${dateStr}.json`;

    // 3. Write to file
    await FileSystem.writeAsStringAsync(fileUri, jsonString, {
      encoding: FileSystem.EncodingType.UTF8,
    });

    // 4. Share / Save
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(fileUri, {
        mimeType: 'application/json',
        dialogTitle: 'FreshTrack Backup File',
      });
    } else {
      Alert.alert(i18n.t('common.error'), i18n.t('settings.backup.errorSharing'));
    }

  } catch (error) {
    console.error('Export error', error);
    Alert.alert(i18n.t('common.error'), i18n.t('settings.backup.errorExport'));
  }
};

export const importBackup = async (onSuccess?: () => void) => {
  try {
    const result = await DocumentPicker.getDocumentAsync({
      type: ['application/json', 'text/plain', '*/*'],
      copyToCacheDirectory: true,
    });

    if (result.canceled) return;

    if (result.assets && result.assets.length > 0) {
      const fileUri = result.assets[0].uri;
      const fileContent = await FileSystem.readAsStringAsync(fileUri, {
        encoding: FileSystem.EncodingType.UTF8,
      });

      const parsedData = JSON.parse(fileContent);

      if (typeof parsedData !== 'object' || parsedData === null) {
        throw new Error(i18n.t('settings.backup.invalidJson'));
      }

      const entries = Object.entries(parsedData).filter(([_, val]) => typeof val === 'string') as [string, string][];
      
      Alert.alert(
        i18n.t('settings.backup.confirmTitle'),
        i18n.t('settings.backup.confirmMessage'),
        [
          { text: i18n.t('common.cancel'), style: 'cancel' },
          {
            text: i18n.t('settings.backup.restoreBtn'),
            style: 'destructive',
            onPress: async () => {
              try {
                if (entries.length > 0) {
                  await AsyncStorage.multiSet(entries);
                  Alert.alert(i18n.t('common.success'), i18n.t('settings.backup.success'));
                  if (onSuccess) onSuccess();
                } else {
                  Alert.alert(i18n.t('common.error'), i18n.t('settings.backup.noData'));
                }
              } catch (e) {
                console.error(e);
                Alert.alert(i18n.t('common.error'), i18n.t('settings.backup.errorImport'));
              }
            }
          }
        ]
      );
    }
  } catch (error) {
    console.error('Import error', error);
    Alert.alert(i18n.t('common.error'), i18n.t('settings.backup.errorReadFile'));
  }
};
