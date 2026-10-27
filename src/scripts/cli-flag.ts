/** The value after `--<name>` in an argv list, or undefined when the flag is absent or last.
 *  Shared by the research CLIs (signal-schedule, week-study). */
export const flag = (argv: readonly string[], name: string): string | undefined => {
  const at = argv.indexOf(`--${name}`);
  return at === -1 ? undefined : argv[at + 1];
};
