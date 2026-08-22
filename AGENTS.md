# CLAUDE.md

<!-- intent-skills:start -->

## Skill Loading

Before editing files for a substantial task:

- Run `bunx @tanstack/intent@latest list` from the workspace root to see available local skills.
- If a listed skill matches the task, run `bunx @tanstack/intent@latest load <package>#<skill>`
  before changing files.
- Use the loaded `SKILL.md` guidance while making the change.
- Monorepos: when working across packages, run the skill check from the workspace root and prefer
  the local skill for the package being changed.
- Multiple matches: prefer the most specific local skill for the package or concern you are
  changing; load additional skills only when the task spans multiple packages or concerns.

<!-- intent-skills:end -->

See @./README.md for the project overview

## Project Structure

- `src/lib` contains the project's library code, grouped by domain via this naming convention (e.g.
  for a `todos` domain):
  - `todos.server.ts` — server-only code, usually paired with `todos.server.test.ts` to unit test
    it.
  - `todos.functions.ts` — a thin wrapper exposing server functions, importing from
    `todos.server.ts`.
    - Exported server functions should be named with the `Fn` suffix, e.g. `getTodosFn`,
      `createTodoFn`, etc.
      - This makes it clearer what is a server function and what isn't
  - `todos.schemas.ts` — Zod schemas for the domain.
  - `todo.types.ts` — TypeScript types for the domain, usually used if Zod schemas are not required.
  - `todos.ts` — isomorphic code that can run on either the client or server (e.g. date helpers),
    usually paired with `todos.test.ts` to unit test it.

## Testing

- Always use Bun's test runner (`bun test`), see [the documentation](https://bun.com/docs/test.md)
  for more information.
- Before writing tests, extract pure functions and presentational components out of framework
  wrappers (e.g. `createServerFn`, route files) so tests don't need runtime context.

## Code Style

### General Coding Preferences

- Apply the YAGNI and KISS principles
- Keep things simple, robust and readable
- Keep comments up to date with code changes

### Comments

- Inline Comments
  - Add inline comments for any non-obvious behavior
  - Inline comments should explain the _why_
  - Inline comments should be concise and useful (1-2 lines max)
- TSDoc Comments
  - Add a short tsdoc comment to exports describing intent and any non-obvious behaviour
  - Not required for every export, use judgment based on complexity
  - When you do add one, use the following format:
  ````ts
  /**
   * <short description>
   *
   * @param myParam - <short description>
   * ...
   *
   * @remarks
   * <optional: mention any behaviour that might trip up another developer>
   *
   * @example
   * ```ts
   * <example usage>
   * ```
   */
  ````
