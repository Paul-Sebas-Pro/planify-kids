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

  /// No description provided for @todayTitle.
  ///
  /// In fr, this message translates to:
  /// **'Aujourd\'hui'**
  String get todayTitle;

  /// No description provided for @todayLogoutTooltip.
  ///
  /// In fr, this message translates to:
  /// **'Déconnexion'**
  String get todayLogoutTooltip;

  /// No description provided for @todayEmptyState.
  ///
  /// In fr, this message translates to:
  /// **'Aucune tâche aujourd\'hui !'**
  String get todayEmptyState;

  /// No description provided for @todayGreetingDone.
  ///
  /// In fr, this message translates to:
  /// **'Bravo {name} ! 🎉'**
  String todayGreetingDone(Object name);

  /// No description provided for @todayGreeting.
  ///
  /// In fr, this message translates to:
  /// **'Salut {name} !'**
  String todayGreeting(Object name);

  /// No description provided for @todayProgressSummary.
  ///
  /// In fr, this message translates to:
  /// **'{completed} / {total} tâche{tacheS} terminée{termineeS}'**
  String todayProgressSummary(
    Object completed,
    Object tacheS,
    Object termineeS,
    Object total,
  );

  /// No description provided for @todaySectionPending.
  ///
  /// In fr, this message translates to:
  /// **'À faire ({count})'**
  String todaySectionPending(Object count);

  /// No description provided for @todaySectionDone.
  ///
  /// In fr, this message translates to:
  /// **'Terminé ({count})'**
  String todaySectionDone(Object count);

  /// No description provided for @todaySectionOther.
  ///
  /// In fr, this message translates to:
  /// **'Autres ({count})'**
  String todaySectionOther(Object count);

  /// No description provided for @todayUndoTitle.
  ///
  /// In fr, this message translates to:
  /// **'Annuler cette tâche ?'**
  String get todayUndoTitle;

  /// No description provided for @todayUndoContent.
  ///
  /// In fr, this message translates to:
  /// **'La tâche repassera en \"À faire\" et les points gagnés seront retirés.'**
  String get todayUndoContent;

  /// No description provided for @todayUndoCancel.
  ///
  /// In fr, this message translates to:
  /// **'Annuler'**
  String get todayUndoCancel;

  /// No description provided for @todayUndoConfirm.
  ///
  /// In fr, this message translates to:
  /// **'Confirmer'**
  String get todayUndoConfirm;

  /// No description provided for @todaySlotNoon.
  ///
  /// In fr, this message translates to:
  /// **'Midi'**
  String get todaySlotNoon;

  /// No description provided for @todaySlotEvening.
  ///
  /// In fr, this message translates to:
  /// **'Soir'**
  String get todaySlotEvening;

  /// No description provided for @exchangesTitle.
  ///
  /// In fr, this message translates to:
  /// **'Échanges'**
  String get exchangesTitle;

  /// No description provided for @exchangesPropose.
  ///
  /// In fr, this message translates to:
  /// **'Proposer'**
  String get exchangesPropose;

  /// No description provided for @exchangesEmpty.
  ///
  /// In fr, this message translates to:
  /// **'Aucun échange en cours'**
  String get exchangesEmpty;

  /// No description provided for @exchangesIncoming.
  ///
  /// In fr, this message translates to:
  /// **'Demandes reçues ({count})'**
  String exchangesIncoming(Object count);

  /// No description provided for @exchangesOutgoing.
  ///
  /// In fr, this message translates to:
  /// **'Demandes envoyées ({count})'**
  String exchangesOutgoing(Object count);

  /// No description provided for @exchangesHistory.
  ///
  /// In fr, this message translates to:
  /// **'Historique'**
  String get exchangesHistory;

  /// No description provided for @exchangesStatusAccepted.
  ///
  /// In fr, this message translates to:
  /// **'Accepté'**
  String get exchangesStatusAccepted;

  /// No description provided for @exchangesStatusRefused.
  ///
  /// In fr, this message translates to:
  /// **'Refusé'**
  String get exchangesStatusRefused;

  /// No description provided for @exchangesStatusPending.
  ///
  /// In fr, this message translates to:
  /// **'En attente'**
  String get exchangesStatusPending;

  /// No description provided for @exchangesRefuse.
  ///
  /// In fr, this message translates to:
  /// **'Refuser'**
  String get exchangesRefuse;

  /// No description provided for @exchangesAccept.
  ///
  /// In fr, this message translates to:
  /// **'Accepter'**
  String get exchangesAccept;

  /// No description provided for @exchangesDefaultTaskName.
  ///
  /// In fr, this message translates to:
  /// **'Tâche'**
  String get exchangesDefaultTaskName;

  /// No description provided for @exchangesProposeDialogTitle.
  ///
  /// In fr, this message translates to:
  /// **'Proposer un échange'**
  String get exchangesProposeDialogTitle;

  /// No description provided for @exchangesLoadTasksError.
  ///
  /// In fr, this message translates to:
  /// **'Erreur de chargement des tâches'**
  String get exchangesLoadTasksError;

  /// No description provided for @exchangesNoTaskToday.
  ///
  /// In fr, this message translates to:
  /// **'Aucune tâche à échanger aujourd\'hui.'**
  String get exchangesNoTaskToday;

  /// No description provided for @exchangesMyTaskLabel.
  ///
  /// In fr, this message translates to:
  /// **'Ma tâche'**
  String get exchangesMyTaskLabel;

  /// No description provided for @exchangesLoadMembersError.
  ///
  /// In fr, this message translates to:
  /// **'Erreur de chargement des membres'**
  String get exchangesLoadMembersError;

  /// No description provided for @exchangesNoSiblings.
  ///
  /// In fr, this message translates to:
  /// **'Aucun autre enfant dans la famille.'**
  String get exchangesNoSiblings;

  /// No description provided for @exchangesExchangeWithLabel.
  ///
  /// In fr, this message translates to:
  /// **'Échanger avec'**
  String get exchangesExchangeWithLabel;

  /// No description provided for @exchangesCancel.
  ///
  /// In fr, this message translates to:
  /// **'Annuler'**
  String get exchangesCancel;

  /// No description provided for @exchangesSubmitError.
  ///
  /// In fr, this message translates to:
  /// **'Impossible de proposer cet échange.'**
  String get exchangesSubmitError;

  /// No description provided for @taskCardDone.
  ///
  /// In fr, this message translates to:
  /// **'Fait ✓'**
  String get taskCardDone;

  /// No description provided for @taskCardSkipped.
  ///
  /// In fr, this message translates to:
  /// **'Passée'**
  String get taskCardSkipped;

  /// No description provided for @taskCardLate.
  ///
  /// In fr, this message translates to:
  /// **'En retard'**
  String get taskCardLate;

  /// No description provided for @taskCardDoneButton.
  ///
  /// In fr, this message translates to:
  /// **'Fait !'**
  String get taskCardDoneButton;

  /// No description provided for @apiErrorSessionExpiredTitle.
  ///
  /// In fr, this message translates to:
  /// **'Session expirée'**
  String get apiErrorSessionExpiredTitle;

  /// No description provided for @apiErrorSessionExpiredHint.
  ///
  /// In fr, this message translates to:
  /// **'Reconnecte-toi pour continuer.'**
  String get apiErrorSessionExpiredHint;

  /// No description provided for @apiErrorReconnect.
  ///
  /// In fr, this message translates to:
  /// **'Se reconnecter'**
  String get apiErrorReconnect;

  /// No description provided for @apiErrorNetwork.
  ///
  /// In fr, this message translates to:
  /// **'Serveur inaccessible. Vérifie ta connexion.'**
  String get apiErrorNetwork;

  /// No description provided for @apiErrorGeneric.
  ///
  /// In fr, this message translates to:
  /// **'Une erreur est survenue.'**
  String get apiErrorGeneric;

  /// No description provided for @apiErrorRetry.
  ///
  /// In fr, this message translates to:
  /// **'Réessayer'**
  String get apiErrorRetry;

  /// No description provided for @rewardsTitle.
  ///
  /// In fr, this message translates to:
  /// **'Récompenses'**
  String get rewardsTitle;

  /// No description provided for @rewardsEmpty.
  ///
  /// In fr, this message translates to:
  /// **'Aucune récompense disponible pour l\'instant.'**
  String get rewardsEmpty;

  /// No description provided for @rewardsAvailable.
  ///
  /// In fr, this message translates to:
  /// **'Disponibles'**
  String get rewardsAvailable;

  /// No description provided for @rewardsMyRequests.
  ///
  /// In fr, this message translates to:
  /// **'Mes demandes'**
  String get rewardsMyRequests;

  /// No description provided for @rewardsPending.
  ///
  /// In fr, this message translates to:
  /// **'En attente'**
  String get rewardsPending;

  /// No description provided for @rewardsClaim.
  ///
  /// In fr, this message translates to:
  /// **'Demander'**
  String get rewardsClaim;

  /// No description provided for @rewardsApproved.
  ///
  /// In fr, this message translates to:
  /// **'Approuvée ✓'**
  String get rewardsApproved;

  /// No description provided for @rewardsRejected.
  ///
  /// In fr, this message translates to:
  /// **'Refusée'**
  String get rewardsRejected;

  /// No description provided for @planningWallTitle.
  ///
  /// In fr, this message translates to:
  /// **'Planning famille'**
  String get planningWallTitle;

  /// No description provided for @planningWallEmpty.
  ///
  /// In fr, this message translates to:
  /// **'Aucun planning généré pour le moment.'**
  String get planningWallEmpty;

  /// No description provided for @planningWallNoon.
  ///
  /// In fr, this message translates to:
  /// **'Midi'**
  String get planningWallNoon;

  /// No description provided for @planningWallEvening.
  ///
  /// In fr, this message translates to:
  /// **'Soir'**
  String get planningWallEvening;

  /// No description provided for @historyTitle.
  ///
  /// In fr, this message translates to:
  /// **'Mon historique'**
  String get historyTitle;

  /// No description provided for @historyLoadError.
  ///
  /// In fr, this message translates to:
  /// **'Impossible de charger : {error}'**
  String historyLoadError(Object error);

  /// No description provided for @historyEmptyTitle.
  ///
  /// In fr, this message translates to:
  /// **'Aucun accomplissement encore'**
  String get historyEmptyTitle;

  /// No description provided for @historyEmptyDescription.
  ///
  /// In fr, this message translates to:
  /// **'Tes tâches, badges et récompenses\napparaîtront ici.'**
  String get historyEmptyDescription;

  /// No description provided for @notificationsTitle.
  ///
  /// In fr, this message translates to:
  /// **'Notifications'**
  String get notificationsTitle;

  /// No description provided for @notificationsMarkAllRead.
  ///
  /// In fr, this message translates to:
  /// **'Tout lire'**
  String get notificationsMarkAllRead;

  /// No description provided for @notificationsEmpty.
  ///
  /// In fr, this message translates to:
  /// **'Aucune notification'**
  String get notificationsEmpty;

  /// No description provided for @badgesTitle.
  ///
  /// In fr, this message translates to:
  /// **'Mes badges'**
  String get badgesTitle;

  /// No description provided for @badgesEmpty.
  ///
  /// In fr, this message translates to:
  /// **'Accomplis des tâches pour gagner des badges !'**
  String get badgesEmpty;
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
