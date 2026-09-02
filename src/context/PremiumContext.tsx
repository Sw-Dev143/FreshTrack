import React, { createContext, useState, useEffect, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

type PremiumContextType = {
  isPremium: boolean;
  unlockPremium: () => Promise<void>;
};

const PremiumContext = createContext<PremiumContextType>({
  isPremium: false,
  unlockPremium: async () => {},
});

export const PremiumProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isPremium, setIsPremium] = useState(false);

  useEffect(() => {
    const checkPremiumStatus = async () => {
      try {
        const storedStatus = await AsyncStorage.getItem('@premium_status');
        if (storedStatus === 'true') {
          setIsPremium(true);
        }
      } catch (e) {
        console.error('Error reading premium status', e);
      }
    };
    checkPremiumStatus();
  }, []);

  const unlockPremium = async () => {
    try {
      await AsyncStorage.setItem('@premium_status', 'true');
      setIsPremium(true);
    } catch (e) {
      console.error('Error saving premium status', e);
    }
  };

  return (
    <PremiumContext.Provider value={{ isPremium, unlockPremium }}>
      {children}
    </PremiumContext.Provider>
  );
};

export const usePremium = () => useContext(PremiumContext);
