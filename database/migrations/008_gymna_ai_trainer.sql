-- Add credits to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS gymna_credits INTEGER DEFAULT 10;

-- Create chats table
CREATE TABLE IF NOT EXISTS gymna_chats (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create messages table
CREATE TABLE IF NOT EXISTS gymna_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    chat_id UUID REFERENCES gymna_chats(id) ON DELETE CASCADE NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
    content TEXT NOT NULL,
    type TEXT DEFAULT 'text', -- 'text', 'plan_table', etc.
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE gymna_chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE gymna_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own chats" ON gymna_chats
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own chats" ON gymna_chats
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own chats" ON gymna_chats
    FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view messages in their chats" ON gymna_messages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM gymna_chats 
            WHERE gymna_chats.id = gymna_messages.chat_id 
            AND gymna_chats.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert messages in their chats" ON gymna_messages
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM gymna_chats 
            WHERE gymna_chats.id = gymna_messages.chat_id 
            AND gymna_chats.user_id = auth.uid()
        )
    );
