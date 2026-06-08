---
name: flutter-standards
description: Flutter and Dart standards for widgets, state, navigation, async, testing, and mobile performance. Use when building or reviewing Flutter apps, Dart packages, pubspec.yaml, or platform channels.
---

# Flutter Standards

## 0. Language baseline (required)

All Flutter code follows **Dart** conventions:

| Concern | Rule |
|---------|------|
| Null safety | Sound null safety; avoid `!` unless proven non-null |
| Types | Explicit types on public APIs; infer locals when obvious |
| Async | `async`/`await`; cancel subscriptions and `StreamSubscription`s |
| Immutability | `const` constructors and widgets where values are compile-time stable |
| Analysis | Honor `analysis_options.yaml` / `flutter_lints` (or team linter set) |

## 1. Project structure

Prefer **feature-first** layout for apps beyond a few screens:

```
lib/
  app/              # MaterialApp, router, theme, DI bootstrap
  features/
    auth/
      data/
      domain/
      presentation/
  core/             # shared widgets, errors, network, extensions
```

**Rules**

- **One public widget per file** for non-trivial UI; colocate `*_test.dart` beside source.
- Keep **platform code** under `android/`, `ios/`, etc.; expose narrow APIs via method channels or federated plugins.
- Dependencies in `pubspec.yaml`: pin versions; document why for non-obvious packages.

## 2. Naming and files

- Files: `snake_case.dart` (`user_profile_screen.dart`).
- Classes / enums / typedefs: `PascalCase`.
- Members / locals / parameters: `lowerCamelCase`.
- Private members: leading `_`.
- Screens: suffix `Screen` or `Page` consistently per repo.

## 3. Widget architecture

- Prefer **StatelessWidget** + injected state over large `StatefulWidget` trees.
- **Composition** over deep inheritance; extract sub-widgets when build methods grow or repeat.
- Pass **callbacks and data down**; avoid global singletons for UI state.

```dart
class OrderSummary extends StatelessWidget {
  const OrderSummary({super.key, required this.order, required this.onCheckout});

  final Order order;
  final VoidCallback onCheckout;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Text(order.title, style: Theme.of(context).textTheme.titleLarge),
        FilledButton(onPressed: onCheckout, child: const Text('Checkout')),
      ],
    );
  }
}
```

## 4. State management

- **Local UI state:** `StatefulWidget`, `ValueNotifier`, or `HookWidget` when the team uses hooks.
- **App / feature state:** one primary pattern per app (e.g. **Riverpod**, **Bloc**, **Provider**)—do not mix ad hoc globals.
- **Server state:** repository + explicit loading/error/data models; cache policy documented (TTL, invalidation).
- **Rebuild scope:** lift state only as high as needed; use `Selector` / `BlocBuilder` `buildWhen` to limit rebuilds.

## 5. Navigation and routing

- Prefer **declarative routing** (`go_router` or team standard).
- **Deep links** and auth redirects defined in one place; guard routes that require session.
- Pass **IDs**, not heavy objects, in route parameters; load detail in destination.

## 6. Async, errors, and UX

- Show **loading / empty / error** states for async UI; never infinite spinners without timeout handling.
- Map failures to user-safe messages; log technical detail with context (no PII).
- Use `try`/`catch` at boundaries (repositories, platform channels); propagate typed failures inward.

```dart
sealed class AppFailure implements Exception {
  const AppFailure();
}

class NetworkFailure extends AppFailure {
  const NetworkFailure(this.cause);
  final Object cause;
}
```

## 7. Performance

- **`const` widgets** in lists and static subtrees.
- **List/grid:** `ListView.builder` / `SliverList`—never unbounded `Column` of hundreds of children.
- **Images:** cache width/height; use `cached_network_image` or equivalent for remote assets.
- **Jank:** avoid sync I/O on UI isolate; use `compute` / isolates for heavy CPU work.
- **Build cost:** split widgets; profile with DevTools before premature `RepaintBoundary`.

## 8. Theming and accessibility

- Centralize **ThemeData** / `ColorScheme`; avoid hard-coded colors in feature widgets.
- Respect **text scale** and contrast; minimum touch targets (~48 logical pixels).
- Set **Semantics** labels for icon-only controls; test TalkBack / VoiceOver on critical flows.

## 9. Networking and security

- **HTTPS only** in production; certificate pinning only when product requires it.
- Store tokens in **flutter_secure_storage** (or platform keystore), not `SharedPreferences`.
- Validate and parse JSON with typed models (`json_serializable`, **freezed**, or manual factories)—no unchecked `Map` drilling in UI.
- **Never** embed API secrets in client binaries; use backend-issued short-lived tokens.

## 10. Platform integration

- **Method channels:** small, versioned message contracts; validate arguments in native code.
- Prefer **existing plugins** over custom channels when maintained and fit requirements.
- Document **permissions** (camera, location, notifications) in platform manifests with runtime requests.

## 11. Testing

- **Unit:** domain logic, parsers, repositories (mock HTTP with `http.MockClient` or Mockito).
- **Widget:** `testWidgets` for UI states and interactions; pump with realistic `MediaQuery` / theme.
- **Integration:** `integration_test` for login/checkout smoke paths in CI when feasible.
- Golden tests for stable design-system widgets when the team uses them.

## Anti-patterns

- Business logic inside `build()` methods.
- `setState` spanning unrelated subtrees—extract state holder or use dedicated state library.
- `print` for production diagnostics—use structured logging (`dart:developer`, `logger`).
- Ignoring `mounted` before `setState` / context use after async gaps in `StatefulWidget`.

## Cross-references

- Universal gates: `.cursor/rules/rules.mdc`
- Cursor rule (globs): `.cursor/rules/flutter-stack.mdc`
- Reference (layout + examples): [reference/README.md](reference/README.md)
- Suite index: [../SKILL.md](../SKILL.md)
