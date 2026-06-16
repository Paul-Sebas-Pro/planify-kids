import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mobile/features/auth/auth_provider.dart';
import 'package:mobile/features/auth/login_screen.dart';
import 'package:mobile/models/auth_user.dart';
import 'package:mobile/shared/providers/providers.dart';
import 'package:mobile/shared/services/api_client.dart';
import 'package:mobile/shared/services/secure_storage.dart';

// Fakes -----------------------------------------------------------------------

class _FakeAuthNotifier extends AuthNotifier {
  @override
  Future<AuthUser?> build() async => null; // déconnecté
}

class _FakeStorage extends SecureStorageService {
  final _data = <String, String>{};

  @override
  Future<String?> getToken() async => _data['token'];

  @override
  Future<void> saveToken(String token) async => _data['token'] = token;

  @override
  Future<String?> getUserJson() async => _data['user'];

  @override
  Future<void> saveUserJson(String json) async => _data['user'] = json;

  @override
  Future<void> clear() async => _data.clear();
}

class _FakeApiClient extends ApiClient {
  _FakeApiClient() : super(_FakeStorage());

  @override
  Future<List<Map<String, dynamic>>> getChildrenByCode(String code) async {
    if (code == 'DEMO01') {
      return [
        {'id': 'alice-id', 'name': 'Alice', 'color': '#FF6584', 'avatar': null},
      ];
    }
    throw Exception('Code invalide');
  }
}

Widget _wrap() {
  final storage = _FakeStorage();
  return ProviderScope(
    overrides: [
      authProvider.overrideWith(() => _FakeAuthNotifier()),
      secureStorageServiceProvider.overrideWithValue(storage),
      apiClientProvider.overrideWithValue(_FakeApiClient()),
    ],
    child: const MaterialApp(home: LoginScreen()),
  );
}

// Tests -----------------------------------------------------------------------

void main() {
  group('LoginScreen', () {
    testWidgets('affiche onglets Parent et Enfant', (tester) async {
      await tester.pumpWidget(_wrap());
      expect(find.text('Parent'), findsOneWidget);
      expect(find.text('Enfant'), findsOneWidget);
    });

    testWidgets('onglet Parent — champs email et mot de passe visibles',
        (tester) async {
      await tester.pumpWidget(_wrap());
      expect(find.widgetWithText(TextFormField, 'Email'), findsOneWidget);
      expect(
          find.widgetWithText(TextFormField, 'Mot de passe'), findsOneWidget);
    });

    testWidgets('onglet Parent — soumission vide affiche erreurs de validation',
        (tester) async {
      await tester.pumpWidget(_wrap());
      await tester.pump(); // authProvider async build résout → isLoading=false
      await tester.tap(find.text('Se connecter'));
      await tester.pump();
      expect(find.text('Champ requis'), findsWidgets);
    });

    testWidgets('onglet Enfant — champ code famille visible', (tester) async {
      await tester.pumpWidget(_wrap());
      await tester.tap(find.text('Enfant'));
      await tester.pumpAndSettle();
      expect(find.widgetWithText(TextField, 'Code famille'), findsOneWidget);
    });

    testWidgets('onglet Enfant — recherche DEMO01 affiche Alice',
        (tester) async {
      await tester.pumpWidget(_wrap());
      await tester.tap(find.text('Enfant'));
      await tester.pumpAndSettle();

      await tester.enterText(
          find.widgetWithText(TextField, 'Code famille'), 'DEMO01');
      await tester.tap(find.byIcon(Icons.search));
      await tester.pumpAndSettle();

      expect(find.text('Alice'), findsOneWidget);
    });
  });
}
