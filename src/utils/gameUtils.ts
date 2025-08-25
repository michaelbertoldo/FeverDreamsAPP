export const generateGameCode = (): string => {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let code = '';
  for (let i = 0; i < 4; i++) {
    code += letters[Math.floor(Math.random() * letters.length)];
  }
  return code;
};

export const validateGameCode = (code: string): boolean => {
  return /^[A-Z]{4}$/.test(code);
};

export const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

export const calculateScore = (votes: number, round: number): number => {
  // Bonus points for later rounds
  const roundMultiplier = 1 + (round - 1) * 0.5;
  return Math.round(votes * roundMultiplier);
};
