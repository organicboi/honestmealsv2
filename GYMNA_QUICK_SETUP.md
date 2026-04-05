# 🚀 Honest Ask AI - Quick Setup Guide

## Prerequisites
- ✅ Supabase project with existing Honest Ask tables (`Honest Ask_chats`, `Honest Ask_messages`)
- ✅ Gemini API key configured (`GEMINI_API_KEY` in `.env.local`)
- ✅ User authentication working
- ✅ `Honest Ask_credits` field in `profiles` table

---

## Installation Steps

### 1️⃣ Run Database Migration
Execute this SQL in your Supabase SQL Editor:

```sql
-- Copy and paste the entire contents of:
-- database/migrations/009_Honest Ask_plan_storage.sql
```

This creates:
- `Honest Ask_plan_data` table
- Indexes for performance
- RLS policies for security

### 2️⃣ Verify Environment Variables
Ensure your `.env.local` has:

```env
GEMINI_API_KEY=your_gemini_api_key_here
```

### 3️⃣ Install Dependencies (if needed)
The following packages should already be installed:
```bash
npm install @google/generative-ai
npm install framer-motion
npm install react-markdown remark-gfm
npm install lucide-react
npm install sonner
```

### 4️⃣ Restart Development Server
```powershell
npm run dev
```

---

## Testing the Implementation

### Test 1: Diet Plan Generation
1. Navigate to: `http://localhost:3000/askme`
2. Click **"Diet Plan Generator"**
3. Answer the dialogue questions
4. Click **"Generate Plan"**
5. Wait for the generating overlay
6. View the beautiful diet plan table

### Test 2: Workout Plan Generation
1. Click **"Workout Plan Generator"**
2. Complete the workout questions
3. Generate and view the workout schedule

### Test 3: Database Verification
Run in Supabase SQL Editor:
```sql
-- Check if table exists
SELECT * FROM Honest Ask_plan_data LIMIT 5;

-- Check your plans
SELECT 
    plan_type, 
    plan_title, 
    created_at,
    parsed_data->>'title' as plan_name
FROM Honest Ask_plan_data
WHERE user_id = auth.uid()
ORDER BY created_at DESC;
```

---

## Troubleshooting

### ❌ "Service configuration error"
**Problem**: GEMINI_API_KEY is missing  
**Solution**: Add it to `.env.local` and restart server

### ❌ "Insufficient credits"
**Problem**: User has 0 `Honest Ask_credits`  
**Solution**: Update credits manually:
```sql
UPDATE profiles 
SET Honest Ask_credits = 10 
WHERE id = '<user-id>';
```

### ❌ JSON parse error
**Problem**: AI returned malformed JSON  
**Solution**: The system handles this automatically - it stores the raw response but won't display a table. Credits are refunded.

### ❌ Table "Honest Ask_plan_data" does not exist
**Problem**: Migration not run  
**Solution**: Execute `009_Honest Ask_plan_storage.sql` in Supabase

### ❌ RLS policy error
**Problem**: User can't access plan data  
**Solution**: Verify RLS policies:
```sql
SELECT * FROM pg_policies 
WHERE tablename = 'Honest Ask_plan_data';
```

---

## Key Features to Test

### ✅ Dialogue Flow
- [ ] Progress bar updates
- [ ] Back/Next navigation works
- [ ] Validation shows errors
- [ ] Questions display correctly
- [ ] Can't proceed without required answers

### ✅ Generation Process
- [ ] Non-dismissible overlay appears
- [ ] Rotating status messages
- [ ] Progress bar animates
- [ ] Credits deducted correctly
- [ ] Credits refunded on error

### ✅ Plan Display
- [ ] Diet plan shows meal tables
- [ ] Workout plan shows exercise schedule
- [ ] Macros display correctly
- [ ] Guidelines and tips sections appear
- [ ] Mobile responsive design

### ✅ Database Persistence
- [ ] Plans saved to `Honest Ask_plan_data`
- [ ] Raw JSON and parsed data stored
- [ ] Metadata includes responses
- [ ] Can retrieve old plans

---

## Usage Tips

### For Users
- **Prepare answers**: Think about your goals before starting
- **Be specific**: More detail = better plans
- **Credits**: Each plan costs 1 credit
- **Wait time**: Generation takes 10-30 seconds
- **Save plans**: Plans are automatically saved to your chat history

### For Developers
- **Customize questions**: Edit `types/Honest Ask.types.ts`
- **Change UI colors**: Modify gradient colors in components
- **Add plan types**: Follow pattern in `types/Honest Ask.types.ts`
- **Adjust AI model**: Change model in `app/actions/Honest Ask.ts`

---

## File Structure Reference

```
honestmealv2/
├── app/
│   ├── actions/
│   │   └── Honest Ask.ts                    # ← Server actions (modified)
│   └── askme/
│       └── Honest AskClient.tsx             # ← Main client (modified)
│
├── components/
│   └── Honest Ask/
│       ├── DialogueFlow.tsx            # ← NEW: Step-by-step questions
│       ├── DietPlanTable.tsx           # ← NEW: Diet plan display
│       ├── WorkoutPlanTable.tsx        # ← NEW: Workout plan display
│       └── GeneratingOverlay.tsx       # ← NEW: Loading overlay
│
├── database/
│   └── migrations/
│       └── 009_Honest Ask_plan_storage.sql  # ← NEW: Database migration
│
└── types/
    └── Honest Ask.types.ts                  # ← NEW: TypeScript definitions
```

---

## What's Next?

### Potential Enhancements
- [ ] Export plans as PDF
- [ ] Share plans with friends
- [ ] Track plan completion
- [ ] Rate and review plans
- [ ] Regenerate specific meals/days
- [ ] Add shopping list generation
- [ ] Calendar integration for workout schedule

---

## Support

If you encounter issues:
1. Check browser console for errors
2. Verify Supabase connection
3. Test Gemini API key with curl
4. Check RLS policies
5. Review server logs

---

## Success Checklist

Before considering setup complete:
- [ ] Database migration executed
- [ ] Environment variables configured
- [ ] Can generate diet plan
- [ ] Can generate workout plan
- [ ] Plans display in tables
- [ ] Plans saved to database
- [ ] Credits deduct correctly
- [ ] Mobile view works
- [ ] Loading states appear
- [ ] Error handling works

---

🎉 **Setup Complete!**  
Your Honest Ask AI system is now fully operational with dialogue-based plan generation, beautiful table displays, and structured data storage.
