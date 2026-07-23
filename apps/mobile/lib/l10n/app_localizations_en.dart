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

  @override
  String get todayTitle => 'Today';

  @override
  String get todayLogoutTooltip => 'Log out';

  @override
  String get todayEmptyState => 'No tasks today!';

  @override
  String todayGreetingDone(Object name) {
    return 'Well done $name! 🎉';
  }

  @override
  String todayGreeting(Object name) {
    return 'Hi $name!';
  }

  @override
  String todayProgressSummary(
    Object completed,
    Object tacheS,
    Object termineeS,
    Object total,
  ) {
    return '$completed / $total task$tacheS completed';
  }

  @override
  String todaySectionPending(Object count) {
    return 'To do ($count)';
  }

  @override
  String todaySectionDone(Object count) {
    return 'Done ($count)';
  }

  @override
  String todaySectionOther(Object count) {
    return 'Other ($count)';
  }

  @override
  String get todayUndoTitle => 'Cancel this task?';

  @override
  String get todayUndoContent =>
      'The task will go back to \"To do\" and earned points will be removed.';

  @override
  String get todayUndoCancel => 'Cancel';

  @override
  String get todayUndoConfirm => 'Confirm';

  @override
  String get todaySlotNoon => 'Noon';

  @override
  String get todaySlotEvening => 'Evening';

  @override
  String get exchangesTitle => 'Swaps';

  @override
  String get exchangesPropose => 'Propose';

  @override
  String get exchangesEmpty => 'No swaps in progress';

  @override
  String exchangesIncoming(Object count) {
    return 'Requests received ($count)';
  }

  @override
  String exchangesOutgoing(Object count) {
    return 'Requests sent ($count)';
  }

  @override
  String get exchangesHistory => 'History';

  @override
  String get exchangesStatusAccepted => 'Accepted';

  @override
  String get exchangesStatusRefused => 'Declined';

  @override
  String get exchangesStatusPending => 'Pending';

  @override
  String get exchangesRefuse => 'Decline';

  @override
  String get exchangesAccept => 'Accept';

  @override
  String get exchangesDefaultTaskName => 'Task';

  @override
  String get exchangesProposeDialogTitle => 'Propose a swap';

  @override
  String get exchangesLoadTasksError => 'Error loading tasks';

  @override
  String get exchangesNoTaskToday => 'No task to swap today.';

  @override
  String get exchangesMyTaskLabel => 'My task';

  @override
  String get exchangesLoadMembersError => 'Error loading members';

  @override
  String get exchangesNoSiblings => 'No other child in the family.';

  @override
  String get exchangesExchangeWithLabel => 'Swap with';

  @override
  String get exchangesCancel => 'Cancel';

  @override
  String get exchangesSubmitError => 'Unable to propose this swap.';

  @override
  String get taskCardDone => 'Done ✓';

  @override
  String get taskCardSkipped => 'Skipped';

  @override
  String get taskCardLate => 'Late';

  @override
  String get taskCardDoneButton => 'Done!';

  @override
  String get apiErrorSessionExpiredTitle => 'Session expired';

  @override
  String get apiErrorSessionExpiredHint => 'Sign in again to continue.';

  @override
  String get apiErrorReconnect => 'Sign in again';

  @override
  String get apiErrorNetwork => 'Server unreachable. Check your connection.';

  @override
  String get apiErrorGeneric => 'An error occurred.';

  @override
  String get apiErrorRetry => 'Retry';

  @override
  String get rewardsTitle => 'Rewards';

  @override
  String get rewardsEmpty => 'No rewards available yet.';

  @override
  String get rewardsAvailable => 'Available';

  @override
  String get rewardsMyRequests => 'My requests';

  @override
  String get rewardsPending => 'Pending';

  @override
  String get rewardsClaim => 'Claim';

  @override
  String get rewardsApproved => 'Approved ✓';

  @override
  String get rewardsRejected => 'Rejected';

  @override
  String get planningWallTitle => 'Family schedule';

  @override
  String get planningWallEmpty => 'No schedule generated yet.';

  @override
  String get planningWallNoon => 'Noon';

  @override
  String get planningWallEvening => 'Evening';

  @override
  String get planningWallFilterAllMembers => 'All members';

  @override
  String get planningWallFilterAllStatus => 'All statuses';

  @override
  String get planningWallStatusPending => 'To do';

  @override
  String get planningWallStatusCompleted => 'Done';

  @override
  String get planningWallStatusSkipped => 'Skipped';

  @override
  String get historyTitle => 'My history';

  @override
  String historyLoadError(Object error) {
    return 'Unable to load: $error';
  }

  @override
  String get historyEmptyTitle => 'No achievements yet';

  @override
  String get historyEmptyDescription =>
      'Your tasks, badges and rewards\nwill appear here.';

  @override
  String get notificationsTitle => 'Notifications';

  @override
  String get notificationsMarkAllRead => 'Mark all read';

  @override
  String get notificationsEmpty => 'No notifications';

  @override
  String get badgesTitle => 'My badges';

  @override
  String get badgesEmpty => 'Complete tasks to earn badges!';
}
