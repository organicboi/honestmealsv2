import type { DashboardProfile, CuratedPrompt } from '@/app/actions/dashboard';

export function buildCuratedPrompts(profile: DashboardProfile | null): CuratedPrompt[] {
    if (!profile) return getDefaultPrompts();

    const {
        goal_type, food_type, weight, workout_experience,
        workout_equipment, daily_calorie_goal: cal, daily_protein_goal: prot,
    } = profile;

    const cal_    = cal  ?? 2000;
    const prot_   = prot ?? 120;
    const wt      = weight ? `${weight} kg` : 'my weight';
    const isVeg   = food_type === 'veg' || food_type === 'vegan';
    const vegTag  = isVeg ? ' (vegetarian)' : '';
    const equip   = workout_equipment ?? 'Full Gym';
    const xp      = workout_experience ?? 'beginner';

    const maps: Record<string, CuratedPrompt[]> = {
        lose_weight: [
            { id: 'lw1', emoji: '🥗', category: 'diet',       text: `Build me a 7-day fat-loss meal plan — ${cal_} cal/day${vegTag}` },
            { id: 'lw2', emoji: '🔥', category: 'workout',    text: `Create a fat-burning ${xp} workout plan for ${equip}` },
            { id: 'lw3', emoji: '🍽️', category: 'diet',       text: `What should I eat today to hit ${cal_} cal with ${prot_}g protein?` },
            { id: 'lw4', emoji: '💧', category: 'hydration',  text: `How much water should I drink per day at ${wt} for fat loss?` },
            { id: 'lw5', emoji: '📉', category: 'motivation', text: `How many weeks to lose 5 kg from ${wt} at a 20% deficit?` },
        ],
        build_muscle: [
            { id: 'bm1', emoji: '💪', category: 'workout',    text: `Design a hypertrophy program for ${equip} — ${xp} level` },
            { id: 'bm2', emoji: '🍗', category: 'diet',       text: `Build a high-protein muscle-gain diet — ${cal_} cal${vegTag}` },
            { id: 'bm3', emoji: '📊', category: 'diet',       text: `Am I eating enough protein? I need ${prot_}g/day at ${wt}` },
            { id: 'bm4', emoji: '🔄', category: 'workout',    text: `How should I structure progressive overload as a ${xp}?` },
            { id: 'bm5', emoji: '🍽️', category: 'diet',       text: `Best pre & post-workout meals for muscle growth${vegTag}` },
        ],
        gain_weight: [
            { id: 'gw1', emoji: '📈', category: 'diet',       text: `Create a healthy bulking meal plan — ${cal_} cal${vegTag}` },
            { id: 'gw2', emoji: '🏋️', category: 'workout',   text: `Build a strength & mass program for ${equip} (${xp})` },
            { id: 'gw3', emoji: '🥛', category: 'diet',       text: `High-calorie Indian foods to gain weight without junk${vegTag}` },
            { id: 'gw4', emoji: '⚡', category: 'motivation', text: `How fast can I gain 5 kg of muscle starting at ${wt}?` },
            { id: 'gw5', emoji: '🍽️', category: 'diet',       text: `Plan 5 meals at ${Math.round(cal_ / 5)} cal each for ${wt}` },
        ],
        maintain_weight: [
            { id: 'mw1', emoji: '⚖️', category: 'diet',       text: `Generate a balanced maintenance diet — ${cal_} cal${vegTag}` },
            { id: 'mw2', emoji: '🏃', category: 'workout',    text: `Design a fitness maintenance plan for ${equip} (${xp})` },
            { id: 'mw3', emoji: '📊', category: 'diet',       text: `How do I stay at ${wt} while building some strength?` },
            { id: 'mw4', emoji: '🥗', category: 'diet',       text: `Meal prep ideas for a week at ${cal_} calories${vegTag}` },
            { id: 'mw5', emoji: '💡', category: 'motivation', text: `What metrics should I track to stay fit long-term?` },
        ],
        manage_health: [
            { id: 'mh1', emoji: '🫀', category: 'diet',       text: `Create a balanced healthy diet at ${cal_} cal${vegTag}` },
            { id: 'mh2', emoji: '🧘', category: 'workout',    text: `Design a beginner health-focused routine for ${equip}` },
            { id: 'mh3', emoji: '🥦', category: 'diet',       text: `Best anti-inflammatory foods to add to my daily meals${vegTag}` },
            { id: 'mh4', emoji: '💧', category: 'hydration',  text: `My water goal is ${Math.round((profile.daily_water_goal_ml ?? 2500) / 100) / 10}L — how do I reach it consistently?` },
            { id: 'mh5', emoji: '⚡', category: 'motivation', text: `How can I improve energy levels through nutrition at ${wt}?` },
        ],
    };

    return maps[goal_type ?? ''] ?? getDefaultPrompts();
}

function getDefaultPrompts(): CuratedPrompt[] {
    return [
        { id: 'd1', emoji: '🥗', category: 'diet',      text: 'Generate a personalised 7-day diet plan for me' },
        { id: 'd2', emoji: '💪', category: 'workout',   text: 'Create a beginner workout plan I can start today' },
        { id: 'd3', emoji: '🔥', category: 'diet',      text: 'What are high-protein breakfast options under 400 cal?' },
        { id: 'd4', emoji: '💧', category: 'hydration', text: 'How much water do I need to drink daily?' },
        { id: 'd5', emoji: '📊', category: 'diet',      text: 'Explain macros: protein, carbs, and fat for beginners' },
    ];
}
