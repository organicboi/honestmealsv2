'use server';

import { createClient } from '@/utils/supabase/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import type { 
    PlanType, 
    DialogueResponse, 
    DietPlanData, 
    WorkoutPlanData, 
    ParsedPlanResponse 
} from '@/types/gymna.types';

export async function getChats() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
        .from('gymna_chats')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });

    if (error) {
        console.error('getChats error:', error);
        return [];
    }
    return data ?? [];
}

export async function getChatMessages(chatId: string) {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from('gymna_messages')
        .select('*')
        .eq('chat_id', chatId)
        .order('created_at', { ascending: true });

    if (error) throw error;
    return data;
}

export async function createChat(title: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Unauthorized');

    const { data, error } = await supabase
        .from('gymna_chats')
        .insert({ user_id: user.id, title })
        .select()
        .single();

    if (error) throw error;
    return data;
}

export async function getUserCredits() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return 0;

    const { data, error } = await supabase
        .from('profiles')
        .select('gymna_credits')
        .eq('id', user.id)
        .single();

    if (error) return 0;
    return data.gymna_credits || 0;
}

export async function sendMessage(chatId: string, content: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Unauthorized');

    if (!process.env.GEMINI_API_KEY) {
        console.error("GEMINI_API_KEY is missing");
        throw new Error('AI service is not configured. Please contact support.');
    }

    // 1. Check credits
    const credits = await getUserCredits();
    if (credits <= 0) {
        throw new Error('Insufficient credits');
    }

    // 2. Deduct credit
    const { error: creditError } = await supabase
        .from('profiles')
        .update({ gymna_credits: credits - 1 })
        .eq('id', user.id);

    if (creditError) throw new Error('Failed to deduct credit. Please try again.');

    try {
        // Get history for context BEFORE inserting the new message
        const dbMessages = await getChatMessages(chatId);
        
        // Map to Gemini format
        let history = dbMessages.map(msg => ({
            role: msg.role === 'user' ? 'user' : 'model',
            parts: [{ text: msg.content }]
        }));

        // Sanitize history: Merge consecutive messages from same role
        if (history.length > 0) {
            const sanitizedHistory = [];
            let lastMsg = history[0];
            
            for (let i = 1; i < history.length; i++) {
                const currMsg = history[i];
                if (currMsg.role === lastMsg.role) {
                    // Merge text
                    lastMsg.parts[0].text += "\n\n" + currMsg.parts[0].text;
                } else {
                    sanitizedHistory.push(lastMsg);
                    lastMsg = currMsg;
                }
            }
            sanitizedHistory.push(lastMsg);
            history = sanitizedHistory;
        }

        // Ensure history does not end with 'user' (because we are about to send a user message)
        if (history.length > 0 && history[history.length - 1].role === 'user') {
            history.pop();
        }

        // 3. Save user message to DB
        await supabase.from('gymna_messages').insert({
            chat_id: chatId,
            role: 'user',
            content
        });

        // 4. Fetch user health profile for AI context
        const { data: userProfile } = await supabase
            .from('profiles')
            .select('name, gender, age, weight, height, goal_type, goal_weight, food_type, activity_level, workout_experience, bmr, tdee, daily_calorie_goal, daily_protein_goal, dietary_restrictions, preferred_cuisine, injuries_limitations')
            .eq('id', user.id)
            .single();

        // Build personalised user context block
        const userContext = userProfile ? `
USER PROFILE (use this to personalise every response — DO NOT ask for data already provided here):
- Name: ${userProfile.name ?? 'Not set'}
- Age: ${userProfile.age ?? 'Unknown'} | Gender: ${userProfile.gender ?? 'Unknown'}
- Weight: ${userProfile.weight ?? 'Unknown'} kg | Height: ${userProfile.height ?? 'Unknown'} cm
- Goal: ${userProfile.goal_type?.replace(/_/g, ' ') ?? 'General health'}${userProfile.goal_weight ? ` (target: ${userProfile.goal_weight} kg)` : ''}
- Diet preference: ${userProfile.food_type?.replace(/_/g, ' ') ?? 'No preference'}
- Activity level: ${userProfile.activity_level?.replace(/_/g, ' ') ?? 'Moderate'}
- Workout experience: ${userProfile.workout_experience ?? 'Beginner'}
- Food restrictions: ${Array.isArray(userProfile.dietary_restrictions) && userProfile.dietary_restrictions.length ? userProfile.dietary_restrictions.join(', ') : 'None'}
- Preferred cuisine: ${userProfile.preferred_cuisine ?? 'Mixed'}
- Injuries/limitations: ${userProfile.injuries_limitations ?? 'None'}
- BMR: ${userProfile.bmr ? Math.round(userProfile.bmr) + ' kcal' : 'Unknown'} | TDEE: ${userProfile.tdee ? Math.round(userProfile.tdee) + ' kcal' : 'Unknown'}
- Daily calorie goal: ${userProfile.daily_calorie_goal ?? 'Not set'} kcal | Daily protein goal: ${userProfile.daily_protein_goal ?? 'Not set'} g
` : '';

        // 5. Call AI with gemini-2.5-flash
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
        const model = genAI.getGenerativeModel({ 
            model: "gemini-2.5-flash",
        });
        
        // Build the full prompt with system instruction
        const systemPrompt = `You are Honest Ask, the AI health coach built into the Honest Meals platform — a Pune-based food and fitness app.
${userContext}
IMPORTANT — Honest Meals Platform Features (ALWAYS suggest these instead of any third-party app):
1. **Meal Ordering** (/order) — Users can order high-protein, macro-labelled meals (calories, protein, carbs, fat shown for every item). Veg, non-veg, elixirs, custom meals. Available in Pune.
2. **Health Dashboard** (/health) — Tracks daily calories, protein, carbs, fat, water intake, body weight, BMI, streaks, and food logs. Users set their own daily goals. Food from Honest Meals is auto-logged.
3. **Workout Logger** (/workout) — Log full workout sessions: category (Push/Pull/Legs/Cardio/HIIT/etc.), duration, intensity, exercises with sets/reps/weight per set. Full history stored.
4. **Progress Tracking** (/progress) — View weight over time, BMI trend, streak history, and food log history as charts.
5. **Honest Ask** (/honestask) — That's you. Generate structured Diet Plans or Workout Plans using the plan generators.

RULES:
- NEVER suggest MyFitnessPal, Cronometer, Fitbit, or any external app. Honest Meals has everything built in.
- Address the user by name if known. Reference their specific stats (weight, goal, TDEE) in answers where relevant.
- When your response explains or recommends one of the above features, append this EXACT token inline at the end of that sentence (before the period or on the next line): [ACTION:/route|Button Label]
  Examples:
  - "You can log your meals on the Health Dashboard. [ACTION:/health|Open Health Dashboard]"
  - "Try logging today's workout. [ACTION:/workout|Log a Workout]"
  - "Order a high-protein meal to hit your targets. [ACTION:/order|Browse Meals]"
  - "Check your weight trend in Progress Tracking. [ACTION:/progress|View Progress]"
  - "Generate a personalised diet plan here in Honest Ask. [ACTION:plan:diet|Generate Diet Plan]"
  - "Generate a personalised workout plan here in Honest Ask. [ACTION:plan:workout|Generate Workout Plan]"
- Only emit [ACTION:...] tokens for features the user is likely to use next. Do not spam every sentence.
- Keep responses concise, direct, and professional. Use markdown (bold, bullets, tables) where helpful.

`;
        const fullContent = history.length === 0 ? systemPrompt + content : content;
        
        const chat = model.startChat({
            history: history,
        });
        
        const result = await chat.sendMessage(fullContent);
        const response = result.response.text();

        // 5. Save assistant message
        await supabase.from('gymna_messages').insert({
            chat_id: chatId,
            role: 'assistant',
            content: response,
            type: response.includes('|') ? 'plan_table' : 'text'
        });

        // Update chat timestamp
        await supabase.from('gymna_chats').update({ updated_at: new Date().toISOString() }).eq('id', chatId);

        return { success: true };

    } catch (error: any) {
        // Refund credit on failure
        await supabase
            .from('profiles')
            .update({ gymna_credits: credits })
            .eq('id', user.id);
        console.error("AI Error Details:", error);
        console.error("Error message:", error?.message);
        console.error("Error stack:", error?.stack);
        throw new Error(`Failed to generate response: ${error?.message || 'Unknown error'}. Credits refunded.`);
    }
}

