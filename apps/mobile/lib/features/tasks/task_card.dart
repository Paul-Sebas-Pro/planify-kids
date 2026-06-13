import 'package:flutter/material.dart';

import '../../models/schedule_item.dart';

class TaskCard extends StatelessWidget {
  final ScheduleItem item;
  final VoidCallback? onComplete;

  const TaskCard({super.key, required this.item, this.onComplete});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final completed = item.isCompleted;

    return Card(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
      child: ListTile(
        leading: Container(
          width: 48,
          height: 48,
          decoration: BoxDecoration(
            color: completed
                ? theme.colorScheme.primaryContainer
                : theme.colorScheme.surfaceContainerHighest,
            borderRadius: BorderRadius.circular(12),
          ),
          child: Center(
            child: Text(
              item.taskIcon ?? '✅',
              style: const TextStyle(fontSize: 24),
            ),
          ),
        ),
        title: Text(
          item.taskName,
          style: theme.textTheme.titleSmall?.copyWith(
            decoration: completed ? TextDecoration.lineThrough : null,
            color: completed ? theme.colorScheme.onSurfaceVariant : null,
          ),
        ),
        subtitle: Text(
          '${item.taskPoints} pts',
          style: theme.textTheme.bodySmall?.copyWith(
            color: completed
                ? theme.colorScheme.onSurfaceVariant
                : theme.colorScheme.primary,
            fontWeight: FontWeight.bold,
          ),
        ),
        trailing: completed
            ? Icon(Icons.check_circle, color: theme.colorScheme.primary)
            : FilledButton.tonal(
                onPressed: onComplete,
                child: const Text('Fait !'),
              ),
      ),
    );
  }
}
