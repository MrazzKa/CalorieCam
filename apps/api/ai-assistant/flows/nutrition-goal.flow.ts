import { FlowDefinition } from '../assistant-flow.types';

export const nutritionGoalFlow: FlowDefinition = {
  id: 'nutrition_goal_setup',
  title: 'Nutrition goal setup',
  description: 'Clarify goal, routines, and constraints to give tailored recommendations.',
  summaryTemplate: (collected) => {
    const { goal, timeline, dietStyle, challenges, resources, hydration } = collected;
    return `**Goal recap**
- Goal: ${goal}
- Timeline: ${timeline}
- Preferred diet style: ${dietStyle}
- Main challenges: ${challenges || 'not specified'}
- Available resources: ${resources || 'not specified'}
- Hydration habits: ${hydration || 'not specified'}

**Action plan**
1. Set energy intake aligned with goal and adjust weekly: use 300–500 kcal deficit for weight loss or 250–350 kcal surplus for gain.
2. Anchor protein at 1.6–2.2 g/kg (lean mass focus) spread over 3–4 meals.
3. Fill plates with ½ vegetables, ¼ protein, ¼ whole-grain carbs; include healthy fats each meal.
4. Meal prep two batches per week using the resources you listed.
5. Track hydration target (30–35 ml/kg) and link to hydration cues you described.
6. Schedule weekly check-ins to review progress and adjust carbs around training.`;
  },
  steps: [
    {
      id: 'goal',
      type: 'question',
      prompt: 'What is your primary nutrition goal right now?',
      quickReplies: ['Lose 5 kg fat', 'Gain muscle', 'Improve energy'],
      validation: (value) => (value.trim().length < 5 ? 'Please describe the goal with specifics.' : null),
      next: 'timeline',
    },
    {
      id: 'timeline',
      type: 'question',
      prompt: 'What timeline are you targeting (e.g. 8 weeks, this season)?',
      quickReplies: ['4 weeks', '8 weeks', '12 weeks+'],
      validation: (value) => (value.trim().length === 0 ? 'Timeline helps me pace recommendations.' : null),
      next: 'dietStyle',
    },
    {
      id: 'dietStyle',
      type: 'question',
      prompt: 'Any dietary style or restrictions I should respect?',
      quickReplies: ['Plant-based', 'Mediterranean', 'No restrictions'],
      next: 'challenges',
    },
    {
      id: 'challenges',
      type: 'question',
      prompt: 'What are the biggest challenges to staying on track?',
      quickReplies: ['Busy schedule', 'Cravings', 'Eating out'],
      next: 'resources',
    },
    {
      id: 'resources',
      type: 'question',
      prompt: 'What resources do you have? (meal prep time, appliances, support)',
      quickReplies: ['Can meal prep Sundays', 'Limited cooking time', 'Gym cafe'],
      next: 'hydration',
    },
    {
      id: 'hydration',
      type: 'question',
      prompt: 'How do you handle hydration today? Any issues staying consistent?',
      quickReplies: ['Drink 2L daily', 'Forget during work', 'Rely on coffee'],
      next: 'summary',
    },
    {
      id: 'summary',
      type: 'summary',
      prompt: 'Here is your tailored nutrition action plan.',
    },
  ],
};
