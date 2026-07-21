import 'package:flutter/widgets.dart';
import 'package:intl/date_symbol_data_local.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

import 'providers.dart';

part 'locale_provider.g.dart';

const _dateLocaleByLanguageCode = {'fr': 'fr_FR', 'en': 'en_US'};

String dateLocaleFor(Locale locale) =>
    _dateLocaleByLanguageCode[locale.languageCode] ?? 'fr_FR';

@Riverpod(keepAlive: true)
class AppLocale extends _$AppLocale {
  @override
  Locale build() {
    _restore();
    return const Locale('fr');
  }

  Future<void> _restore() async {
    final storage = ref.read(secureStorageServiceProvider);
    final code = await storage.getLocale();
    if (code == null) return;
    await setLocale(Locale(code));
  }

  Future<void> setLocale(Locale locale) async {
    await initializeDateFormatting(dateLocaleFor(locale));
    state = locale;
    final storage = ref.read(secureStorageServiceProvider);
    await storage.saveLocale(locale.languageCode);
  }
}
