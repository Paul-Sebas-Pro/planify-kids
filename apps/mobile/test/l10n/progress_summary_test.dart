import 'package:flutter_test/flutter_test.dart';
import 'package:mobile/l10n/app_localizations_en.dart';
import 'package:mobile/l10n/app_localizations_fr.dart';

// Régression : gen-l10n trie les paramètres sans métadonnées par ordre
// alphabétique — l'appel positionnel produisait « 0 / tâche4 terminées ».
void main() {
  final fr = AppLocalizationsFr();
  final en = AppLocalizationsEn();

  test('FR — pluriel et ordre des nombres', () {
    expect(fr.todayProgressSummary(0, 4), '0 / 4 tâches terminées');
    expect(fr.todayProgressSummary(2, 4), '2 / 4 tâches terminées');
    expect(fr.todayProgressSummary(1, 1), '1 / 1 tâche terminée');
  });

  test('EN — pluriel et ordre des nombres', () {
    expect(en.todayProgressSummary(0, 4), '0 / 4 tasks completed');
    expect(en.todayProgressSummary(1, 1), '1 / 1 task completed');
  });

  test('notifications non lues — pluriel', () {
    expect(fr.profileNotificationsUnread(1), '1 non lue');
    expect(fr.profileNotificationsUnread(3), '3 non lues');
    expect(en.profileNotificationsUnread(3), '3 unread');
  });
}
