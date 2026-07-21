// ignore: unused_import
import 'package:intl/intl.dart' as intl;
import 'app_localizations.dart';

// ignore_for_file: type=lint

/// The translations for French (`fr`).
class AppLocalizationsFr extends AppLocalizations {
  AppLocalizationsFr([String locale = 'fr']) : super(locale);

  @override
  String get shellNavToday => 'Aujourd\'hui';

  @override
  String get shellNavRewards => 'Récompenses';

  @override
  String get shellNavExchanges => 'Échanges';

  @override
  String get shellNavBadges => 'Badges';

  @override
  String get shellNavProfile => 'Profil';

  @override
  String get loginTitle => 'Planify Kids 🌟';

  @override
  String get loginTabParent => 'Parent';

  @override
  String get loginTabChild => 'Enfant';

  @override
  String get loginFieldRequired => 'Champ requis';

  @override
  String get loginEmailLabel => 'Email';

  @override
  String get loginPasswordLabel => 'Mot de passe';

  @override
  String get loginSubmit => 'Se connecter';

  @override
  String get loginNetworkError =>
      'Serveur inaccessible. Vérifie que l\'API est démarrée.';

  @override
  String get loginInvalidCredentials => 'Email ou mot de passe incorrect.';

  @override
  String get loginFamilyCodeLabel => 'Code famille';

  @override
  String get loginPinLabel => 'PIN (4 chiffres)';

  @override
  String get loginCodeRequired => 'Code de 6 caractères requis';

  @override
  String get loginInvalidFamilyCode => 'Code famille invalide';

  @override
  String get loginNetworkErrorGeneric => 'Erreur réseau';

  @override
  String get loginPinIncorrect => 'PIN incorrect.';

  @override
  String get profileTitle => 'Mon profil';

  @override
  String get profileLogoutTooltip => 'Déconnexion';

  @override
  String profilePoints(Object count) {
    return '$count points';
  }

  @override
  String get profileHistoryTitle => 'Mon historique';

  @override
  String get profileHistorySubtitle => 'Tâches, badges, récompenses';

  @override
  String get profilePlanningTitle => 'Planning famille';

  @override
  String get profilePlanningSubtitle => 'Toutes les tâches de la semaine';

  @override
  String get profileNotificationsTitle => 'Notifications';

  @override
  String profileNotificationsUnread(Object count, Object plural) {
    return '$count non lue$plural';
  }

  @override
  String get profileNotificationsAllRead => 'Tout est lu';

  @override
  String get profileRankingTitle => 'Classement famille';

  @override
  String profileLoadError(Object error) {
    return 'Impossible de charger : $error';
  }

  @override
  String get profileLanguageTitle => 'Langue';

  @override
  String get profileLanguageFr => 'Français';

  @override
  String get profileLanguageEn => 'English';
}
