-- Add credits to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS Honest Ask_credits INTEGER DEFAULT 10;

-- Create chats table
CREATE TABLE IF NOT EXISTS Honest Ask_chats (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create messages table
CREATE TABLE IF NOT EXISTS Honest Ask_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    chat_id UUID REFERENCES Honest Ask_chats(id) ON DELETE CASCADE NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
    content TEXT NOT NULL,
    type TEXT DEFAULT 'text', -- 'text', 'plan_table', etc.
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE Honest Ask_chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE Honest Ask_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own chats" ON Honest Ask_chats
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own chats" ON Honest Ask_chats
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own chats" ON Honest Ask_chats
    FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view messages in their chats" ON Honest Ask_messages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM Honest Ask_chats 
            WHERE Honest Ask_chats.id = Honest Ask_messages.chat_id 
            AND Honest Ask_chats.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert messages in their chats" ON Honest Ask_messages
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM Honest Ask_chats 
            WHERE Honest Ask_chats.id = Honest Ask_messages.chat_id 
            AND Honest Ask_chats.user_id = auth.uid()
        )
    );
