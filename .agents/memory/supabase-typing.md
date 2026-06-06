---
name: Supabase Typing Strategy
description: How to type Supabase queries in this project without using Database generics
---

## Rule
Do NOT use `createClient<Database>(...)` with a custom Database generic type.
Use plain `createClient(url, key)` and cast query results manually with `as TypeName`.

## Why
Supabase's generic typed client is very strict about the shape of the Database type (requires specific Json, enum, and jsonb types). Custom Database interfaces with complex nested types (jsonb arrays like `extras: MenuItemExtra[]`) cause all `.from()` calls to return `never`, breaking the entire API layer.

## How to apply
- Keep `supabase.ts` using plain `createClient` (no generics).
- Define clean TypeScript interfaces in `database.types.ts` (no need to mirror Supabase's exact schema format).
- In `api.ts`, cast results: `return data as RestaurantRow | null`.
- For `.update()` / `.insert()`, cast params: `updates as Record<string, unknown>`.
- Use `OrderItem[]` and `MenuItemExtra[]` as real typed interfaces (not Json union type).
