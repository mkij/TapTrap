const BASE_POINTS = 100;
const COMBO_MULTIPLIER = 0.5;
const TIME_BONUS_MULTIPLIER = 50;

export function calculateScore(
  combo: number,
  timeRemaining: number,
  timeLimit: number
): number {
  const comboBonus = Math.floor(BASE_POINTS * combo * COMBO_MULTIPLIER);
  const timeRatio = timeRemaining / timeLimit;
  const timeBonus = Math.floor(timeRatio * TIME_BONUS_MULTIPLIER);

  return BASE_POINTS + comboBonus + timeBonus;
}

export function calculateCombo(
  currentCombo: number,
  passed: boolean
): number {
  if (passed) return currentCombo + 1;
  return 0;
}