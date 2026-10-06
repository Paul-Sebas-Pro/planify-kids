import 'dart:async';

import 'package:flutter/widgets.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../models/badge.dart';
import '../../shared/providers/providers.dart';
import '../../shared/services/secure_storage.dart';
import '../../shared/widgets/celebration.dart';
import '../auth/auth_provider.dart';
import 'badges_provider.dart';

/// Badges à fêter parmi [badges], et mise à jour de la mémoire locale.
///
/// Mémoire = date `earnedAt` du dernier badge fêté (pas une liste d'ids).
/// Premier passage sur l'appareil : la date est fixée à [now], rien n'est
/// fêté — les badges déjà acquis ne rejouent jamais, même si la 1re sync
/// arrive plus tard (premier lancement hors ligne), alors que le premier
/// badge gagné après l'installation le sera.
Future<List<MemberBadge>> takeBadgesToCelebrate(
  SecureStorageService storage,
  String memberId,
  List<MemberBadge> badges, {
  required DateTime now,
}) async {
  final until = await storage.getBadgesCelebratedUntil(memberId);
  if (until == null) {
    await storage.saveBadgesCelebratedUntil(memberId, now);
    return [];
  }

  final fresh = badges.where((b) => b.earnedAt.isAfter(until)).toList()
    ..sort((a, b) => a.earnedAt.compareTo(b.earnedAt));
  if (fresh.isNotEmpty) {
    await storage.saveBadgesCelebratedUntil(memberId, fresh.last.earnedAt);
  }
  return fresh;
}

/// Écoute les badges du membre connecté (table locale PowerSync) et affiche
/// une célébration pour chaque nouveau badge, quel que soit l'onglet ouvert.
class BadgeCelebrationListener extends ConsumerStatefulWidget {
  final Widget child;

  const BadgeCelebrationListener({super.key, required this.child});

  @override
  ConsumerState<BadgeCelebrationListener> createState() =>
      _BadgeCelebrationListenerState();
}

class _BadgeCelebrationListenerState
    extends ConsumerState<BadgeCelebrationListener> {
  // Traitements sérialisés : deux émissions rapprochées ne doivent pas lire
  // la même date et fêter deux fois le même badge.
  Future<void> _processing = Future<void>.value();

  void _onBadges(List<MemberBadge> badges) {
    _processing = _processing
        .then((_) => _process(badges))
        .catchError((Object e) => debugPrint('BadgeCelebration: $e'));
  }

  Future<void> _process(List<MemberBadge> badges) async {
    final memberId = ref.read(authProvider).value?.id;
    if (memberId == null) return;

    final fresh = await takeBadgesToCelebrate(
      ref.read(secureStorageServiceProvider),
      memberId,
      badges,
      now: DateTime.now(),
    );
    for (final mb in fresh) {
      if (!mounted) return;
      // Pas d'await : la file des célébrations garantit l'enchaînement.
      unawaited(showBadgeCelebration(
        context,
        icon: mb.badge.icon,
        name: mb.badge.name,
        description: mb.badge.description,
      ));
    }
  }

  @override
  Widget build(BuildContext context) {
    ref.listen(memberBadgesProvider, (_, next) {
      if (next case AsyncData(:final value)) _onBadges(value);
    });
    return widget.child;
  }
}
