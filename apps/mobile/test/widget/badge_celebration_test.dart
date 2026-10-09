import 'dart:async';

import 'package:flutter/material.dart' hide Badge;
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mobile/features/auth/auth_provider.dart';
import 'package:mobile/features/badges/badge_celebration.dart';
import 'package:mobile/features/badges/badges_provider.dart';
import 'package:mobile/models/auth_user.dart';
import 'package:mobile/models/badge.dart';
import 'package:mobile/shared/utils/utc_timestamp.dart';
import 'package:mobile/shared/providers/providers.dart';
import 'package:mobile/shared/services/secure_storage.dart';

// Fakes -----------------------------------------------------------------------

class _FakeStorage extends SecureStorageService {
  final _until = <String, DateTime>{};

  @override
  Future<DateTime?> getBadgesCelebratedUntil(String memberId) async =>
      _until[memberId];

  @override
  Future<void> saveBadgesCelebratedUntil(String memberId, DateTime at) async =>
      _until[memberId] = at;
}

class _FakeAuthNotifier extends AuthNotifier {
  @override
  Future<AuthUser?> build() async => AuthUser(
    id: 'alice-id',
    name: 'Alice',
    role: 'CHILD',
    familyId: 'fam-1',
    color: '#FF6584',
    points: 0,
  );
}

MemberBadge _badge(String id, String name, DateTime earnedAt) => MemberBadge(
  id: id,
  earnedAt: earnedAt,
  badge: Badge(
    id: 'badge-$id',
    name: name,
    icon: '🔥',
    description: 'Trois jours de suite',
    conditionType: 'STREAK',
    conditionValue: 3,
  ),
);

final _t0 = DateTime.utc(2026, 10, 6, 10);
final _old = _badge(
  'mb-1',
  'Première tâche',
  _t0.subtract(const Duration(days: 30)),
);
final _fresh = _badge('mb-2', 'En feu', _t0.add(const Duration(hours: 1)));

// Tests -----------------------------------------------------------------------

void main() {
  group('parseUtcTimestamp', () {
    test('timestamp PowerSync sans fuseau — lu en UTC', () {
      final d = parseUtcTimestamp('2026-10-06 10:00:00.000');
      expect(d.isUtc, isTrue);
      expect(d, DateTime.utc(2026, 10, 6, 10));
    });

    test('fuseau explicite respecté', () {
      expect(
        parseUtcTimestamp('2026-10-06 12:00:00+02:00'),
        DateTime.utc(2026, 10, 6, 10),
      );
      expect(
        parseUtcTimestamp('2026-10-06T10:00:00.000Z'),
        DateTime.utc(2026, 10, 6, 10),
      );
    });
  });

  group('takeBadgesToCelebrate', () {
    test('premier passage — rien fêté, mémoire initialisée à now', () async {
      final storage = _FakeStorage();
      final fresh = await takeBadgesToCelebrate(storage, 'alice-id', [
        _old,
      ], now: _t0);
      expect(fresh, isEmpty);
      expect(await storage.getBadgesCelebratedUntil('alice-id'), _t0);
    });

    test(
      'anciens badges arrivés après init (1re sync tardive) — ignorés',
      () async {
        final storage = _FakeStorage();
        await takeBadgesToCelebrate(storage, 'alice-id', [], now: _t0);
        final fresh = await takeBadgesToCelebrate(storage, 'alice-id', [
          _old,
        ], now: _t0);
        expect(fresh, isEmpty);
      },
    );

    test('nouveau badge — fêté une seule fois', () async {
      final storage = _FakeStorage();
      await takeBadgesToCelebrate(storage, 'alice-id', [_old], now: _t0);

      final first = await takeBadgesToCelebrate(storage, 'alice-id', [
        _old,
        _fresh,
      ], now: _t0);
      expect(first.map((b) => b.id), ['mb-2']);

      final again = await takeBadgesToCelebrate(storage, 'alice-id', [
        _old,
        _fresh,
      ], now: _t0);
      expect(again, isEmpty);
    });

    test('mémoire séparée par membre', () async {
      final storage = _FakeStorage();
      await takeBadgesToCelebrate(storage, 'alice-id', [], now: _t0);
      final tom = await takeBadgesToCelebrate(storage, 'tom-id', [
        _fresh,
      ], now: _t0);
      expect(tom, isEmpty);
    });
  });

  group('BadgeCelebrationListener', () {
    testWidgets('nouveau badge reçu par la sync — célébration affichée', (
      tester,
    ) async {
      final storage = _FakeStorage();
      await storage.saveBadgesCelebratedUntil('alice-id', _t0);
      final badges = StreamController<List<MemberBadge>>();
      addTearDown(badges.close);

      await tester.pumpWidget(
        ProviderScope(
          overrides: [
            authProvider.overrideWith(() => _FakeAuthNotifier()),
            secureStorageServiceProvider.overrideWithValue(storage),
            memberBadgesProvider.overrideWith((ref) => badges.stream),
          ],
          child: const MaterialApp(
            home: BadgeCelebrationListener(child: Scaffold()),
          ),
        ),
      );

      badges.add([_old]);
      await tester.pump(const Duration(milliseconds: 500));
      expect(find.text('Nouveau badge !'), findsNothing);

      badges.add([_old, _fresh]);
      await tester.pump();
      await tester.pump(const Duration(milliseconds: 500));
      expect(find.text('Nouveau badge !'), findsOneWidget);
      expect(find.text('En feu'), findsOneWidget);
      expect(find.text('Trois jours de suite'), findsOneWidget);

      // Fermeture automatique.
      await tester.pump(const Duration(seconds: 6));
      await tester.pump(const Duration(milliseconds: 500));
      expect(find.text('Nouveau badge !'), findsNothing);

      // Même liste réémise (autre changement synchronisé) — pas de rejeu.
      badges.add([_old, _fresh]);
      await tester.pump();
      await tester.pump(const Duration(milliseconds: 500));
      expect(find.text('Nouveau badge !'), findsNothing);
    });
  });
}