export async function deleteChat(chatId: string) {
    const supabase = await createClient();
    const { error } = await supabase.from('gymna_chats').delete().eq('id', chatId);
    if (error) throw error;
}

// ==================== NEW DIALOGUE-BASED FUNCTIONS ====================

/**
 * Generate a prompt from dialogue responses
 */
function compilePromptFromDialogue(
    planType: PlanType,
    responses: DialogueResponse[]
): string {
    const responseMap = responses.reduce((acc, r) => {
        acc[r.questionId] = r.answer;
        return acc;
    }, {} as Record<string, any>);

    if (planType === 'diet') {
        return `Generate a detailed, comprehensive diet plan in JSON format.

User Requirements:
- Dietary Preference: ${responseMap.preference || 'No Preference'}
- Primary Goal: ${responseMap.goal || 'General Health'}
- Current Weight: ${responseMap.weight || 'Not Specified'} kg
- Height: ${responseMap.height || 'Not Specified'} cm
- Activity Level: ${responseMap.activityLevel || 'Moderately Active'}
- Allergies/Restrictions: ${responseMap.allergies || 'None'}
- Preferred Cuisine: ${responseMap.cuisine || 'Mixed'}
- Meals Per Day: ${responseMap.mealsPerDay || '3 Meals'}

IMPORTANT: Respond ONLY with a valid JSON object. No markdown, no code blocks, just pure JSON.

Required JSON Structure:
{
  "title": "string (e.g., 'Weight Loss Diet Plan')",
  "goalType": "string",
  "totalDailyCalories": number,
  "totalDailyProtein": number,
  "totalDailyCarbs": number,
  "totalDailyFat": number,
  "preference": "veg|non-veg|vegan",
  "meals": [
    {
      "mealName": "string (e.g., 'Breakfast')",
      "time": "string (e.g., '8:00 AM')",
      "foods": [
        {
          "item": "string",
          "quantity": "string (e.g., '2 slices')",
          "calories": number,
          "protein": number,
          "carbs": number,
          "fat": number
        }
      ],
      "totalCalories": number,
      "totalProtein": number,
      "totalCarbs": number,
      "totalFat": number,
      "notes": "string (optional)"
    }
  ],
  "guidelines": ["string"],
  "hydration": {
    "dailyWaterIntake": "string (e.g., '3-4 liters')",
    "tips": ["string"]
  },
  "supplements": [
    {
      "name": "string",
      "timing": "string",
      "purpose": "string"
    }
  ]
}

Generate the plan now:`;
    } else {
        return `Generate a detailed, comprehensive workout plan in JSON format.

User Requirements:
- Fitness Goal: ${responseMap.goal || 'General Fitness'}
- Experience Level: ${responseMap.experience || 'Beginner'}
- Available Equipment: ${responseMap.equipment || 'Bodyweight Only'}
- Days Per Week: ${responseMap.daysPerWeek || '3 Days'}
- Session Duration: ${responseMap.sessionDuration || '45 minutes'}
- Injuries/Limitations: ${responseMap.injuries || 'None'}
- Focus Areas: ${Array.isArray(responseMap.focusAreas) ? responseMap.focusAreas.join(', ') : responseMap.focusAreas || 'Full Body'}

IMPORTANT: Respond ONLY with a valid JSON object. No markdown, no code blocks, just pure JSON.

Required JSON Structure:
{
  "title": "string (e.g., 'Beginner Full Body Strength Plan')",
  "goalType": "string",
  "experienceLevel": "string",
  "daysPerWeek": number,
  "equipment": "string",
  "schedule": [
    {
      "day": "string (e.g., 'Day 1 - Monday')",
      "focus": "string (e.g., 'Upper Body Push')",
      "duration": "string (e.g., '60 minutes')",
      "warmup": ["string"],
      "exercises": [
        {
          "exerciseName": "string",
          "sets": number,
          "reps": "string (e.g., '8-12')",
          "rest": "string (e.g., '90 seconds')",
          "notes": "string (optional)",
          "targetMuscle": "string (optional)"
        }
      ],
      "cooldown": ["string"],
      "notes": "string (optional)"
    }
  ],
  "guidelines": ["string"],
  "progressionTips": ["string"],
  "injuryPrevention": ["string"]
}

Generate the plan now:`;
    }
}

