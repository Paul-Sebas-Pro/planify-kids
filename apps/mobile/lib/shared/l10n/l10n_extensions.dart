import 'package:flutter/widgets.dart';

import '../../l10n/app_localizations.dart';
import '../../l10n/app_localizations_fr.dart';

extension L10nX on BuildContext {
  AppLocalizations get l10n => AppLocalizations.of(this) ?? AppLocalizationsFr();
}
