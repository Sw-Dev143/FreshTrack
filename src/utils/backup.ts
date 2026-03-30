import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import { Alert } from 'react-native';

export const exportData = async () => {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const result = await AsyncStorage.multiGet(keys);
    const data: Record<string, string | null> = {};
    result.forEach(([k, v]) => { data[k] = v; });

    const jsonStr = JSON.stringify(data);
    const fileUri = FileSystem.documentDirectory + 'Raf_Omrum_Yedek.json';
    
    await FileSystem.writeAsStringAsync(fileUri, jsonStr, { encoding: FileSystem.EncodingType.UTF8 });

    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(fileUri, { UTI: 'public.json', mimeType: 'application/json' });
    } else {
      Alert.alert('Hata', 'Paylaşım bu cihazda desteklenmiyor.');
    }
  } catch (e: any) {
    Alert.alert('Hata', 'Veriler dışa aktarılamadı: ' + e.message);
    console.error(e);
  }
};

export const importData = async (onSuccess: () => void) => {
  try {
    const result = await DocumentPicker.getDocumentAsync({ type: 'application/json', copyToCacheDirectory: true });
    
    if (!result.canceled && result.assets && result.assets.length > 0) {
      const fileUri = result.assets[0].uri;
      const content = await FileSystem.readAsStringAsync(fileUri, { encoding: FileSystem.EncodingType.UTF8 });
      const data: Record<string, string | null> = JSON.parse(content);

      // Validate data structure
      if (typeof data === 'object' && data !== null && Object.keys(data).length > 0) {
        
        // Optionally clear before load, but merging/overwriting is safer
        const kvPairs: [string, string][] = [];
        for (const [k, v] of Object.entries(data)) {
          if (v !== null) kvPairs.push([k, v]);
        }
        
        await AsyncStorage.multiSet(kvPairs);
        Alert.alert('Başarılı', 'Yedek başarıyla geri yüklendi.', [{ text: 'Tamam', onPress: onSuccess }]);
      } else {
        Alert.alert('Hata', 'Geçersiz dosya formatı.');
      }
    }
  } catch (e: any) {
    Alert.alert('Hata', 'Veriler içe aktarılamadı: ' + e.message);
    console.error(e);
  }
};
