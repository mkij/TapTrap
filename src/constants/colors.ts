export const COLORS = {
  background: "#08080f",
  white: "#ffffff",
  accent: "#00ff88",
  warning: "#ffaa00",
  danger: "#ff3355",
  textPrimary: "rgba(255,255,255,0.85)",
  textSecondary: "rgba(255,255,255,0.4)",
  textMuted: "rgba(255,255,255,0.15)",
  ringTrack: "rgba(255,255,255,0.04)",
  innerCircle: "rgba(255,255,255,0.06)",
  innerBorder: "rgba(255,255,255,0.08)",
} as const;

export function getTimerColor(progress: number): string {
  if (progress > 0.5) return COLORS.accent;
  if (progress > 0.25) return COLORS.warning;
  return COLORS.danger;
}