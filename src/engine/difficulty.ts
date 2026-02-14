export interface DifficultyConfig {
  baseTime: number;
  allowDeceptive: boolean;
  allowMemory: boolean;
  allowOpposite: boolean;
}

export function getDifficultyConfig(levelNumber: number): DifficultyConfig {
  if (levelNumber <= 5) {
    return {
      baseTime: 4000,
      allowDeceptive: false,
      allowMemory: false,
      allowOpposite: false,
    };
  }

  if (levelNumber <= 15) {
    return {
      baseTime: 3500,
      allowDeceptive: true,
      allowMemory: false,
      allowOpposite: false,
    };
  }

  if (levelNumber <= 25) {
    return {
      baseTime: 3000,
      allowDeceptive: true,
      allowMemory: true,
      allowOpposite: false,
    };
  }

  if (levelNumber <= 40) {
    return {
      baseTime: 2500,
      allowDeceptive: true,
      allowMemory: true,
      allowOpposite: true,
    };
  }

  // 40+ chaos mode
  return {
    baseTime: Math.max(1500, 2500 - (levelNumber - 40) * 25),
    allowDeceptive: true,
    allowMemory: true,
    allowOpposite: true,
  };
}