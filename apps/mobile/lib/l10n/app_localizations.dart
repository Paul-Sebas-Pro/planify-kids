import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:flutter/widgets.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:intl/intl.dart' as intl;

import 'app_localizations_en.dart';
import 'app_localizations_fr.dart';

// ignore_for_file: type=lint

/// Callers can lookup localized strings with an instance of AppLocalizations
/// returned by `AppLocalizations.of(context)`.
///
/// Applications need to include `AppLocalizations.delegate()` in their app's
/// `localizationDelegates` list, and the locales they support in the app's
/// `supportedLocales` list. For example:
///
/// ```dart
/// import 'l10n/app_localizations.dart';
///
/// return MaterialApp(
///   localizationsDelegates: AppLocalizations.localizationsDelegates,
///   supportedLocales: AppLocalizations.supportedLocales,
///   home: MyApplicationHome(),
/// );
/// ```
///
/// ## Update pubspec.yaml
///
/// Please make sure to update your pubspec.yaml to include the following
/// packages:
///
/// ```yaml
/// dependencies:
///   # Internationalization support.
///   flutter_localizations:
///     sdk: flutter
///   intl: any # Use the pinned version from flutter_localizations
///
///   # Rest of dependencies
/// ```
///
/// ## iOS Applications
///
/// iOS applications define key application metadata, including supported
/// locales, in an Info.plist file that is built into the application bundle.
/// To configure the locales supported by your app, you’ll need to edit this
/// file.
///
/// First, open your project’s ios/Runner.xcworkspace Xcode workspace file.
/// Then, in the Project Navigator, open the Info.plist file under the Runner
/// project’s Runner folder.
///
/// Next, select the Information Property List item, select Add Item from the
/// Editor menu, then select Localizations from the pop-up menu.
///
/// Select and expand the newly-created Localizations item then, for each
/// locale your application supports, add a new item and select the locale
/// you wish to add from the pop-up menu in the Value field. This list should
/// be consistent with the languages listed in the AppLocalizations.supportedLocales
/// property.
abstract class AppLocalizations {
  AppLocalizations(String locale)
    : localeName = intl.Intl.canonicalizedLocale(locale.toString());

  final String localeName;

  static AppLocalizations? of(BuildContext context) {
    return Localizations.of<AppLocalizations>(context, AppLocalizations);
  }

  static const LocalizationsDelegate<AppLocalizations> delegate =
      _AppLocalizationsDelegate();

  /// A list of this localizations delegate along with the default localizations
  /// delegates.
  ///
  /// Returns a list of localizations delegates containing this delegate along with
  /// GlobalMaterialLocalizations.delegate, GlobalCupertinoLocalizations.delegate,
  /// and GlobalWidgetsLocalizations.delegate.
  ///
  /// Additional delegates can be added by appending to this list in
  /// MaterialApp. This list does not have to be used at all if a custom list
  /// of delegates is preferred or required.
  static const List<LocalizationsDelegate<dynamic>> localizationsDelegates =
      <LocalizationsDelegate<dynamic>>[
        delegate,
        GlobalMaterialLocalizations.delegate,
        GlobalCupertinoLocalizations.delegate,
        GlobalWidgetsLocalizations.delegate,
      ];

  /// A list of this localizations delegate's supported locales.
  static const List<Locale> supportedLocales = <Locale>[
    Locale('fr'),
    Locale('en'),
  ];

  /// No description provided for @shellNavToday.
  ///
  /// In fr, this message translates to:
  /// **'Aujourd\'hui'**
  String get shellNavToday;

  /// No description provided for @shellNavRewards.
  ///
  /// In fr, this message translates to:
  /// **'Récompenses'**
  String get shellNavRewards;

  /// No description provided for @shellNavExchanges.
  ///
  /// In fr, this message translates to:
  /// **'Échanges'**
  String get shellNavExchanges;

  /// No description provided for @shellNavBadges.
  ///
  /// In fr, this message translates to:
  /// **'Badges'**
  String get shellNavBadges;

  /// No description provided for @shellNavProfile.
  ///
  /// In fr, this message translates to:
  /// **'Profil'**
  String get shellNavProfile;

  /// No description provided for @loginTitle.
  ///
  /// In fr, this message translates to:
  /// **'Planify Kids 🌟'**
  String get loginTitle;

  /// No description provided for @loginTabParent.
  ///
  /// In fr, this message translates to:
  /// **'Parent'**
  String get loginTabParent;

  /// No description provided for @loginTabChild.
  ///
  /// In fr, this message translates to:
  /// **'Enfant'**
  String get loginTabChild;

  /// No description provided for @loginFieldRequired.
  ///
  /// In fr, this message translates to:
  /// **'Champ requis'**
  String get loginFieldRequired;

  /// No description provided for @loginEmailLabel.
  ///
  /// In fr, this message translates to:
  /// **'Email'**
  String get loginEmailLabel;

  /// No description provided for @loginPasswordLabel.
  ///
  /// In fr, this message translates to:
  /// **'Mot de passe'**
  String get loginPasswordLabel;

