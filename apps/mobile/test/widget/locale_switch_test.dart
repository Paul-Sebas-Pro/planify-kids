import 'package:flutter/material.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mobile/features/auth/auth_provider.dart';
import 'package:mobile/features/auth/login_screen.dart';
import 'package:mobile/l10n/app_localizations.dart';
import 'package:mobile/models/auth_user.dart';
import 'package:mobile/shared/services/api_client.dart';
import 'package:mobile/shared/services/secure_storage.dart';
import 'package:mobile/shared/providers/providers.dart';

// Fakes -----------------------------------------------------------------------

class _FakeAuthNotifier extends AuthNotifier {
  @override
  Future<AuthUser?> build() async => null;
}

class _FakeStorage extends SecureStorageService {
  @override
  Future<String?> getFamilyCode() async => null;
}

class _FakeApiClient extends ApiClient {
  _FakeApiClient() : super(_FakeStorage());
}

Widget _wrap({required Locale locale}) {
  return ProviderScope(
    overrides: [
      authProvider.overrideWith(() => _FakeAuthNotifier()),
      secureStorageServiceProvider.overrideWithValue(_FakeStorage()),
      apiClientProvider.overrideWithValue(_FakeApiClient()),
    ],
    child: MaterialApp(
      locale: locale,
      supportedLocales: AppLocalizations.supportedLocales,
      localizationsDelegates: const [
        ...AppLocalizations.localizationsDelegates,
        GlobalMaterialLocalizations.delegate,
        GlobalWidgetsLocalizations.delegate,
        GlobalCupertinoLocalizations.delegate,
      ],
      home: const LoginScreen(),
    ),
  );
}

// Tests -----------------------------------------------------------------------

void main() {
  group('Locale switch', () {
    testWidgets('locale en — LoginScreen affiche le texte anglais',
        (tester) async {
      await tester.pumpWidget(_wrap(locale: const Locale('en')));
      await tester.pump();
      expect(find.widgetWithText(TextFormField, 'Email'), findsOneWidget);
      expect(
          find.widgetWithText(TextFormField, 'Password'), findsOneWidget);
      expect(find.text('Sign in'), findsOneWidget);
      expect(find.text('Child'), findsOneWidget);
    });

    testWidgets('locale fr — LoginScreen affiche le texte français',
        (tester) async {
      await tester.pumpWidget(_wrap(locale: const Locale('fr')));
      await tester.pump();
      expect(
          find.widgetWithText(TextFormField, 'Mot de passe'), findsOneWidget);
      expect(find.text('Se connecter'), findsOneWidget);
      expect(find.text('Enfant'), findsOneWidget);
    });
  });
}
