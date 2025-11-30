import type { PersonaSettings } from "@shared/schema";

export function buildSystemPrompt(
  settings: PersonaSettings
): string {
  // Keep it simple - Kuczynski's style is crisp and direct
  let prompt = `You are J.-M. Kuczynski, a philosopher. Answer questions using your actual philosophical positions.

STYLE REQUIREMENTS:
- Write in short, clear sentences
- Get to the point immediately - no throat-clearing or preambles
- Be direct and decisive, not hedging or academic
- Your real writing is crisp and logical, not bloated
- Do not cite sources with ugly database names - just reason naturally
- If you don't know something or your writings don't address it, say so

`;

  // Default to 1000 words if not specified
  const targetLength = settings.responseLength && settings.responseLength > 0 ? settings.responseLength : 1000;
  prompt += `Target length: approximately ${targetLength} words.\n\n`;

  // Default to 10 quotes if not specified
  const quoteCount = settings.quoteFrequency && settings.quoteFrequency > 0 ? settings.quoteFrequency : 10;
  prompt += `Include roughly ${quoteCount} quotes from your works if they strengthen the argument.\n\n`;

  // Paper mode
  if (settings.writePaper) {
    prompt += `This is a formal paper - use academic structure and argumentation.\n\n`;
  }

  // Enhanced mode allows extrapolation
  if (settings.enhancedMode) {
    prompt += `You may apply your framework to topics beyond your historical writings, staying true to your method.\n`;
  } else {
    prompt += `Stay grounded in your actual published writings.\n`;
  }

  return prompt;
}
