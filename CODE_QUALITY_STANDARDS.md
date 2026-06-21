# CarbonPulse Code Quality Standards

This document outlines the engineering standards that maintain CarbonPulse's 100-point code quality score.

## Table of Contents

1. [TypeScript & Type Safety](#typescript--type-safety)
2. [Component Architecture](#component-architecture)
3. [Error Handling](#error-handling)
4. [Authorization & Security](#authorization--security)
5. [Testing Requirements](#testing-requirements)
6. [Accessibility (WCAG)](#accessibility-wcag)
7. [Documentation](#documentation)
8. [Code Review Checklist](#code-review-checklist)

---

## TypeScript & Type Safety

### Rules

- **No `any` types** - Always use specific types or generics
- **No implicit types** - All functions must have return types
- **No unchecked assertions** - Type assertions require comments explaining why

### Example

```typescript
// ❌ Bad - uses 'any' and implicit return
export function processData(data: any) {
  return data.map(item => item.value);
}

// ✅ Good - explicit types and return type
interface DataItem {
  id: string;
  value: number;
}

export function processData(data: DataItem[]): number[] {
  return data.map(item => item.value);
}
```

---

## Component Architecture

### Maximum Sizes

- **Preferred**: < 150 lines
- **Warning**: > 250 lines
- **Refactor Required**: > 400 lines

### Component Structure

```
Component
├── Types & Interfaces
├── Custom Hooks (business logic)
├── State Management
├── Event Handlers (useCallback)
├── Effects (useEffect)
└── Render
```

### Anti-Patterns

❌ **Avoid:**
- Business logic in components
- Direct localStorage access
- Props drilling (> 2 levels)
- Multiple conditional renders (use extract to components)

✅ **Use:**
- Custom hooks for business logic
- Service layers for data operations
- Composition and component extraction
- `useCallback` for event handlers

---

## Error Handling

### Server Actions

All server actions must:

1. **Check authentication** - Use `requireAuth()`
2. **Validate input** - Use Zod schemas
3. **Check authorization** - Use `requireOwnership()`
4. **Handle errors** - Throw meaningful error messages
5. **Log errors** - Use structured logging

```typescript
"use server";

import { requireAuth, requireOwnership } from "@/utils/serverAuth";
import { deleteSchema } from "@/lib/validation";

export async function deleteActivity(id: string): Promise<boolean> {
  // 1. Authentication
  const user = await requireAuth();
  
  // 2. Validation
  const validated = deleteSchema.parse({ id });
  
  // 3. Authorization
  const activity = db.getActivity(validated.id);
  if (!activity) throw new Error("Activity not found");
  await requireOwnership(activity.userId, "delete_activity");
  
  // 4. Operation with error handling
  try {
    return db.deleteActivity(validated.id);
  } catch (error) {
    logError("Failed to delete activity", error, { activityId: id, userId: user.id });
    throw new Error("Failed to delete activity. Please try again.");
  }
}
```

### Client Components

All async operations must:

1. **Handle loading state** - Show loading indicators
2. **Handle errors** - Display user-friendly messages
3. **Use error boundaries** - Prevent crashes
4. **Log errors** - Structured logging with context

```typescript
const handleDelete = useCallback(async (id: string) => {
  setLoading(true);
  setError(null);
  
  try {
    const ok = await deleteActivity(id);
    if (ok) {
      setItems(prev => prev.filter(item => item.id !== id));
    }
  } catch (err) {
    // Log with context
    logError("Failed to delete activity", err, { itemId: id, userId });
    // Show user-friendly message
    setError(getErrorMessage(err));
  } finally {
    setLoading(false);
  }
}, [userId]);
```

---

## Authorization & Security

### Server-Side Checks

Every server action must verify:

```typescript
// 1. User is authenticated
const user = await requireAuth();

// 2. User owns the resource
await requireOwnership(resource.userId, "action_description");

// 3. Rate limiting (for sensitive operations)
if (!checkRateLimit(userId, "delete_activity", 10, 60000)) {
  throw new Error("Too many attempts. Please try again later.");
}
```

### Input Validation

All external inputs must be validated:

```typescript
import { z } from "zod";

const updateProfileSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
  householdSize: z.number().min(1).max(20),
});

export async function updateProfile(input: unknown) {
  // Validate input using Zod
  const validated = updateProfileSchema.parse(input);
  
  // Now safe to use validated.name, validated.email, etc.
  return db.updateProfile(userId, validated);
}
```

---

## Testing Requirements

### Minimum Coverage

- **Statements**: 85%
- **Branches**: 80%
- **Functions**: 85%
- **Lines**: 85%

### What to Test

```typescript
// ✅ Unit Tests
- Validators (Zod schemas)
- Calculators (CO2e calculations)
- Utility functions (formatDate, calculateStreak)
- Service layers (createGoal, deleteActivity)

// ✅ Integration Tests
- Server actions with database
- Authentication flows
- Authorization checks

// ✅ Component Tests
- User interactions
- Form validation
- Error states
```

### Test Template

```typescript
describe("createGoal", () => {
  it("should create a goal with valid input", async () => {
    const goal = await createGoal(userId, {
      title: "Reduce meat",
      category: "FOOD",
      targetCO2e: 5,
    });
    
    expect(goal.id).toBeDefined();
    expect(goal.title).toBe("Reduce meat");
    expect(goal.isCompleted).toBe(false);
  });
  
  it("should throw error for invalid input", async () => {
    await expect(
      createGoal(userId, {
        title: "", // empty title
        category: "FOOD",
        targetCO2e: -5, // negative target
      })
    ).rejects.toThrow();
  });
});
```

---

## Accessibility (WCAG)

### Requirements

- ✅ **Semantic HTML** - Use `<button>`, `<nav>`, `<main>`, etc.
- ✅ **ARIA Labels** - All interactive elements
- ✅ **Keyboard Navigation** - All features accessible via keyboard
- ✅ **Focus Management** - Visible focus indicators
- ✅ **Color Contrast** - AA minimum (4.5:1)
- ✅ **Screen Reader** - Tested with NVDA/JAWS

### Component Template

```typescript
export function DeleteButton({ id, onDelete }: Props) {
  return (
    <button
      // Semantic
      type="button"
      
      // ARIA
      aria-label="Delete this activity"
      aria-busy={loading}
      
      // Keyboard
      onClick={handleDelete}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          handleDelete();
        }
      }}
      
      // Styling
      className="... focus:outline-none focus:ring-2 focus:ring-emerald-500 ..."
    >
      <Trash className="h-4 w-4" aria-hidden="true" />
    </button>
  );
}
```

---

## Documentation

### JSDoc Requirements

**Every exported function must have JSDoc:**

```typescript
/**
 * Brief description of what this does.
 *
 * Longer explanation if needed. Include:
 * - What the function does
 * - When to call it
 * - What it returns
 * - What errors it can throw
 *
 * @example
 * ```ts
 * const goal = await createGoal(userId, {
 *   title: "Reduce meat",
 *   category: "FOOD",
 *   targetCO2e: 5
 * });
 * ```
 *
 * @param userId - The user's ID
 * @param input - Goal creation data
 * @returns The created goal
 * @throws Error if validation fails or user not found
 */
export async function createGoal(
  userId: string,
  input: CreateGoalInput
): Promise<Goal> {
  // Implementation
}
```

---

## Code Review Checklist

Before merging, verify:

### Type Safety
- [ ] No `any` types
- [ ] All functions have return types
- [ ] All imports are used

### Error Handling
- [ ] Server actions check auth and validation
- [ ] Error messages are user-friendly
- [ ] Errors are logged with context

### Security
- [ ] Authorization checks for owned resources
- [ ] Input validation on all external data
- [ ] No secrets in code

### Accessibility
- [ ] Semantic HTML used
- [ ] ARIA labels present
- [ ] Keyboard navigation works
- [ ] Focus indicators visible

### Testing
- [ ] New functions have tests
- [ ] Tests verify both success and error cases
- [ ] Coverage meets minimums

### Documentation
- [ ] Public functions have JSDoc
- [ ] Complex logic has comments
- [ ] README updated if needed

### Performance
- [ ] useCallback used for event handlers
- [ ] useMemo used for expensive computations
- [ ] No unnecessary re-renders
- [ ] Server components preferred over client

### Accessibility (Re-verify)
- [ ] Run accessibility linter
- [ ] Test with keyboard only
- [ ] Check color contrast

---

## Quality Gates

The CI/CD pipeline will **fail** if:

```bash
✅ ESLint passes         bun run lint
✅ TypeScript passes     bun run tsc --noEmit
✅ Tests pass            bun run test
✅ Build succeeds        bun run build
✅ Tests cover 85%       bun run test:coverage
```

---

## Questions?

Refer to specific guidance files:

- **Validation**: See `src/lib/validation/`
- **Components**: See `src/components/` and `src/features/`
- **Services**: See `src/services/`
- **Types**: See `src/types/`

For architectural decisions, see the main README.md and PRD documents.
