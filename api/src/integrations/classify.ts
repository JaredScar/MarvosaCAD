export interface Classification {
  type: string;
  priority: number;
}

export function classify(message: string): Classification {
  const text = message.toLowerCase();
  if (/\b(fire|flames|smoke|explosion)\b/.test(text)) return { type: 'fire', priority: 1 };
  if (/\b(heart|unconscious|medical|injured|shots?|gun|stab|blood)\b/.test(text)) return { type: 'medical', priority: 1 };
  if (/\b(pursuit|fleeing|chase)\b/.test(text)) return { type: 'pursuit', priority: 1 };
  if (/\b(robbery|stolen|theft|burglary)\b/.test(text)) return { type: 'theft', priority: 2 };
  if (/\b(fight|disturbance|noise|argument|music)\b/.test(text)) return { type: 'disturbance', priority: 3 };
  if (/\b(traffic|accident|collision|crash)\b/.test(text)) return { type: 'traffic', priority: 2 };
  return { type: '911', priority: 2 };
}
