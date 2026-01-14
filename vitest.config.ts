// =============================================================================
// Vitest Configuration
// =============================================================================
//
// This configuration file extends the Vite config with test-specific settings.
//
// =============================================================================

import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
	test: {
		// Use the src directory as root for tests
		root: 'src',

		// Setup file to run before tests
		setupFiles: ['../vitest.setup.ts'],

		// Use 'node' environment (faster than jsdom for unit tests)
		environment: 'node',

		// Include patterns for test files
		include: ['**/__tests__/**/*.test.{ts,tsx}', '**/*.spec.{ts,tsx}'],

		// Exclude patterns
		exclude: ['**/node_modules/**', '**/dist/**'],

		// Enable globals (describe, it, expect, etc.)
		globals: true,

		// Coverage configuration
		coverage: {
			provider: 'v8',
			reporter: ['text', 'json', 'html'],
			exclude: ['**/__tests__/**', '**/*.test.{ts,tsx}', '**/*.spec.{ts,tsx}'],
		},

		// Timeout for tests
		testTimeout: 10000,

		// Clear mocks between tests
		clearMocks: true,

		// Disable watch mode by default (use --watch to enable)
		watch: false,
	},

	// Cache directory - stored outside node_modules to avoid Docker volume permission issues
	// Vitest uses <cacheDir>/vitest for its cache
	cacheDir: '.vitest-cache',

	// Resolve aliases (same as vite.config.ts)
	resolve: {
		alias: {
			'my-react': path.resolve(__dirname, '../../packages/my-react/src/index.ts'),
			'my-react-router': path.resolve(__dirname, '../../packages/my-react-router/src/index.tsx'),
			'my-class-validator': path.resolve(__dirname, '../../packages/my-class-validator/src/index.ts'),
		},
	},

	// ESBuild configuration for JSX
	esbuild: {
		jsx: 'transform',
		jsxFactory: 'createElement',
		jsxFragment: 'FragmentComponent',
	},
});
