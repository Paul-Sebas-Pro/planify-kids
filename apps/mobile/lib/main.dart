import 'package:firebase_core/firebase_core.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/date_symbol_data_local.dart';

import 'app/app.dart';
import 'database/connector.dart';
import 'database/database.dart';
import 'shared/services/api_client.dart';
import 'shared/services/secure_storage.dart';

// Notifications push actives uniquement si google-services.json / GoogleService-Info.plist présent
bool firebaseAvailable = false;

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await initializeDateFormatting('fr_FR');

  try {
    await Firebase.initializeApp();
    firebaseAvailable = true;
  } catch (_) {
    // Pas de config Firebase — notifications push désactivées, app fonctionnelle.
  }

  if (!kIsWeb) {
    final storage = SecureStorageService();
    final api = ApiClient(storage);
    final connector = PlanifyConnector(api);
    await openAppDatabase(connector);
  }

  runApp(
    const ProviderScope(
      child: PlanifyKidsApp(),
    ),
  );
}
