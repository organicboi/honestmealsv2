'use server';

import { createClient } from '@/utils/supabase/server';

export interface PincodeResult {
  is_serviceable: boolean;
  delivery_fee: number;
  delivery_hours: number;
  city: string;
  state: string;
  zone_type: string;
  min_order_amount: number;
  free_delivery_threshold: number;
  message: string;
  area_name?: string;
  is_express_available?: boolean;
  express_delivery_fee?: number;
  express_delivery_hours?: number;
}

export async function checkPincodeServiceability(pincode: string): Promise<PincodeResult> {
  const supabase = await createClient();
  
  try {
    // Validate pincode format (Indian 6-digit format)
    if (!/^[1-9][0-9]{5}$/.test(pincode)) {
      return {
        is_serviceable: false,
        delivery_fee: 0,
        delivery_hours: 0,
        city: '',
        state: '',
        zone_type: '',
        min_order_amount: 0,
        free_delivery_threshold: 0,
        message: 'Please enter a valid 6-digit pincode'
      };
    }

    // Use the database function we created
    const { data, error } = await supabase
      .rpc('check_pincode_serviceability', { input_pincode: pincode });

    if (error) {
      console.error('Error checking pincode:', error);
      return {
        is_serviceable: false,
        delivery_fee: 0,
        delivery_hours: 0,
        city: '',
        state: '',
        zone_type: '',
        min_order_amount: 0,
        free_delivery_threshold: 0,
        message: 'Unable to check pincode at the moment. Please try again.'
      };
    }

    if (!data || data.length === 0) {
      return {
        is_serviceable: false,
        delivery_fee: 0,
        delivery_hours: 0,
        city: '',
        state: '',
        zone_type: '',
        min_order_amount: 0,
        free_delivery_threshold: 0,
        message: 'This pincode is not in our service area yet. We are expanding soon!'
      };
    }

    const result = data[0];
    return {
      is_serviceable: result.is_serviceable,
      delivery_fee: result.delivery_fee,
      delivery_hours: result.delivery_hours,
      city: result.city,
      state: result.state,
      zone_type: result.zone_type,
      min_order_amount: result.min_order_amount,
      free_delivery_threshold: result.free_delivery_threshold,
      message: result.message
    };

  } catch (error) {
    console.error('Unexpected error:', error);
    return {
      is_serviceable: false,
      delivery_fee: 0,
      delivery_hours: 0,
      city: '',
      state: '',
      zone_type: '',
      min_order_amount: 0,
      free_delivery_threshold: 0,
      message: 'Something went wrong. Please try again later.'
    };
  }
}

export async function logPincodeCheck(pincode: string, userId?: string) {
  const supabase = await createClient();
  
  try {
    const result = await checkPincodeServiceability(pincode);
    
    await supabase
      .from('pincode_check_logs')
      .insert({
        pincode,
        user_id: userId,
        is_serviceable: result.is_serviceable,
        checked_at: new Date().toISOString()
      });
    
    return result;
  } catch (error) {
    console.error('Error logging pincode check:', error);
    return await checkPincodeServiceability(pincode);
  }
}

export async function getUserPincode(userId: string) {
  const supabase = await createClient();
  
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('pincode, location, delivery_address_verified')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Error fetching user pincode:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Unexpected error fetching pincode:', error);
    return null;
  }
}

export async function getNearbyServiceablePincodes(inputPincode: string, limit: number = 5) {
  const supabase = await createClient();
  
  try {
    // Get pincodes from the same city/state or nearby areas
    const { data, error } = await supabase
      .from('serviceable_pincodes')
      .select('*')
      .eq('is_serviceable', true)
      .limit(limit);

    if (error) {
      console.error('Error fetching nearby pincodes:', error);
      return [];
    }

    if (!data || data.length === 0) {
      return [];
    }

    // Sort by zone type preference (metro > tier1 > tier2 > tier3)
    const zoneOrder = { 'metro': 1, 'tier1': 2, 'tier2': 3, 'tier3': 4, 'remote': 5 };
    
    return data
      .sort((a, b) => {
        const aOrder = zoneOrder[a.zone_type as keyof typeof zoneOrder] || 6;
        const bOrder = zoneOrder[b.zone_type as keyof typeof zoneOrder] || 6;
        return aOrder - bOrder;
      })
      .slice(0, limit);

  } catch (error) {
    console.error('Unexpected error fetching nearby pincodes:', error);
    return [];
  }
}

export async function updateUserPincode(userId: string, pincode: string) {
  const supabase = await createClient();
  
  try {
    // First validate the pincode
    const serviceabilityResult = await checkPincodeServiceability(pincode);
    
    const { data, error } = await supabase
      .from('profiles')
      .update({ 
        pincode,
        delivery_address_verified: serviceabilityResult.is_serviceable,
        location: serviceabilityResult.is_serviceable ? 
          `${serviceabilityResult.city}, ${serviceabilityResult.state}` : null
      })
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      console.error('Error updating user pincode:', error);
      return { success: false, error: 'Failed to update pincode' };
    }

    return { 
      success: true, 
      data,
      serviceability: serviceabilityResult
    };
  } catch (error) {
    console.error('Unexpected error updating pincode:', error);
    return { success: false, error: 'Something went wrong' };
  }
}

