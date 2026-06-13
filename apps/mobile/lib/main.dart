import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/date_symbol_data_local.dart';

import 'app/app.dart';
import 'database/connector.dart';
import 'database/database.dart';
import 'shared/services/secure_storage.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await initializeDateFormatting('fr_FR');

  final storage = SecureStorageService();
  final connector = PlanifyConnector(storage);
  await openAppDatabase(connector);

  runApp(
    const ProviderScope(
      child: PlanifyKidsApp(),
    ),
  );
}
