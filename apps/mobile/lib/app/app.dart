import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../shared/theme/app_theme.dart';
import 'router.dart';

class PlanifyKidsApp extends ConsumerWidget {
  const PlanifyKidsApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final router = ref.watch(routerProvider);

    return MaterialApp.router(
      title: 'Planify Kids',
      theme: appTheme,
      routerConfig: router,
      debugShowCheckedModeBanner: false,
    );
  }
}
