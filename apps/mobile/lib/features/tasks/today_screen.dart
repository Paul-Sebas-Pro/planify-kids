import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';

import '../../shared/widgets/api_error_widget.dart';
import 'task_card.dart';
import 'tasks_provider.dart';

class TodayScreen extends ConsumerWidget {
  const TodayScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final tasksAsync = ref.watch(tasksProvider);
    final today = DateFormat('EEEE d MMMM', 'fr_FR').format(DateTime.now());

    return Scaffold(
      appBar: AppBar(
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('Aujourd\'hui'),
            Text(
              today,
              style: Theme.of(context).textTheme.bodySmall,
            ),
          ],
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: () => ref.invalidate(tasksProvider),
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
            return const Center(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text('🎉', style: TextStyle(fontSize: 64)),
                  SizedBox(height: 8),
                  Text('Aucune tâche aujourd\'hui !'),
                ],
              ),
            );
          }

          final pending = items.where((i) => i.isPending).toList();
          final done = items.where((i) => i.isCompleted).toList();

          return ListView(
            children: [
              if (pending.isNotEmpty) ...[
                _SectionHeader(
                  label: 'À faire (${pending.length})',
                  icon: Icons.radio_button_unchecked,
                ),
                ...pending.map((item) => TaskCard(
                      item: item,
                      onComplete: () => ref
                          .read(tasksProvider.notifier)
                          .markCompleted(item.id),
                    )),
              ],
              if (done.isNotEmpty) ...[
                _SectionHeader(
                  label: 'Terminé (${done.length})',
                  icon: Icons.check_circle_outline,
                ),
                ...done.map((item) => TaskCard(item: item)),
              ],
              const SizedBox(height: 80),
            ],
          );
        },
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
            ),
          ),
        ],
      ),
    );
  }
}
