'use server';

import { createClient } from '@/utils/supabase/server';
import { createOrder } from '@/lib/database/orders';
import { revalidatePath } from 'next/cache';

export async function placeOrder(orderData: {
    items: Array<{
        meal_id?: string;
        custom_meal_id?: string;
        quantity: number;
        unit_price: number;
    }>;
    delivery_address: string;
    delivery_date?: string;
    notes?: string;
    payment_method?: string;
    customer_details?: {
        name: string;
        phone: string;
    };
}) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { success: false, error: 'User not authenticated' };
    }

    try {
        // Check and update profile if needed
        if (orderData.customer_details) {
            const { data: profile } = await supabase
                .from('profiles')
                .select('name, phone_number, address')
                .eq('id', user.id)
                .single();

            const updates: any = {};
            if (profile) {
                if (!profile.name && orderData.customer_details.name) updates.name = orderData.customer_details.name;
                if (!profile.phone_number && orderData.customer_details.phone) updates.phone_number = orderData.customer_details.phone;
                if (!profile.address && orderData.delivery_address) updates.address = orderData.delivery_address;

                if (Object.keys(updates).length > 0) {
                    await supabase
                        .from('profiles')
                        .update(updates)
                        .eq('id', user.id);
                }
            }
        }

        const order = await createOrder({
            customer_id: user.id,
            items: orderData.items,
            delivery_address: orderData.delivery_address,
            delivery_date: orderData.delivery_date,
            notes: orderData.notes,
            payment_method: orderData.payment_method
        });

        revalidatePath('/profile');
        return { success: true, order };
    } catch (error) {
        console.error('Failed to place order:', error);
        return { success: false, error: 'Failed to place order' };
    }
}
