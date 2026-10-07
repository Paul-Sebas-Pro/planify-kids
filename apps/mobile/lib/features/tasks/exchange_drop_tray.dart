import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../models/family_member.dart';
import '../../models/schedule_item.dart';
import '../../shared/l10n/l10n_extensions.dart';

/// Bandeau qui monte du bas pendant le glisser d'une tâche (cahier des
/// charges §4.4 : échange par drag & drop) : un avatar par frère/sœur, chacun
/// cible de dépôt.
class ExchangeDropTray extends StatelessWidget {
  final List<FamilyMember> siblings;
  final void Function(ScheduleItem item, FamilyMember member) onDrop;

  const ExchangeDropTray({
    super.key,
    required this.siblings,
    required this.onDrop,
  });

  @override
  Widget build(BuildContext context) {
    // Pas de SafeArea : l'écran est déjà au-dessus de la barre de navigation
    // (Scaffold du shell), la marge système est donc déjà retirée.
    return Material(
      elevation: 12,
      color: Colors.white,
      borderRadius: BorderRadius.circular(24),
      child: SizedBox(
        width: double.infinity,
        child: Padding(
          padding: const EdgeInsets.fromLTRB(16, 16, 16, 18),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(
                context.l10n.exchangeTrayTitle,
                style: GoogleFonts.fredoka(
                  fontSize: 18,
                  fontWeight: FontWeight.w600,
                  color: const Color(0xFF1A1A2E),
                ),
              ),
              const SizedBox(height: 14),
              Wrap(
                alignment: WrapAlignment.center,
                spacing: 28,
                runSpacing: 12,
                children: [
                  for (final m in siblings)
                    _SiblingTarget(member: m, onDrop: onDrop),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _SiblingTarget extends StatelessWidget {
  final FamilyMember member;
  final void Function(ScheduleItem item, FamilyMember member) onDrop;

  const _SiblingTarget({required this.member, required this.onDrop});

  Color get _color {
    final hex = member.color;
    final value =
        hex != null && hex.length == 7 ? int.tryParse(hex.substring(1), radix: 16) : null;
    return value != null ? Color(value + 0xFF000000) : const Color(0xFF9E9E9E);
  }

  @override
  Widget build(BuildContext context) {
    return DragTarget<ScheduleItem>(
      onWillAcceptWithDetails: (_) {
        HapticFeedback.selectionClick();
        return true;
      },
      onAcceptWithDetails: (details) => onDrop(details.data, member),
      builder: (context, candidates, _) {
        final hovering = candidates.isNotEmpty;
        return AnimatedScale(
          scale: hovering ? 1.25 : 1,
          duration: const Duration(milliseconds: 150),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              AnimatedContainer(
                duration: const Duration(milliseconds: 150),
                width: 64,
                height: 64,
                decoration: BoxDecoration(
                  color: _color,
                  shape: BoxShape.circle,
                  border: Border.all(
                    color: hovering ? const Color(0xFF1A1A2E) : Colors.white,
                    width: hovering ? 4 : 2,
                  ),
                  boxShadow: [
                    if (hovering)
                      BoxShadow(
                        color: _color.withValues(alpha: 0.5),
                        blurRadius: 16,
                      ),
                  ],
                ),
                child: Center(
                  child: Text(
                    member.avatar ??
                        (member.name.isEmpty ? '?' : member.name[0].toUpperCase()),
                    style: const TextStyle(
                      fontSize: 28,
                      color: Colors.white,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
              ),
              const SizedBox(height: 6),
              Text(
                member.name,
                style: const TextStyle(fontWeight: FontWeight.w600),
              ),
            ],
          ),
        );
      },
    );
  }
}
