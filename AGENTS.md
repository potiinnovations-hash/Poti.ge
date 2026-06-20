# Project Rule Constraints & Guidelines

## 1. Absolute Preservation of Existing Progress
- **DO NOT** edit, remove, or modify any existing fully operational features, styles, assets, logos, fonts, colors, or page routes unless explicitly requested by the user.
- Any new features must be built non-destructively, as additive additions, preserving the working state of current features under all circumstances.

## 2. Planning and Explicit Confirmation Rule
- **CRITICAL**: Before making ANY changes or writing any code, you must first:
  1. Carefully analyze the existing codebase.
  2. Clearly list the exact steps, files you will modify, and code you plan to add.
  3. **STOP** and wait for the user's explicit confirmation before executing any code modifications or tool integrations.

## 3. High-Fidelity & No Breakages
- Carefully check and test dependencies, configurations, and imports to ensure font setups, logo uploads, and backend settings remain intact at all times.

## 4. Firestore Database Limit & Performance Optimization
- **MANDATORY LIMITS ON READS**: Always use pagination or constraints (e.g., `limit()`, `orderBy()`, and deep queries) when pulling collections from Firestore. Never load entire collections to the client side.
- **DEBOUNCE AND CACHE**: Use client-side caching (e.g. state management, React Context, or standard `sessionStorage` / `localStorage`) for static or slowly changing assets like settings, categories, and catalogs to minimize billable Firestore read/write operations.
- **SAFE SUBSCRIPTIONS**: Ensure all `onSnapshot` subscriptions return cleanup functions in React's `useEffect` hooks to prevent memory leaks and redundant listeners.

## 5. Prevention of App Hanging & Build Failures
- **BUILD RESILIENCE**: Keep `ignoreBuildErrors: true` and `ignoreDuringBuilds: true` in `next.config.ts` to ensure that small linter warnings or TypeScript type mismatches during background edits do not completely freeze the dev server with the "Please wait while your application starts..." message.
- **NEVER DESTRUCTIVELY CLEAN WORKSPACE**: Do not perform automated delete or sweeping edits of structural layout files or configuration files without specific instructions. Always edit files surgically and verify them iteratively.

