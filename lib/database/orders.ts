import { createClient } from '@/utils/supabase/server';
import type { Order, OrderWithItems, OrderItem } from '@/types/database.types';

export async function getUserOrders(userId: string, limit?: number) {
  const supabase = await createClient();
  
  let query = supabase
    .from('orders')
    .select(`
      *,
      order_items (
        *,
        meals (
          id,
          name,
          image_url,
          price
        ),
        custom_meals (
          id,
          name,
          total_price
        )
      )
    `)
    .eq('customer_id', userId)
    .order('created_at', { ascending: false });

  if (limit) {
    query = query.limit(limit);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching orders:', error);
    return [];
  }

  return data as OrderWithItems[];
}

export async function getOrderById(orderId: string) {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('orders')
    .select(`
      *,
      order_items (
        *,
        meals (
          id,
          name,
          description,
          image_url,
          price,
          calories,
          protein
        ),
        custom_meals (
          id,
          name,
          description,
          total_price,
          calories,
          protein
        )
      ),
      profiles (
        name,
        email,
        phone_number,
        address
      )
    `)
    .eq('id', orderId)
    .single();

  if (error) {
    console.error('Error fetching order:', error);
    return null;
  }

  return data as OrderWithItems;
}

export async function createOrder(data: {
  customer_id: string;
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
}) {
  const supabase = await createClient();
  
  // Calculate total
  const total_amount = data.items.reduce(
    (sum, item) => sum + (item.unit_price * item.quantity),
    0
  );

  // Create order
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .insert({
      customer_id: data.customer_id,
      total_amount,
      delivery_address: data.delivery_address,
      delivery_date: data.delivery_date,
      notes: data.notes,
      payment_method: data.payment_method,
      status: 'pending',
      payment_status: 'pending',
    })
    .select()
    .single();

  if (orderError) {
    console.error('Error creating order:', orderError);
    return { success: false, error: orderError.message };
  }

  // Create order items
  const orderItems = data.items.map(item => ({
    order_id: order.id,
    meal_id: item.meal_id,
    custom_meal_id: item.custom_meal_id,
    quantity: item.quantity,
    unit_price: item.unit_price,
    total_price: item.unit_price * item.quantity,
    is_customized: !!item.custom_meal_id,
  }));

  const { error: itemsError } = await supabase
    .from('order_items')
    .insert(orderItems);

  if (itemsError) {
    console.error('Error creating order items:', itemsError);
    // Rollback order creation
    await supabase.from('orders').delete().eq('id', order.id);
    return { success: false, error: itemsError.message };
  }

  return { success: true, data: order };
}

export async function updateOrderStatus(
  orderId: string,
  status: 'pending' | 'confirmed' | 'preparing' | 'out_for_delivery' | 'delivered' | 'cancelled'
) {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('orders')
    .update({
      status,
      updated_at: new Date().toISOString(),
    })
    .eq('id', orderId)
    .select()
    .single();

  if (error) {
    console.error('Error updating order status:', error);
    return { success: false, error: error.message };
  }

  return { success: true, data };
}

export async function cancelOrder(orderId: string) {
  return updateOrderStatus(orderId, 'cancelled');
}

export async function getOrderStats(userId: string) {
  const supabase = await createClient();
  
  const { data: orders } = await supabase
    .from('orders')
    .select('id, total_amount, status')
    .eq('customer_id', userId);

  if (!orders) return null;

  return {
    totalOrders: orders.length,
    totalSpent: orders.reduce((sum, order) => sum + Number(order.total_amount), 0),
    pendingOrders: orders.filter(o => o.status === 'pending').length,
    completedOrders: orders.filter(o => o.status === 'delivered').length,
  };
}
