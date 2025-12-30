export const AI_MODELS = {
  REASONING: {
    PRO: 'gemini-3-pro-preview',
    FLASH: 'gemini-3-flash-preview',
  },
  VISION: {
    PRO: 'gemini-3-pro-image-preview',
    FLASH: 'gemini-2.5-flash-image',
  }
} as const;

export const GEN_CONFIG = {
  HIGH_OUTPUT: { maxOutputTokens: 65536 },
  JSON_MODE: { responseMimeType: "application/json" }
};
