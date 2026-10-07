import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';

import '../../models/family_member.dart';
import '../../models/schedule_item.dart';
import '../../shared/l10n/l10n_extensions.dart';
import '../../shared/providers/locale_provider.dart';
import '../../shared/providers/my_points_provider.dart';
import '../../shared/providers/providers.dart';
import '../../shared/widgets/api_error_widget.dart';
import '../../shared/widgets/celebration.dart';
import '../auth/auth_provider.dart';
import '../exchanges/exchanges_provider.dart';
import 'exchange_drop_tray.dart';
import 'task_card.dart';
import 'tasks_provider.dart';

class TodayScreen extends ConsumerStatefulWidget {
  const TodayScreen({super.key});

  @override
  ConsumerState<TodayScreen> createState() => _TodayScreenState();
}

class _TodayScreenState extends ConsumerState<TodayScreen> {
  /// Dernière tâche cochée depuis cet écran — sa carte "Terminé" rebondit.
  String? _justCompletedId;

  /// Tâche en cours de glisser (échange par drag & drop) : affiche le bandeau
  /// des frères et sœurs.
  ScheduleItem? _dragging;

  /// Échanges proposés depuis cet écran, en attendant que la sync les ramène
  /// dans la table locale `exchanges`.
  final Set<String> _proposedItemIds = {};

  /// Astuce « appui long » : masquée tant que le stockage n'est pas lu (pas
  /// de clignotement), puis jusqu'au premier échange glissé-déposé.
  bool _hintSeen = true;

  @override
  void initState() {
    super.initState();
    ref
        .read(secureStorageServiceProvider)
        .getExchangeDragHintSeen()
        .then((seen) {
      if (mounted) setState(() => _hintSeen = seen);
    }).catchError((Object _) {});
  }