/**
 * Parse AI response and extract JSON
 */
function parseAIResponse(rawResponse: string, planType: PlanType): DietPlanData | WorkoutPlanData | null {
    try {
        // Try to extract JSON from the response
        // Remove markdown code blocks if present
        let cleanedResponse = rawResponse.trim();
        
        // Remove ```json or ``` markers
        cleanedResponse = cleanedResponse.replace(/^```json?\s*/i, '');
        cleanedResponse = cleanedResponse.replace(/```\s*$/i, '');
        
        // Find JSON object boundaries
        const jsonStart = cleanedResponse.indexOf('{');
        const jsonEnd = cleanedResponse.lastIndexOf('}');
        
        if (jsonStart !== -1 && jsonEnd !== -1) {
            cleanedResponse = cleanedResponse.substring(jsonStart, jsonEnd + 1);
        }
        
        const parsed = JSON.parse(cleanedResponse);
        return parsed;
    } catch (error) {
        console.error('Failed to parse AI response as JSON:', error);
        return null;
    }
}

/**
 * Send message with dialogue-based flow
 */
export async function sendDialogueMessage(
    chatId: string,
    planType: PlanType,
    responses: DialogueResponse[]
) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Unauthorized');

    if (!process.env.GEMINI_API_KEY) {
        console.error("GEMINI_API_KEY is missing");
        throw new Error('Service configuration error');
    }

    // 1. Check credits
    const credits = await getUserCredits();
    if (credits <= 0) {
        throw new Error('Insufficient credits');
    }

    // 2. Deduct credit
    const { error: creditError } = await supabase
        .from('profiles')
        .update({ gymna_credits: credits - 1 })
        .eq('id', user.id);

    if (creditError) throw creditError;

    try {
        // 3. Compile prompt from dialogue responses
        const compiledPrompt = compilePromptFromDialogue(planType, responses);
        
        // 4. Save user message to DB (showing the plan type request)
        const userMessageText = `Generate a ${planType} plan with my specifications`;
        const { data: userMessage, error: userMsgError } = await supabase
            .from('gymna_messages')
            .insert({
                chat_id: chatId,
                role: 'user',
                content: userMessageText
            })
            .select()
            .single();

        if (userMsgError) throw userMsgError;

        // 5. Get chat history for context
        const dbMessages = await getChatMessages(chatId);
        let history = dbMessages
            .filter(msg => msg.id !== userMessage.id) // Exclude the just-added message
            .map(msg => ({
                role: msg.role === 'user' ? 'user' : 'model',
                parts: [{ text: msg.content }]
            }));

        // Sanitize history
        if (history.length > 0) {
            const sanitizedHistory = [];
            let lastMsg = history[0];
            
            for (let i = 1; i < history.length; i++) {
                const currMsg = history[i];
                if (currMsg.role === lastMsg.role) {
                    lastMsg.parts[0].text += "\n\n" + currMsg.parts[0].text;
                } else {
                    sanitizedHistory.push(lastMsg);
                    lastMsg = currMsg;
                }
            }
            sanitizedHistory.push(lastMsg);
            history = sanitizedHistory;
        }

        // Ensure history doesn't end with user
        if (history.length > 0 && history[history.length - 1].role === 'user') {
            history.pop();
        }

        // 6. Call AI with compiled prompt
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
        const model = genAI.getGenerativeModel({ 
            model: "gemini-2.0-flash-exp",
        });
        
        const chat = model.startChat({ history });
        const result = await chat.sendMessage(compiledPrompt);
        const rawResponse = result.response.text();

        // 7. Parse JSON response
        const parsedData = parseAIResponse(rawResponse, planType);
        
        // 8. Save assistant message
        const { data: assistantMessage, error: assistantMsgError } = await supabase
            .from('gymna_messages')
            .insert({
                chat_id: chatId,
                role: 'assistant',
                content: rawResponse,
                type: parsedData ? 'plan_json' : 'text'
            })
            .select()
            .single();

        if (assistantMsgError) throw assistantMsgError;

        // 9. Save parsed plan data to gymna_plan_data table
        if (parsedData && assistantMessage) {
            const { error: planDataError } = await supabase
                .from('gymna_plan_data')
                .insert({
                    chat_id: chatId,
                    message_id: assistantMessage.id,
                    user_id: user.id,
                    plan_type: planType,
                    plan_title: (parsedData as any).title || `${planType} Plan`,
                    raw_json: rawResponse,
                    parsed_data: parsedData,
                    metadata: {
                        generatedAt: new Date().toISOString(),
                        questionResponses: responses
                    }
                });

            if (planDataError) {
                console.error('Failed to save plan data:', planDataError);
                // Don't throw - the message is saved, plan data is secondary
            }
        }

        // 10. Update chat timestamp
        await supabase
            .from('gymna_chats')
            .update({ updated_at: new Date().toISOString() })
            .eq('id', chatId);

        return { 
            success: true, 
            parsedData,
            messageId: assistantMessage.id 
        };

    } catch (error: any) {
        // Refund credit on failure
        await supabase
            .from('profiles')
            .update({ gymna_credits: credits })
            .eq('id', user.id);
        console.error("AI Error Details:", error);
        throw new Error(`Failed to generate response: ${error?.message || 'Unknown error'}. Credits refunded.`);
    }
}

/**
 * Get saved plan data for a chat
 */
export async function getPlanData(chatId: string) {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from('gymna_plan_data')
        .select('*')
        .eq('chat_id', chatId)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching plan data:', error);
        return [];
    }
    
    return data;
}
