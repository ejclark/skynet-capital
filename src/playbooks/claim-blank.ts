/** Empty, whitespace-only, or missing: claim records are read from JSON files, so a text field may
 *  not be there at all. The one test every claim-shaped record's validator uses for "said nothing". */
export const blank = (value: string | undefined): boolean => !value || value.trim().length === 0;
