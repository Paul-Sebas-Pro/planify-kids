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

  @override
  String get todayTitle => 'Aujourd\'hui';

  @override
  String get todayLogoutTooltip => 'Déconnexion';

  @override
  String get todayEmptyState => 'Aucune tâche aujourd\'hui !';

  @override
  String todayGreetingDone(Object name) {
    return 'Bravo $name ! 🎉';
  }

  @override
  String todayGreeting(Object name) {
    return 'Salut $name !';
  }

  @override
  String todayProgressSummary(
    Object completed,
    Object tacheS,
    Object termineeS,
    Object total,
  ) {
    return '$completed / $total tâche$tacheS terminée$termineeS';
  }

  @override
  String todaySectionPending(Object count) {
    return 'À faire ($count)';
  }

  @override
  String todaySectionDone(Object count) {
    return 'Terminé ($count)';
  }

  @override
  String todaySectionOther(Object count) {
    return 'Autres ($count)';
  }

  @override
  String get todayUndoTitle => 'Annuler cette tâche ?';

  @override
  String get todayUndoContent =>
      'La tâche repassera en \"À faire\" et les points gagnés seront retirés.';

  @override
  String get todayUndoCancel => 'Annuler';

  @override
  String get todayUndoConfirm => 'Confirmer';

  @override
  String get todaySlotNoon => 'Midi';

  @override
  String get todaySlotEvening => 'Soir';

  @override
  String get exchangesTitle => 'Échanges';

  @override
  String get exchangesPropose => 'Proposer';

  @override
  String get exchangesEmpty => 'Aucun échange en cours';

  @override
  String exchangesIncoming(Object count) {
    return 'Demandes reçues ($count)';
  }

  @override
  String exchangesOutgoing(Object count) {
    return 'Demandes envoyées ($count)';
  }

  @override
  String get exchangesHistory => 'Historique';

  @override
  String get exchangesStatusAccepted => 'Accepté';

  @override
  String get exchangesStatusRefused => 'Refusé';

  @override
  String get exchangesStatusPending => 'En attente';

  @override
  String get exchangesRefuse => 'Refuser';

  @override
  String get exchangesAccept => 'Accepter';

  @override
  String get exchangesDefaultTaskName => 'Tâche';

  @override
  String get exchangesProposeDialogTitle => 'Proposer un échange';

  @override
  String get exchangesLoadTasksError => 'Erreur de chargement des tâches';

  @override
  String get exchangesNoTaskToday => 'Aucune tâche à échanger aujourd\'hui.';

  @override
  String get exchangesMyTaskLabel => 'Ma tâche';

  @override
  String get exchangesLoadMembersError => 'Erreur de chargement des membres';

  @override
  String get exchangesNoSiblings => 'Aucun autre enfant dans la famille.';

  @override
  String get exchangesExchangeWithLabel => 'Échanger avec';

  @override
  String get exchangesCancel => 'Annuler';

  @override
  String get exchangesSubmitError => 'Impossible de proposer cet échange.';

  @override
  String get taskCardDone => 'Fait ✓';

  @override
  String get taskCardSkipped => 'Passée';

  @override
  String get taskCardLate => 'En retard';

  @override
  String get taskCardDoneButton => 'Fait !';

  @override
  String get apiErrorSessionExpiredTitle => 'Session expirée';

  @override
  String get apiErrorSessionExpiredHint => 'Reconnecte-toi pour continuer.';

  @override
  String get apiErrorReconnect => 'Se reconnecter';

  @override
  String get apiErrorNetwork => 'Serveur inaccessible. Vérifie ta connexion.';

  @override
  String get apiErrorGeneric => 'Une erreur est survenue.';

  @override
  String get apiErrorRetry => 'Réessayer';

  @override
  String get rewardsTitle => 'Récompenses';

  @override
  String get rewardsEmpty => 'Aucune récompense disponible pour l\'instant.';

  @override
  String get rewardsAvailable => 'Disponibles';

  @override
  String get rewardsMyRequests => 'Mes demandes';

  @override
  String get rewardsPending => 'En attente';

  @override
  String get rewardsClaim => 'Demander';

  @override
  String get rewardsApproved => 'Approuvée ✓';

  @override
  String get rewardsRejected => 'Refusée';

  @override
  String get planningWallTitle => 'Planning famille';

  @override
  String get planningWallEmpty => 'Aucun planning généré pour le moment.';

  @override
  String get planningWallNoon => 'Midi';

  @override
  String get planningWallEvening => 'Soir';
}
