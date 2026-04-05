export const STREAK_MILESTONES = {
  3: 'Three days strong! Pixel is so proud.',
  7: 'A whole week! Pixel evolved!',
  14: 'Two weeks! You\'re unstoppable.',
  30: 'A whole month! Pixel ascended.',
}

/**
 * Returns a milestone message if the given streak count hits a milestone,
 * otherwise null.
 */
export function getMilestoneMessage(streak) {
  return STREAK_MILESTONES[streak] ?? null
}
