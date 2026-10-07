import 'package:dio/dio.dart';
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
  final childLogins = <(String, String, String?)>[];

  /// Code HTTP d'échec simulé pour la prochaine connexion enfant.
  int? failWith;

  @override
  Future<AuthUser?> build() async => null; // déconnecté

  @override
  Future<void> loginChild(
      String familyCode, String memberId, String? pin) async {
    childLogins.add((familyCode, memberId, pin));
    final code = failWith;
    if (code != null) {
      final req = RequestOptions(path: '/auth/login-child');
      state = AsyncError(
        DioException(
          requestOptions: req,
          response: Response(requestOptions: req, statusCode: code),
        ),
        StackTrace.current,
      );
    }
  }
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
  Future<String?> getFamilyCode() async => _data['familyCode'];

  @override
  Future<void> saveFamilyCode(String code) async => _data['familyCode'] = code;

  @override
  Future<void> clearSession() async {
    _data.remove('token');
    _data.remove('user');
  }

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
        {
          'id': 'tom-id',
          'name': 'Tom',
          'color': '#4CAF50',
          'avatar': null,
          'pinRequired': false,
        },
      ];
    }
    throw Exception('Code invalide');
  }
}

Widget _wrap({_FakeStorage? storage}) {
  return ProviderScope(
    overrides: [
      authProvider.overrideWith(() => _FakeAuthNotifier()),
      secureStorageServiceProvider.overrideWithValue(storage ?? _FakeStorage()),
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

    testWidgets(
        'onglet Enfant — code famille mémorisé préchargé et recherché automatiquement',
        (tester) async {
      final storage = _FakeStorage();
      await storage.saveFamilyCode('DEMO01');

      await tester.pumpWidget(_wrap(storage: storage));
      await tester.tap(find.text('Enfant'));
      await tester.pumpAndSettle();

      expect(find.text('DEMO01'), findsOneWidget);
      expect(find.text('Alice'), findsOneWidget);
    });

    Future<_FakeAuthNotifier> openChildTab(WidgetTester tester) async {
      final storage = _FakeStorage();
      await storage.saveFamilyCode('DEMO01');
      final auth = _FakeAuthNotifier();
      await tester.pumpWidget(ProviderScope(
        overrides: [
          authProvider.overrideWith(() => auth),
          secureStorageServiceProvider.overrideWithValue(storage),
          apiClientProvider.overrideWithValue(_FakeApiClient()),
        ],
        child: const MaterialApp(home: LoginScreen()),
      ));
      await tester.tap(find.text('Enfant'));
      await tester.pumpAndSettle();
      return auth;
    }

    testWidgets('enfant avec PIN — champ PIN affiché, pas de connexion directe',
        (tester) async {
      final auth = await openChildTab(tester);

      await tester.tap(find.text('Alice'));
      await tester.pumpAndSettle();

      expect(find.widgetWithText(TextField, 'PIN (4 chiffres)'), findsOneWidget);
      expect(auth.childLogins, isEmpty);
    });

    testWidgets('enfant sans PIN — pas de champ PIN, connexion au tap',
        (tester) async {
      final auth = await openChildTab(tester);

      await tester.tap(find.text('Tom'));
      await tester.pumpAndSettle();

      expect(find.widgetWithText(TextField, 'PIN (4 chiffres)'), findsNothing);
      expect(auth.childLogins, [('DEMO01', 'tom-id', null)]);
    });

    testWidgets('trop d\'essais (429) — message de blocage, pas « PIN incorrect »',
        (tester) async {
      final auth = await openChildTab(tester);
      auth.failWith = 429;

      await tester.tap(find.text('Alice'));
      await tester.pumpAndSettle();
      await tester.enterText(
          find.widgetWithText(TextField, 'PIN (4 chiffres)'), '0000');
      await tester.pump();
      await tester.tap(find.widgetWithText(FilledButton, 'Se connecter'));
      await tester.pump();

      expect(find.textContaining("Trop d'essais"), findsOneWidget);
    });
  });
}
