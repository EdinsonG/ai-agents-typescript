# Contributing to ai-agents-core

Thank you for your interest in contributing! This guide will help you get started.

## Prerequisites

- Node.js >= 20
- pnpm (configured via `packageManager` in package.json)

## Setup

```bash
# Install dependencies
pnpm install

# Run tests
pnpm test

# Run linter
pnpm lint

# Build the project
pnpm build
```

## Development Workflow

1. **Create a branch** from `develop`:
   ```bash
   git checkout -b feature/my-feature develop
   ```

2. **Make your changes** and ensure:
   - Tests pass: `pnpm test`
   - Linter passes: `pnpm lint`
   - Build succeeds: `pnpm build`

3. **Commit** with clear, descriptive messages in Spanish.

4. **Push** and create a Pull Request to `develop`.

## Code Style

We use Biome for linting and formatting. Run:

```bash
pnpm lint:fix   # Auto-fix issues
pnpm format     # Format code
```

## Testing

- Write tests in `__tests__/` directory
- Use the mock provider from `__tests__/mocks/mockProvider.ts`
- Run `pnpm test:coverage` to check coverage

## Golden Cases

When adding new eval cases in `src/evals/golden/`:
- Each case needs a unique `id`
- Rubric requirements must be > 20 characters
- Use `DeterministicCheck` for automated validation

## Pull Requests

- PRs should target `develop` branch
- Include a clear description of changes
- Ensure CI passes before requesting review

## Questions?

Open an issue or start a discussion on GitHub.
