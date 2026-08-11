/**
 * Conversation-language detection for the Patient Assistant — deliberately
 * NOT the application's UI language. UI language (i18next's active `lng`)
 * controls layout direction and chrome (composer placeholder, suggestion
 * chip labels, sidebar labels); conversation language controls what
 * language a given assistant turn replies in, and is derived fresh from
 * whatever the user just typed or clicked.
 *
 * Pure/framework-free on purpose — no react-i18next import here, so this
 * stays trivially unit-testable and reusable outside a component.
 *
 * Detection strategy: Unicode-script dominance, not a dictionary of Arabic
 * words. Digits, punctuation, whitespace, and emoji are outside both
 * ranges below, so they never skew the count either way.
 */

// Arabic (؀-ۿ) + Arabic Supplement (ݐ-ݿ) + Arabic
// Extended-A (ࢠ-ࣿ) + Arabic Presentation Forms A/B
// (ﭐ-﷿, ﹰ-﻿) — covers standard Arabic script text
// without pulling in a heavyweight NLP/language-id package.
const ARABIC_SCRIPT_PATTERN = /[؀-ۿݐ-ݿࢠ-ࣿﭐ-﷿ﹰ-﻿]/g;
const LATIN_SCRIPT_PATTERN = /[A-Za-z]/g;

export const CONVERSATION_LANGUAGES = {
  ARABIC: "ar",
  ENGLISH: "en",
};

/**
 * Returns 'ar' or 'en'. `options.conversationLanguage` (this conversation's
 * own established language, if any) and `options.uiLanguage` (the active
 * app language) are only consulted as fallbacks when the input itself has
 * no meaningful Arabic/Latin letters to judge from — matching the required
 * fallback chain: conversation language -> UI language -> English.
 */
export const detectConversationLanguage = (text, options = {}) => {
  const { conversationLanguage = null, uiLanguage = null } = options;
  const fallback = conversationLanguage || uiLanguage || CONVERSATION_LANGUAGES.ENGLISH;

  if (typeof text !== "string" || text.trim() === "") {
    return fallback;
  }

  const arabicCount = text.match(ARABIC_SCRIPT_PATTERN)?.length || 0;
  const latinCount = text.match(LATIN_SCRIPT_PATTERN)?.length || 0;

  if (arabicCount === 0 && latinCount === 0) return fallback;
  if (arabicCount > latinCount) return CONVERSATION_LANGUAGES.ARABIC;
  if (latinCount > arabicCount) return CONVERSATION_LANGUAGES.ENGLISH;
  // A genuine tie (equally many Arabic and Latin letters) isn't decisive
  // either way — fall back the same way "no meaningful letters" does.
  return fallback;
};
