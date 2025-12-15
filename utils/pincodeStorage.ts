// Client-side utility functions for managing temporary pincode storage

export function saveTemporaryPincode(pincode: string, pincodeData?: any) {
  if (typeof window !== 'undefined') {
    const tempData = {
      pincode,
      data: pincodeData,
      timestamp: Date.now()
    };
    localStorage.setItem('temp_pincode', JSON.stringify(tempData));
  }
}

export function getTemporaryPincode() {
  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem('temp_pincode');
      if (stored) {
        const parsed = JSON.parse(stored);
        // Check if stored data is less than 24 hours old
        if (Date.now() - parsed.timestamp < 24 * 60 * 60 * 1000) {
          return parsed;
        } else {
          localStorage.removeItem('temp_pincode');
        }
      }
    } catch (error) {
      console.error('Error reading temporary pincode:', error);
      localStorage.removeItem('temp_pincode');
    }
  }
  return null;
}

export function clearTemporaryPincode() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('temp_pincode');
  }
}