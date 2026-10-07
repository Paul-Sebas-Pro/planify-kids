import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';

import '../../models/schedule_item.dart';
import '../../shared/l10n/l10n_extensions.dart';
import '../../shared/providers/locale_provider.dart';
import '../../shared/providers/my_points_provider.dart';
import '../../shared/widgets/api_error_widget.dart';
import '../../shared/widgets/celebration.dart';
import '../auth/auth_provider.dart';
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

          return ListView(
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
                _SlotGroup(
                  items: pending,
                  cardBuilder: (item) => TaskCard(
                    item: item,
                    onComplete: () =>
                        _complete(item, isLast: pending.length == 1),
                  ),
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
        },
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
