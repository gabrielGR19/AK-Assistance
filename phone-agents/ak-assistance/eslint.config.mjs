// Minimale ESLint Flat Config mit den empfohlenen TypeScript-Regeln.
import tseslint from "typescript-eslint";

export default tseslint.config(
  {
    ignores: ["dist/**", "node_modules/**"],
  },
  ...tseslint.configs.recommended
);