  Future<void> _proposeExchange(ScheduleItem item, FamilyMember to) async {
    setState(() => _dragging = null);
    final user = ref.read(authProvider).value;
    if (user == null) return;

    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Text(context.l10n.exchangeConfirmTitle),
        content: Text(
          context.l10n.exchangeConfirmBody(to.name, item.taskName),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(false),
            child: Text(context.l10n.exchangesCancel),
          ),
          FilledButton(
            onPressed: () => Navigator.of(ctx).pop(true),
            child: Text(context.l10n.exchangesPropose),
          ),
        ],
      ),
    );
    if (confirmed != true || !mounted) return;

    final messenger = ScaffoldMessenger.of(context);
    final l10n = context.l10n;
    try {
      await ref.read(exchangesProvider.notifier).propose(
            scheduleItemId: item.id,
            fromMemberId: user.id,
            toMemberId: to.id,
          );
      if (!mounted) return;
      setState(() {
        _proposedItemIds.add(item.id);
        _hintSeen = true;
      });
      ref
          .read(secureStorageServiceProvider)
          .saveExchangeDragHintSeen()
          .catchError((Object _) {});
      messenger.showSnackBar(
        SnackBar(content: Text(l10n.exchangeProposedSnack(to.name))),
      );
    } catch (e) {
      // Pas de réponse du serveur = pas de réseau (l'échange passe par l'API,
      // il n'est pas mis en file hors ligne).
      final offline = e is DioException && e.response == null;
      messenger.showSnackBar(SnackBar(
        content: Text(
          offline ? l10n.exchangeOffline : l10n.exchangesSubmitError,
        ),
      ));
    }
  }

  Future<void> _complete(ScheduleItem item, {required bool isLast}) async {
    setState(() => _justCompletedId = item.id);
    await ref.read(tasksProvider.notifier).markCompleted(item.id);
    if (!isLast || !mounted) return;
    // Laisse la gerbe "+N pts" se jouer avant la grande célébration.
    await Future<void>.delayed(const Duration(milliseconds: 700));
    if (!mounted) return;
    final name = ref.read(authProvider).value?.name ?? '';
    await showAllDoneCelebration(context, name: name);
  }

  @override
  Widget build(BuildContext context) {
    final tasksAsync = ref.watch(tasksProvider);
    final user = ref.watch(authProvider).value;
    final points = ref.watch(myPointsProvider).value ?? user?.points ?? 0;
    final siblings = (ref.watch(familyMembersProvider).value ??
            const <FamilyMember>[])
        .where((m) => m.role == 'CHILD' && m.id != user?.id)
        .toList();
    final exchangePendingIds = {
      ...?ref
          .watch(exchangesProvider)
          .value
          ?.where((e) => e.isPending)
          .map((e) => e.scheduleItemId),
      ..._proposedItemIds,
    };
    final locale = ref.watch(appLocaleProvider);
    final today = DateFormat('EEEE d MMMM', dateLocaleFor(locale))
        .format(DateTime.now());

    return Scaffold(
      appBar: AppBar(
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(context.l10n.todayTitle),
            Text(
              today,
              style: Theme.of(context).textTheme.bodySmall?.copyWith(
                    color: Colors.grey.shade500,
                  ),
            ),
          ],
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: () => ref.invalidate(tasksProvider),
          ),
          IconButton(
            icon: const Icon(Icons.logout),
            tooltip: context.l10n.todayLogoutTooltip,
            onPressed: () => ref.read(authProvider.notifier).logout(),
          ),
        ],
      ),
      body: tasksAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => ApiErrorWidget(
          error: e,
          onRetry: () => ref.invalidate(tasksProvider),
        ),
        data: (items) {
          if (items.isEmpty) {
            return Center(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const Text('🎉', style: TextStyle(fontSize: 64)),
                  const SizedBox(height: 12),
                  Text(context.l10n.todayEmptyState),
                ],
              ),
            );
          }

          final pending = items.where((i) => i.isPending).toList();
          final done = items.where((i) => i.isCompleted).toList();
          final other = items
              .where((i) => !i.isPending && !i.isCompleted)
              .toList();

          final list = ListView(
            children: [
              _ProgressBanner(
                name: user?.name ?? '',
                points: points,
                total: items.length,
                completed: done.length,
              ),
              if (pending.isNotEmpty) ...[
                _SectionHeader(
                  label: context.l10n.todaySectionPending(pending.length),
                  icon: Icons.radio_button_unchecked,
                ),
                if (!_hintSeen && siblings.isNotEmpty) const _ExchangeHint(),
                _SlotGroup(
                  items: pending,
                  cardBuilder: (item) {
                    final inExchange = exchangePendingIds.contains(item.id);
                    final card = TaskCard(
                      item: item,
                      exchangePending: inExchange,
                      onComplete: () =>
                          _complete(item, isLast: pending.length == 1),
                    );
                    // Seules les tâches « À faire » sans échange en cours
                    // se glissent vers un frère ou une sœur.
                    if (inExchange || siblings.isEmpty) return card;
                    return _DraggableTask(
                      item: item,
                      card: card,
                      onDragStarted: () => setState(() => _dragging = item),
                      onDragEnded: () {
                        if (mounted) setState(() => _dragging = null);
                      },
                    );
                  },
                ),
              ],
              if (done.isNotEmpty) ...[
                _SectionHeader(
                  label: context.l10n.todaySectionDone(done.length),
                  icon: Icons.check_circle_outline,
                ),
                _SlotGroup(
                  items: done,
                  cardBuilder: (item) => TaskCard(
                    item: item,
                    celebrate: item.id == _justCompletedId,
                    onUndo: () => _confirmUndo(context, ref, item.id),
                  ),
                ),
              ],
              if (other.isNotEmpty) ...[
                _SectionHeader(
                  label: context.l10n.todaySectionOther(other.length),
                  icon: Icons.info_outline,
                ),
                _SlotGroup(
                  items: other,
                  cardBuilder: (item) => TaskCard(item: item),
                ),
              ],
              const SizedBox(height: 80),
            ],
          );

          final reduceMotion =
              MediaQuery.maybeDisableAnimationsOf(context) ?? false;
          return Stack(
            children: [
              list,
              Align(
                alignment: Alignment.bottomCenter,
                child: IgnorePointer(
                  ignoring: _dragging == null,
                  child: AnimatedSlide(
                    offset: _dragging == null
                        ? const Offset(0, 1.2)
                        : Offset.zero,
                    duration: reduceMotion
                        ? Duration.zero
                        : const Duration(milliseconds: 200),
                    curve: Curves.easeOut,
                    child: ExchangeDropTray(
                      siblings: siblings,
                      onDrop: _proposeExchange,
                    ),
                  ),
                ),
              ),
            ],
          );
        },
      ),
    );
  }
}

/// Carte « À faire » saisissable par appui long (un simple glisser
/// entrerait en conflit avec le défilement et le bouton « Fait ! »).
class _DraggableTask extends StatelessWidget {
  final ScheduleItem item;
  final Widget card;
  final VoidCallback onDragStarted;
  final VoidCallback onDragEnded;

  const _DraggableTask({
    required this.item,
    required this.card,
    required this.onDragStarted,
    required this.onDragEnded,
  });

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (context, constraints) => LongPressDraggable<ScheduleItem>(
        data: item,
        hapticFeedbackOnStart: true,
        onDragStarted: onDragStarted,
        onDragEnd: (_) => onDragEnded(),
        feedback: SizedBox(
          width: constraints.maxWidth,
          child: Material(
            color: Colors.transparent,
            child: Transform.rotate(angle: -0.03, child: card),
          ),
        ),
        childWhenDragging: Opacity(opacity: 0.3, child: card),
        child: card,
      ),
    );
  }
}

class _ExchangeHint extends StatelessWidget {
  const _ExchangeHint();

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 0, 16, 4),
      child: Row(
        children: [
          const Icon(Icons.swap_horiz, size: 16, color: Color(0xFFF9A825)),
          const SizedBox(width: 6),
          Expanded(
            child: Text(
              context.l10n.todayExchangeHint,
              style: TextStyle(fontSize: 12, color: Colors.grey.shade600),
            ),
          ),
        ],
      ),
    );
  }
}

