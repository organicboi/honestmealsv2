'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { 
  checkPincodeServiceability, 
  PincodeResult, 
  getUserPincode,
  getNearbyServiceablePincodes,
  updateUserPincode
} from '@/app/actions/pincode';
import { 
  saveTemporaryPincode,
  getTemporaryPincode,
  clearTemporaryPincode
} from '@/utils/pincodeStorage';

interface PincodeContextType {
  currentPincode: string | null;
  pincodeResult: PincodeResult | null;
  isChecking: boolean;
  isServiceable: boolean;
  nearbyPincodes: any[];
  isTemporary: boolean;
  checkPincode: (pincode: string) => Promise<PincodeResult>;
  selectTemporaryPincode: (pincode: string, pincodeData: any) => void;
  updatePincode: (pincode: string) => void;
  clearPincode: () => void;
  syncToDatabase: () => Promise<void>;
}

const PincodeContext = createContext<PincodeContextType | undefined>(undefined);

export function PincodeProvider({ 
  children, 
  user 
}: { 
  children: ReactNode;
  user?: any;
}) {
  const [currentPincode, setCurrentPincode] = useState<string | null>(null);
  const [pincodeResult, setPincodeResult] = useState<PincodeResult | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [nearbyPincodes, setNearbyPincodes] = useState<any[]>([]);
  const [isTemporary, setIsTemporary] = useState(false);

  // Load user's saved pincode or temporary pincode on mount
  useEffect(() => {
    if (user?.id) {
      loadUserPincode(user.id);
      // Sync any temporary pincode to database
      syncToDatabase();
    } else {
      // Load temporary pincode for non-logged users
      loadTemporaryPincode();
    }
  }, [user?.id]);

  const loadUserPincode = async (userId: string) => {
    try {
      const userData = await getUserPincode(userId);
      if (userData?.pincode) {
        setCurrentPincode(userData.pincode);
        const result = await checkPincodeServiceability(userData.pincode);
        setPincodeResult(result);
        setIsTemporary(false);
      }
    } catch (error) {
      console.error('Error loading user pincode:', error);
    }
  };

  const loadTemporaryPincode = () => {
    const tempData = getTemporaryPincode();
    if (tempData?.pincode) {
      setCurrentPincode(tempData.pincode);
      setPincodeResult(tempData.data || null);
      setIsTemporary(true);
    }
  };

  const syncToDatabase = async () => {
    if (user?.id) {
      try {
        const tempData = getTemporaryPincode();
        if (tempData?.pincode) {
          const result = await updateUserPincode(user.id, tempData.pincode);
          if (result.success) {
            clearTemporaryPincode();
            setIsTemporary(false);
          }
        }
      } catch (error) {
        console.error('Error syncing pincode to database:', error);
      }
    }
  };

  const checkPincode = async (pincode: string): Promise<PincodeResult> => {
    setIsChecking(true);
    setNearbyPincodes([]);
    
    try {
      const result = await checkPincodeServiceability(pincode);
      setPincodeResult(result);
      
      if (result.is_serviceable) {
        setCurrentPincode(pincode);
        setIsTemporary(!user?.id);
        
        if (user?.id) {
          // Update database for logged-in users
          await updateUserPincode(user.id, pincode);
        } else {
          // Save to localStorage for non-logged users
          saveTemporaryPincode(pincode, result);
        }
      } else {
        // Get nearby serviceable pincodes for non-serviceable areas
        const nearby = await getNearbyServiceablePincodes(pincode);
        setNearbyPincodes(nearby);
      }
      
      return result;
    } catch (error) {
      console.error('Error checking pincode:', error);
      const errorResult: PincodeResult = {
        is_serviceable: false,
        delivery_fee: 0,
        delivery_hours: 0,
        city: '',
        state: '',
        zone_type: '',
        min_order_amount: 0,
        free_delivery_threshold: 0,
        message: 'Unable to check pincode. Please try again.'
      };
      setPincodeResult(errorResult);
      return errorResult;
    } finally {
      setIsChecking(false);
    }
  };

  const selectTemporaryPincode = async (pincode: string, pincodeData: any) => {
    setCurrentPincode(pincode);
    setPincodeResult(pincodeData);
    setIsTemporary(!user?.id);
    setNearbyPincodes([]);
    
    if (user?.id) {
      // Update database for logged-in users
      await updateUserPincode(user.id, pincode);
      setIsTemporary(false);
    } else {
      // Save to localStorage for non-logged users
      saveTemporaryPincode(pincode, pincodeData);
    }
  };

  const updatePincode = (pincode: string) => {
    setCurrentPincode(pincode);
  };

  const clearPincode = () => {
    setCurrentPincode(null);
    setPincodeResult(null);
    setNearbyPincodes([]);
    setIsTemporary(false);
    clearTemporaryPincode();
  };

  const value: PincodeContextType = {
    currentPincode,
    pincodeResult,
    isChecking,
    isServiceable: pincodeResult?.is_serviceable || false,
    nearbyPincodes,
    isTemporary,
    checkPincode,
    selectTemporaryPincode,
    updatePincode,
    clearPincode,
    syncToDatabase
  };

  return (
    <PincodeContext.Provider value={value}>
      {children}
    </PincodeContext.Provider>
  );
}

export function usePincode() {
  const context = useContext(PincodeContext);
  if (context === undefined) {
    throw new Error('usePincode must be used within a PincodeProvider');
  }
  return context;
}