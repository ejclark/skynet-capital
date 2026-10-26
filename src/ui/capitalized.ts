/** The text with its first character upper-cased — a name opening a sentence. */
export const capitalized = (text: string): string => text.charAt(0).toUpperCase() + text.slice(1);
