import { FlowDefinition } from '../assistant-flow.types';

export const injuryTriageFlow: FlowDefinition = {
  id: 'injury_triage',
  title: 'Injury triage',
  description: 'Collect symptom details and suggest next steps for workout injuries.',
  summaryTemplate: (collected) => {
    const { area, onset, painLevel, trainingContext, redFlags, selfCare } = collected;
    return `**Overview**
- Location: ${area}
- Started: ${onset}
- Pain level: ${painLevel}
- Training context: ${trainingContext}
- Red flags: ${redFlags || 'none reported'}
- Self-care tried: ${selfCare || 'none'}

**Suggested next steps**
1. Rest and protect the area for 48 hours. Avoid movements that trigger pain.
2. Apply cold therapy 10–15 minutes three times per day for the first 48 hours, then contrast therapy if swelling diminishes.
3. Use compression/wraps only if they do not restrict circulation.
4. Elevate after training to reduce swelling.
5. Resume gentle range-of-motion drills once pain drops below 3/10.
6. If pain persists beyond 7 days, worsens, or red flags appear, consult a sports clinician immediately.`;
  },
  steps: [
    {
      id: 'area',
      type: 'question',
      prompt: 'Which area of the body is affected? (e.g. left knee, lower back)',
      quickReplies: ['Left knee', 'Lower back', 'Right ankle', 'Shoulder'],
      validation: (value) => (value.trim().length < 3 ? 'Please describe where it hurts.' : null),
      next: 'onset',
    },
    {
      id: 'onset',
      type: 'question',
      prompt: 'When did the discomfort start and what triggered it?',
      quickReplies: ['During today’s workout', 'Yesterday evening', 'Gradually over weeks'],
      validation: (value) => (value.trim().length < 5 ? 'Share more detail about onset/time.' : null),
      next: 'painLevel',
    },
    {
      id: 'painLevel',
      type: 'question',
      prompt: 'How intense is the pain on a 0–10 scale?',
      quickReplies: ['2/10', '4/10', '7/10'],
      validation: (value) => (/\d/.test(value) ? null : 'Please rate pain 0–10.'),
      next: 'trainingContext',
    },
    {
      id: 'trainingContext',
      type: 'question',
      prompt: 'What exercise or movement were you doing?',
      quickReplies: ['Heavy squats', 'Running', 'Mobility drill'],
      validation: (value) => (value.trim().length < 3 ? 'Add context for the movement.' : null),
      next: 'redFlags',
    },
    {
      id: 'redFlags',
      type: 'question',
      prompt: 'Any red-flag symptoms? (numbness, tingling, loss of strength, swelling)',
      quickReplies: ['No red flags', 'Swelling', 'Loss of strength'],
      next: 'selfCare',
    },
    {
      id: 'selfCare',
      type: 'question',
      prompt: 'What self-care have you tried so far?',
      quickReplies: ['Ice', 'Compression', 'Rest only'],
      next: 'summary',
    },
    {
      id: 'summary',
      type: 'summary',
      prompt: 'Review recommendations below. Need more help?',
    },
  ],
};
