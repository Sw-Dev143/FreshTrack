import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';

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
        dialogTitle: 'Raf Ömrüm Yedek Dosyası',
      });
    } else {
      Alert.alert('Hata', 'Paylaşım veya kaydetme desteklenmiyor.');
    }

  } catch (error) {
    console.error('Export error', error);
    Alert.alert('Hata', 'Yedekleme oluşturulurken bir hata meydana geldi.');
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
        throw new Error('Geçersiz JSON objesi');
      }

      const entries = Object.entries(parsedData).filter(([_, val]) => typeof val === 'string') as [string, string][];
      
      Alert.alert(
        'Geri Yükleme',
        'Mevcut verilerinizin üzerine yazılabilir. Emin misiniz?',
        [
          { text: 'İptal', style: 'cancel' },
          {
            text: 'Geri Yükle',
            style: 'destructive',
            onPress: async () => {
              try {
                if (entries.length > 0) {
                  await AsyncStorage.multiSet(entries);
                  Alert.alert('Başarılı', 'Verileriniz başarıyla geri yüklendi.');
                  if (onSuccess) onSuccess();
                } else {
                  Alert.alert('Uyarı', 'Geri yüklenecek geçerli veri bulunamadı.');
                }
              } catch (e) {
                console.error(e);
                Alert.alert('Hata', 'Veriler geri yüklenirken hata oluştu.');
              }
            }
          }
        ]
      );
    }
  } catch (error) {
    console.error('Import error', error);
    Alert.alert('Hata', 'Yedek dosyası okunurken hata oluştu. Dosya hatalı olabilir.');
  }
};
