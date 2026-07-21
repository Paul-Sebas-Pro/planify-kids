import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../models/schedule_item.dart';
import '../../shared/l10n/l10n_extensions.dart';

class TaskCard extends StatelessWidget {
  final ScheduleItem item;
  final VoidCallback? onComplete;
  final VoidCallback? onUndo;

  const TaskCard({
    super.key,
    required this.item,
    this.onComplete,
    this.onUndo,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    final (bgColor, borderColor, iconBg, pointsColor, trailing) =
        switch (item.status) {
      'COMPLETED' => (
          const Color(0xFFF0FBF0),
          const Color(0xFFB8E6B8),
          const Color(0xFF4CAF50),
          const Color(0xFF4CAF50),
          onUndo != null
              ? _StatusChip(
                  label: context.l10n.taskCardDone,
                  color: const Color(0xFF4CAF50),
                  onTap: onUndo,
                )
              : _StatusChip(
                  label: context.l10n.taskCardDone,
                  color: const Color(0xFF4CAF50)),
        ),
      'SKIPPED' => (
          const Color(0xFFFFF8F0),
          const Color(0xFFFFDDB3),
          const Color(0xFFFF9800),
          Colors.grey.shade400,
          _StatusChip(
              label: context.l10n.taskCardSkipped,
              color: const Color(0xFFFF9800)),
        ),
      'LATE' => (
          const Color(0xFFFFF0F0),
          const Color(0xFFFFCCCC),
          const Color(0xFFF44336),
          Colors.grey.shade400,
          _StatusChip(
              label: context.l10n.taskCardLate,
              color: const Color(0xFFF44336)),
        ),
      _ => (
          Colors.white,
          Colors.grey.shade100,
          const Color(0xFF4CAF50),
          const Color(0xFFFF9800),
          onComplete != null
              ? _DoneButton(onPressed: onComplete!)
              : const SizedBox.shrink() as Widget,
        ),
    };

    final slotColor = item.isNoon
        ? const Color(0xFFFFA726)
        : const Color(0xFF5C6BC0);

    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 5),
      decoration: BoxDecoration(
        color: bgColor,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: borderColor),
      ),
      // Border ne supporte pas un borderRadius avec des BorderSide non
      // uniformes (Flutter le rejette au paint) — la bande d'accent créneau
      // est donc un enfant clippé plutôt qu'un côté de bordure.
      child: ClipRRect(
        borderRadius: BorderRadius.circular(19),
        child: IntrinsicHeight(
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Container(width: 4, color: slotColor),
              Expanded(
                child: Padding(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 12,
                    vertical: 10,
                  ),
                  child: Row(
                    children: [
                      Container(
                        width: 52,
                        height: 52,
                        decoration: BoxDecoration(
                          color: iconBg.withValues(alpha: 0.15),
                          borderRadius: BorderRadius.circular(14),
                        ),
                        child: Center(
                          child: Text(
                            item.taskIcon ?? '✅',
                            style: const TextStyle(fontSize: 26),
                          ),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              item.taskName,
                              style: theme.textTheme.titleSmall?.copyWith(
                                fontWeight: FontWeight.w600,
                                decoration:
                                    item.isCompleted || item.isSkipped
                                        ? TextDecoration.lineThrough
                                        : null,
                                color: item.isPending
                                    ? const Color(0xFF1A1A2E)
                                    : Colors.grey.shade500,
                              ),
                            ),
                            const SizedBox(height: 2),
                            Text(
                              '+${item.taskPoints} pts',
                              style: GoogleFonts.baloo2(
                                fontSize: 13,
                                fontWeight: FontWeight.bold,
                                color: item.isPending
                                    ? pointsColor
                                    : Colors.grey.shade400,
                              ),
                            ),
                          ],
                        ),
                      ),
                      trailing,
                    ],
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _StatusChip extends StatelessWidget {
  final String label;
  final Color color;
  final VoidCallback? onTap;
  const _StatusChip({required this.label, required this.color, this.onTap});

  @override
  Widget build(BuildContext context) {
    final chip = Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Text(
            label,
            style: TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.w600,
              color: color,
            ),
          ),
          if (onTap != null) ...[
            const SizedBox(width: 4),
            Icon(Icons.undo, size: 14, color: color),
          ],
        ],
      ),
    );
    if (onTap == null) return chip;
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(12),
      child: chip,
    );
  }
}

class _DoneButton extends StatelessWidget {
  final VoidCallback onPressed;
  const _DoneButton({required this.onPressed});

  @override
  Widget build(BuildContext context) {
    return FilledButton(
      onPressed: onPressed,
      style: FilledButton.styleFrom(
        minimumSize: const Size(72, 36),
        padding: const EdgeInsets.symmetric(horizontal: 14),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        backgroundColor: const Color(0xFF4CAF50),
      ),
      child: Text(context.l10n.taskCardDoneButton, style: const TextStyle(fontSize: 13)),
    );
  }
}
