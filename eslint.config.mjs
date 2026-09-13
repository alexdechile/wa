import js from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  // `.wrangler` es estado local de desarrollo (base D1 local, bundles
  // generados), no código del proyecto.
  { ignores: ['dist/**', 'node_modules/**', '.wrangler/**'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['**/*.{ts,tsx}'],
    rules: {
      // TypeScript ya verifica los identificadores globales (fetch, crypto,
      // document, __dirname...). Dejar no-undef activo solo genera ruido.
      'no-undef': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      // Un guion bajo marca lo que existe por firma pero no se usa.
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_' },
      ],
    },
  },
);
