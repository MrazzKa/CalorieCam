import { FlowDefinition } from '../assistant-flow.types';

export const hydrationCheckFlow: FlowDefinition = {
  id: 'hydration_check',
  title: 'Hydration check',
  description: 'Audit hydration patterns and deliver an actionable hydration schedule.',
  summaryTemplate: (collected) => {
    const { dailyIntake, cues, trainingLoad, issues, reminders } = collected;
    return `**Hydration snapshot**
- Typical intake: ${dailyIntake}
- Hydration cues: ${cues}
- Training load: ${trainingLoad}
- Issues: ${issues || 'none reported'}
- Reminder system: ${reminders || 'not specified'}

**Hydration playbook**
1. Target total fluids at 30–35 ml/kg, scaling up to replace sweat losses from training.
2. Front-load hydration: 500 ml within 30 minutes of waking.
3. During training, sip 150–250 ml every 15–20 minutes; add electrolytes when workouts exceed 60 minutes.
4. After training, replace 150% of body mass lost (1 kg ≈ 1.5 L).
5. Use the reminder system you listed (alarms, bottle markings) to anchor consistent sipping.
6. Monitor urine color (pale straw) and keep a hydration log for the next 7 days.`;
  },
  steps: [
    {
      id: 'dailyIntake',
      type: 'question',
      prompt: 'Roughly how much fluid do you drink daily (include water, tea, etc.)?',
      quickReplies: ['<1.5L', '2L', '3L+'],
      next: 'cues',
    },
    {
      id: 'cues',
      type: 'question',
      prompt: 'What cues help you remember to hydrate (if any)?',
      quickReplies: ['Alarms', 'Bottle on desk', 'Workout breaks'],
      next: 'trainingLoad',
    },
    {
      id: 'trainingLoad',
      type: 'question',
      prompt: 'Describe your weekly training load (sessions, duration, intensity).',
      quickReplies: ['3x strength', '5x running', 'Daily mixed training'],
      next: 'issues',
    },
    {
      id: 'issues',
      type: 'question',
      prompt: 'Any hydration-related issues? (headaches, cramps, energy dips)',
      quickReplies: ['Cramps', 'Headaches', 'Low afternoon energy', 'None'],
      next: 'reminders',
    },
    {
      id: 'reminders',
      type: 'question',
      prompt: 'What reminder system could work best for you?',
      quickReplies: ['Phone alarms', 'Bottle markers', 'Habit stacking'],
      next: 'summary',
    },
    {
      id: 'summary',
      type: 'summary',
      prompt: 'Hydration schedule ready. Review below.',
    },
  ],
};