Future<void> _confirmUndo(
  BuildContext context,
  WidgetRef ref,
  String itemId,
) async {
  final confirmed = await showDialog<bool>(
    context: context,
    builder: (ctx) => AlertDialog(
      title: Text(context.l10n.todayUndoTitle),
      content: Text(context.l10n.todayUndoContent),
      actions: [
        TextButton(
          onPressed: () => Navigator.of(ctx).pop(false),
          child: Text(context.l10n.todayUndoCancel),
        ),
        FilledButton(
          onPressed: () => Navigator.of(ctx).pop(true),
          child: Text(context.l10n.todayUndoConfirm),
        ),
      ],
    ),
  );
  if (confirmed == true) {
    await ref.read(tasksProvider.notifier).markPending(itemId);
  }
}

class _ProgressBanner extends StatelessWidget {
  final String name;
  final int points;
  final int total;
  final int completed;

  const _ProgressBanner({
    required this.name,
    required this.points,
    required this.total,
    required this.completed,
  });

  @override
  Widget build(BuildContext context) {
    final progress = total == 0 ? 0.0 : completed / total;
    final isAllDone = completed == total;

    return Container(
      margin: const EdgeInsets.fromLTRB(16, 16, 16, 8),
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: isAllDone
              ? [const Color(0xFF4CAF50), const Color(0xFF66BB6A)]
              : [const Color(0xFF2196F3), const Color(0xFF42A5F5)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(20),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                isAllDone
                    ? context.l10n.todayGreetingDone(name)
                    : context.l10n.todayGreeting(name),
                style: GoogleFonts.fredoka(
                  fontSize: 20,
                  fontWeight: FontWeight.w600,
                  color: Colors.white,
                ),
              ),
              Row(
                children: [
                  const Text('⭐', style: TextStyle(fontSize: 18)),
                  const SizedBox(width: 4),
                  Text(
                    '$points pts',
                    style: GoogleFonts.baloo2(
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                      color: Colors.white,
                    ),
                  ),
                ],
              ),
            ],
          ),
          const SizedBox(height: 12),
          ClipRRect(
            borderRadius: BorderRadius.circular(8),
            child: LinearProgressIndicator(
              value: progress,
              minHeight: 8,
              backgroundColor: Colors.white.withValues(alpha: 0.3),
              valueColor: const AlwaysStoppedAnimation(Colors.white),
            ),
          ),
          const SizedBox(height: 6),
          Text(
            context.l10n.todayProgressSummary(
              completed,
              total,
              total > 1 ? 's' : '',
              completed > 1 ? 's' : '',
            ),
            style: const TextStyle(
              fontSize: 12,
              color: Colors.white70,
              fontWeight: FontWeight.w500,
            ),
          ),
        ],
      ),
    );
  }
}

class _SlotGroup extends StatelessWidget {
  final List<ScheduleItem> items;
  final Widget Function(ScheduleItem item) cardBuilder;

  const _SlotGroup({required this.items, required this.cardBuilder});

  @override
  Widget build(BuildContext context) {
    final noon = items.where((i) => i.isNoon).toList();
    final evening = items.where((i) => !i.isNoon).toList();

    return Column(
      children: [
        if (noon.isNotEmpty) ...[
          _SlotSubHeader(
            label: context.l10n.todaySlotNoon,
            icon: Icons.wb_sunny_outlined,
            color: const Color(0xFFFFA726),
          ),
          ...noon.map(cardBuilder),
        ],
        if (evening.isNotEmpty) ...[
          _SlotSubHeader(
            label: context.l10n.todaySlotEvening,
            icon: Icons.nights_stay_outlined,
            color: const Color(0xFF5C6BC0),
          ),
          ...evening.map(cardBuilder),
        ],
      ],
    );
  }
}

class _SlotSubHeader extends StatelessWidget {
  final String label;
  final IconData icon;
  final Color color;

  const _SlotSubHeader({
    required this.label,
    required this.icon,
    required this.color,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 14, 16, 6),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
        decoration: BoxDecoration(
          color: color.withValues(alpha: 0.12),
          borderRadius: BorderRadius.circular(12),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon, size: 20, color: color),
            const SizedBox(width: 6),
            Text(
              label,
              style: TextStyle(
                fontSize: 15,
                fontWeight: FontWeight.w700,
                color: color,
                letterSpacing: 0.2,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _SectionHeader extends StatelessWidget {
  final String label;
  final IconData icon;

  const _SectionHeader({required this.label, required this.icon});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 4),
      child: Row(
        children: [
          Icon(icon, size: 16, color: theme.colorScheme.onSurfaceVariant),
          const SizedBox(width: 6),
          Text(
            label,
            style: theme.textTheme.labelMedium?.copyWith(
              color: theme.colorScheme.onSurfaceVariant,
              fontWeight: FontWeight.w600,
            ),
          ),
        ],
      ),
    );
  }
}
