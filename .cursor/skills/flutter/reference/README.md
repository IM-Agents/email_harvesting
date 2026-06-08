# Flutter — reference

**Canonical standard:** [../SKILL.md](../SKILL.md)  
**Suite index:** [../../SKILL.md](../../SKILL.md)  
**Cursor rule:** `.cursor/rules/flutter-stack.mdc`

## Repository layout (typical app)

```
lib/
  app/
    app.dart
    router.dart
    theme.dart
  core/
    network/
    widgets/
    errors/
  features/
    home/
      presentation/
      domain/
      data/
test/
  features/
    home/
      presentation/
      home_screen_test.dart
integration_test/
  app_test.dart
```

**Rules**

- Mirror `lib/features/<name>/` under `test/features/<name>/` when tests are feature-scoped.
- Keep `main.dart` thin: run app, zone/error hooks, flavor config only.

## State management quick pick

| Pattern | Use when |
|---------|----------|
| Riverpod | New apps; compile-safe providers, async caching |
| Bloc | Event-driven flows, explicit state machines |
| Provider | Legacy/simple DI; prefer Riverpod for greenfield |

Pick **one** primary pattern per app; document in `README` or `architecture/`.

## Performance checklist

- DevTools timeline on scroll-heavy screens before optimizing.
- `const` on static children in `itemBuilder`.
- Dispose `AnimationController`, `TextEditingController`, `ScrollController` in `State.dispose`.
- Avoid `shrinkWrap: true` on large nested scrollables without measurement.

## Code examples

### Repository boundary

```dart
abstract class UserRepository {
  Future<User> fetchUser(String id);
}

class ApiUserRepository implements UserRepository {
  ApiUserRepository(this._client);
  final http.Client _client;

  @override
  Future<User> fetchUser(String id) async {
    final res = await _client.get(Uri.parse('/users/$id'));
    if (res.statusCode != 200) {
      throw NetworkFailure('status ${res.statusCode}');
    }
    return User.fromJson(jsonDecode(res.body) as Map<String, dynamic>);
  }
}
```

### Async UI states

```dart
class UserPanel extends StatelessWidget {
  const UserPanel({super.key, required this.userId});
  final String userId;

  @override
  Widget build(BuildContext context) {
    return FutureBuilder<User>(
      future: context.read<UserRepository>().fetchUser(userId),
      builder: (context, snapshot) {
        if (snapshot.connectionState == ConnectionState.waiting) {
          return const Center(child: CircularProgressIndicator());
        }
        if (snapshot.hasError) {
          return ErrorBanner(message: 'Could not load user');
        }
        return UserCard(user: snapshot.requireData);
      },
    );
  }
}
```

### Widget test skeleton

```dart
testWidgets('shows checkout button', (tester) async {
  await tester.pumpWidget(
    MaterialApp(home: OrderSummary(order: fakeOrder, onCheckout: () {})),
  );
  expect(find.text('Checkout'), findsOneWidget);
});
```
