import 'dart:math';

import 'package:confetti/confetti.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:google_fonts/google_fonts.dart';

import '../l10n/l10n_extensions.dart';

/// Retours de gamification côté enfant (cahier des charges §4.5 : "animation").
/// Tous respectent le réglage système "réduire les animations"
/// (`MediaQuery.disableAnimations`) : vibration et texte seuls, sans confettis.

const _confettiColors = [
  Color(0xFF4CAF50),
  Color(0xFF2196F3),
  Color(0xFFFFA726),
  Color(0xFFFF6584),
  Color(0xFFFFD54F),
];

bool _animationsDisabled(BuildContext context) =>
    MediaQuery.maybeDisableAnimationsOf(context) ?? false;

/// Petite gerbe de confettis + "+N pts" qui s'envole, centrés sur le widget
/// de [anchorContext] (le bouton "Fait !"). La position est figée au moment
/// de l'appel : la carte peut changer de section juste après sans décaler
/// l'effet.
void showTaskDoneBurst(BuildContext anchorContext, {required int points}) {
  HapticFeedback.mediumImpact();
  if (_animationsDisabled(anchorContext)) return;

  final overlay = Overlay.maybeOf(anchorContext);
  final anchorBox = anchorContext.findRenderObject() as RenderBox?;
  final overlayBox = overlay?.context.findRenderObject() as RenderBox?;
  if (overlay == null || anchorBox == null || overlayBox == null) return;

  final center = anchorBox.localToGlobal(
    anchorBox.size.center(Offset.zero),
    ancestor: overlayBox,
  );

  late final OverlayEntry entry;
  entry = OverlayEntry(
    builder: (_) => _TaskDoneBurst(
      center: center,
      points: points,
      onFinished: () => entry.remove(),
    ),
  );
  overlay.insert(entry);
}

class _TaskDoneBurst extends StatefulWidget {
  final Offset center;
  final int points;
  final VoidCallback onFinished;

  const _TaskDoneBurst({
    required this.center,
    required this.points,
    required this.onFinished,
  });

  @override
  State<_TaskDoneBurst> createState() => _TaskDoneBurstState();
}

class _TaskDoneBurstState extends State<_TaskDoneBurst>
    with SingleTickerProviderStateMixin {
  late final AnimationController _controller;
  late final ConfettiController _confetti;

  @override
  void initState() {
    super.initState();
    _confetti = ConfettiController(duration: const Duration(milliseconds: 200))
      ..play();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1400),
    )
      ..addStatusListener((status) {
        if (status == AnimationStatus.completed) widget.onFinished();
      })
      ..forward();
  }

  @override
  void dispose() {
    _controller.dispose();
    _confetti.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final rise = CurvedAnimation(parent: _controller, curve: Curves.easeOut);
    final fade = CurvedAnimation(
      parent: _controller,
      curve: const Interval(0.5, 1, curve: Curves.easeIn),
    );

    return IgnorePointer(
      child: Material(
        type: MaterialType.transparency,
        child: Stack(
          children: [
            Positioned(
              left: widget.center.dx,
              top: widget.center.dy,
              child: ConfettiWidget(
                confettiController: _confetti,
                blastDirectionality: BlastDirectionality.explosive,
                numberOfParticles: 14,
                emissionFrequency: 0.6,
                minBlastForce: 8,
                maxBlastForce: 22,
                gravity: 0.3,
                minimumSize: const Size(6, 4),
                maximumSize: const Size(12, 7),
                colors: _confettiColors,
              ),
            ),
            AnimatedBuilder(
              animation: _controller,
              builder: (context, child) => Positioned(
                left: widget.center.dx - 60,
                top: widget.center.dy - 24 - 70 * rise.value,
                width: 120,
                child: Opacity(opacity: 1 - fade.value, child: child),
              ),
              child: Text(
                '+${widget.points} pts',
                textAlign: TextAlign.center,
                style: GoogleFonts.baloo2(
                  fontSize: 26,
                  fontWeight: FontWeight.bold,
                  color: const Color(0xFFFF9800),
                  shadows: const [
                    Shadow(color: Colors.white, blurRadius: 6),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

/// Célébration plein écran quand la dernière tâche du jour est cochée.
/// Se ferme seule après ~3,5 s ou au tap.
Future<void> showAllDoneCelebration(
  BuildContext context, {
  required String name,
}) {
  HapticFeedback.heavyImpact();
  return showGeneralDialog<void>(
    context: context,
    barrierDismissible: true,
    barrierLabel: MaterialLocalizations.of(context).modalBarrierDismissLabel,
    barrierColor: Colors.black54,
    transitionDuration: const Duration(milliseconds: 350),
    transitionBuilder: (context, animation, _, child) => ScaleTransition(
      scale: CurvedAnimation(parent: animation, curve: Curves.easeOutBack),
      child: FadeTransition(opacity: animation, child: child),
    ),
    pageBuilder: (_, _, _) => _AllDoneCelebration(name: name),
  );
}

class _AllDoneCelebration extends StatefulWidget {
  final String name;

  const _AllDoneCelebration({required this.name});

  @override
  State<_AllDoneCelebration> createState() => _AllDoneCelebrationState();
}

class _AllDoneCelebrationState extends State<_AllDoneCelebration>
    with SingleTickerProviderStateMixin {
  late final ConfettiController _confetti;
  late final AnimationController _autoClose;

  @override
  void initState() {
    super.initState();
    _confetti = ConfettiController(duration: const Duration(seconds: 2));
    // Minuterie portée par un AnimationController plutôt qu'un Timer :
    // disposée avec le widget si l'enfant ferme avant la fin.
    _autoClose = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 3500),
    )
      ..addStatusListener((status) {
        if (status == AnimationStatus.completed) _close();
      })
      ..forward();
  }

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    if (!_animationsDisabled(context)) _confetti.play();
  }

  void _close() {
    if (!mounted) return;
    if (ModalRoute.of(context)?.isCurrent ?? false) {
      Navigator.of(context).pop();
    }
  }

  @override
  void dispose() {
    _autoClose.dispose();
    _confetti.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      behavior: HitTestBehavior.opaque,
      onTap: _close,
      child: Material(
        type: MaterialType.transparency,
        child: Stack(
          children: [
            Align(
              alignment: Alignment.topCenter,
              child: ConfettiWidget(
                confettiController: _confetti,
                blastDirection: pi / 2,
                blastDirectionality: BlastDirectionality.explosive,
                numberOfParticles: 25,
                emissionFrequency: 0.08,
                gravity: 0.25,
                colors: _confettiColors,
              ),
            ),
            Center(
              child: Container(
                margin: const EdgeInsets.symmetric(horizontal: 32),
                padding: const EdgeInsets.fromLTRB(32, 28, 32, 24),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(28),
                ),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const Text('🏆', style: TextStyle(fontSize: 80)),
                    const SizedBox(height: 12),
                    Text(
                      context.l10n.todayGreetingDone(widget.name),
                      textAlign: TextAlign.center,
                      style: GoogleFonts.fredoka(
                        fontSize: 30,
                        fontWeight: FontWeight.w600,
                        color: const Color(0xFF1A1A2E),
                      ),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      context.l10n.celebrationAllDoneSubtitle,
                      textAlign: TextAlign.center,
                      style: GoogleFonts.nunito(
                        fontSize: 18,
                        color: Colors.grey.shade700,
                      ),
                    ),
                    const SizedBox(height: 20),
                    Text(
                      context.l10n.celebrationTapToContinue,
                      style: TextStyle(
                        fontSize: 13,
                        color: Colors.grey.shade500,
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
