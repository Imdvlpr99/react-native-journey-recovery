# Multi-Screen Checkout Flow Example

A complete multi-step e-commerce checkout flow demonstrating:
1. **Incremental checkpointing** across steps: `cart` ➔ `shipping` ➔ `delivery` ➔ `review`.
2. **Recovery Prompt**: Detects unfinished cart/checkout sessions on launch and prompts the user to resume or start over.
3. **Sensitive Field Exclusion**: Protects payment and billing details from local persistence.
4. **Clean Dismissal**: Calls `journey.clear()` upon final order confirmation.

## Key Files
- [`CheckoutFlow.tsx`](CheckoutFlow.tsx): The complete multi-step checkout component.
- [`types.ts`](types.ts): TypeScript data contracts for cart, shipping, and delivery state.

