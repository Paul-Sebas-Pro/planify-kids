// ignore: unused_import
import 'package:intl/intl.dart' as intl;
import 'app_localizations.dart';

// ignore_for_file: type=lint

/// The translations for English (`en`).
class AppLocalizationsEn extends AppLocalizations {
  AppLocalizationsEn([String locale = 'en']) : super(locale);

  @override
  String get shellNavToday => 'Today';

  @override
  String get shellNavRewards => 'Rewards';

  @override
  String get shellNavExchanges => 'Swaps';

  @override
  String get shellNavBadges => 'Badges';

  @override
  String get shellNavProfile => 'Profile';

  @override
  String get loginTitle => 'Planify Kids 🌟';

  @override
  String get loginTabParent => 'Parent';

  @override
  String get loginTabChild => 'Child';

  @override
  String get loginFieldRequired => 'Field required';

  @override
  String get loginEmailLabel => 'Email';

  @override
  String get loginPasswordLabel => 'Password';

  @override
  String get loginSubmit => 'Sign in';

  @override
  String get loginNetworkError =>
      'Server unreachable. Check that the API is running.';

  @override
  String get loginInvalidCredentials => 'Incorrect email or password.';

  @override
  String get loginFamilyCodeLabel => 'Family code';

  @override
  String get loginPinLabel => 'PIN (4 digits)';

  @override
  String get loginCodeRequired => '6-character code required';

  @override
  String get loginInvalidFamilyCode => 'Invalid family code';

  @override
  String get loginNetworkErrorGeneric => 'Network error';

  @override
  String get loginPinIncorrect => 'Incorrect PIN.';

  @override
  String get profileTitle => 'My profile';

  @override
  String get profileLogoutTooltip => 'Log out';

  @override
  String profilePoints(Object count) {
    return '$count points';
  }

  @override
  String get profileHistoryTitle => 'My history';

  @override
  String get profileHistorySubtitle => 'Tasks, badges, rewards';

  @override
  String get profilePlanningTitle => 'Family schedule';

  @override
  String get profilePlanningSubtitle => 'All tasks for the week';

  @override
  String get profileNotificationsTitle => 'Notifications';

  @override
  String profileNotificationsUnread(Object count, Object plural) {
    return '$count unread$plural';
  }

  @override
  String get profileNotificationsAllRead => 'All read';

  @override
  String get profileRankingTitle => 'Family ranking';

  @override
  String profileLoadError(Object error) {
    return 'Unable to load: $error';
  }

  @override
  String get profileLanguageTitle => 'Language';

  @override
  String get profileLanguageFr => 'Français';

  @override
  String get profileLanguageEn => 'English';
}