  /// No description provided for @loginSubmit.
  ///
  /// In fr, this message translates to:
  /// **'Se connecter'**
  String get loginSubmit;

  /// No description provided for @loginNetworkError.
  ///
  /// In fr, this message translates to:
  /// **'Serveur inaccessible. Vérifie que l\'API est démarrée.'**
  String get loginNetworkError;

  /// No description provided for @loginInvalidCredentials.
  ///
  /// In fr, this message translates to:
  /// **'Email ou mot de passe incorrect.'**
  String get loginInvalidCredentials;

  /// No description provided for @loginFamilyCodeLabel.
  ///
  /// In fr, this message translates to:
  /// **'Code famille'**
  String get loginFamilyCodeLabel;

  /// No description provided for @loginPinLabel.
  ///
  /// In fr, this message translates to:
  /// **'PIN (4 chiffres)'**
  String get loginPinLabel;

  /// No description provided for @loginCodeRequired.
  ///
  /// In fr, this message translates to:
  /// **'Code de 6 caractères requis'**
  String get loginCodeRequired;

  /// No description provided for @loginInvalidFamilyCode.
  ///
  /// In fr, this message translates to:
  /// **'Code famille invalide'**
  String get loginInvalidFamilyCode;

  /// No description provided for @loginNetworkErrorGeneric.
  ///
  /// In fr, this message translates to:
  /// **'Erreur réseau'**
  String get loginNetworkErrorGeneric;

  /// No description provided for @loginPinIncorrect.
  ///
  /// In fr, this message translates to:
  /// **'PIN incorrect.'**
  String get loginPinIncorrect;

  /// No description provided for @profileTitle.
  ///
  /// In fr, this message translates to:
  /// **'Mon profil'**
  String get profileTitle;

  /// No description provided for @profileLogoutTooltip.
  ///
  /// In fr, this message translates to:
  /// **'Déconnexion'**
  String get profileLogoutTooltip;

  /// No description provided for @profilePoints.
  ///
  /// In fr, this message translates to:
  /// **'{count} points'**
  String profilePoints(Object count);

  /// No description provided for @profileHistoryTitle.
  ///
  /// In fr, this message translates to:
  /// **'Mon historique'**
  String get profileHistoryTitle;

  /// No description provided for @profileHistorySubtitle.
  ///
  /// In fr, this message translates to:
  /// **'Tâches, badges, récompenses'**
  String get profileHistorySubtitle;

  /// No description provided for @profilePlanningTitle.
  ///
  /// In fr, this message translates to:
  /// **'Planning famille'**
  String get profilePlanningTitle;

  /// No description provided for @profilePlanningSubtitle.
  ///
  /// In fr, this message translates to:
  /// **'Toutes les tâches de la semaine'**
  String get profilePlanningSubtitle;

  /// No description provided for @profileNotificationsTitle.
  ///
  /// In fr, this message translates to:
  /// **'Notifications'**
  String get profileNotificationsTitle;

  /// No description provided for @profileNotificationsUnread.
  ///
  /// In fr, this message translates to:
  /// **'{count} non lue{plural}'**
  String profileNotificationsUnread(Object count, Object plural);

  /// No description provided for @profileNotificationsAllRead.
  ///
  /// In fr, this message translates to:
  /// **'Tout est lu'**
  String get profileNotificationsAllRead;

  /// No description provided for @profileRankingTitle.
  ///
  /// In fr, this message translates to:
  /// **'Classement famille'**
  String get profileRankingTitle;

  /// No description provided for @profileLoadError.
  ///
  /// In fr, this message translates to:
  /// **'Impossible de charger : {error}'**
  String profileLoadError(Object error);

  /// No description provided for @profileLanguageTitle.
  ///
  /// In fr, this message translates to:
  /// **'Langue'**
  String get profileLanguageTitle;

  /// No description provided for @profileLanguageFr.
  ///
  /// In fr, this message translates to:
  /// **'Français'**
  String get profileLanguageFr;

  /// No description provided for @profileLanguageEn.
  ///
  /// In fr, this message translates to:
  /// **'English'**
  String get profileLanguageEn;
}

class _AppLocalizationsDelegate
    extends LocalizationsDelegate<AppLocalizations> {
  const _AppLocalizationsDelegate();

  @override
  Future<AppLocalizations> load(Locale locale) {
    return SynchronousFuture<AppLocalizations>(lookupAppLocalizations(locale));
  }

  @override
  bool isSupported(Locale locale) =>
      <String>['en', 'fr'].contains(locale.languageCode);

  @override
  bool shouldReload(_AppLocalizationsDelegate old) => false;
}

AppLocalizations lookupAppLocalizations(Locale locale) {
  // Lookup logic when only language code is specified.
  switch (locale.languageCode) {
    case 'en':
      return AppLocalizationsEn();
    case 'fr':
      return AppLocalizationsFr();
  }

  throw FlutterError(
    'AppLocalizations.delegate failed to load unsupported locale "$locale". This is likely '
    'an issue with the localizations generation tool. Please file an issue '
    'on GitHub with a reproducible sample app and the gen-l10n configuration '
    'that was used.',
  );
}
