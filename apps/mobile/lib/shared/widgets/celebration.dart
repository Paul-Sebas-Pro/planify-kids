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

// File d'attente des célébrations plein écran : jamais deux fenêtres
// empilées (ex. badge "Première tâche" qui arrive par la sync pendant la
// célébration "journée terminée") — elles s'enchaînent.
Future<void> _queue = Future<void>.value();

Future<void> _enqueue(BuildContext context, Widget Function() content) {
  final next = _queue.then((_) {
    if (!context.mounted) return null;
    return _showCelebrationDialog(context, content());
  }).catchError((Object _) {});
  _queue = next;
  return next;
}

Future<void> _showCelebrationDialog(BuildContext context, Widget content) {
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
    pageBuilder: (_, _, _) => content,
  );
}

/// Célébration plein écran quand la dernière tâche du jour est cochée.
/// Se ferme seule après ~3,5 s ou au tap.
Future<void> showAllDoneCelebration(
  BuildContext context, {
  required String name,
}) {
  return _enqueue(context, () {
    HapticFeedback.heavyImpact();
    return _CelebrationCard(
      emoji: '🏆',
      title: context.l10n.todayGreetingDone(name),
      subtitle: context.l10n.celebrationAllDoneSubtitle,
      autoClose: const Duration(milliseconds: 3500),
    );
  });
}

/// Célébration d'un badge gagné (attribué côté serveur, reçu par la sync).
/// Reste un peu plus longtemps : l'enfant doit pouvoir lire le nom du badge.
Future<void> showBadgeCelebration(
  BuildContext context, {
  required String icon,
  required String name,
  String? description,
}) {
  return _enqueue(context, () {
    HapticFeedback.heavyImpact();
    return _CelebrationCard(
      headline: context.l10n.celebrationNewBadge,
      emoji: icon,
      title: name,
      subtitle: description,
      autoClose: const Duration(seconds: 5),
    );
  });
}

class _CelebrationCard extends StatefulWidget {
  final String? headline;
  final String emoji;
  final String title;
  final String? subtitle;
  final Duration autoClose;

  const _CelebrationCard({
    this.headline,
    required this.emoji,
    required this.title,
    this.subtitle,
    required this.autoClose,
  });

  @override
  State<_CelebrationCard> createState() => _CelebrationCardState();
}

class _CelebrationCardState extends State<_CelebrationCard>
    with SingleTickerProviderStateMixin {
  late final ConfettiController _confetti;
  late final AnimationController _autoClose;

  @override
  void initState() {
    super.initState();
    _confetti = ConfettiController(duration: const Duration(seconds: 2));
    // Minuterie portée par un AnimationController plutôt qu'un Timer :
    // disposée avec le widget si l'enfant ferme avant la fin.
    _autoClose = AnimationController(vsync: this, duration: widget.autoClose)
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
    final emoji = Text(widget.emoji, style: const TextStyle(fontSize: 80));

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
                    if (widget.headline != null) ...[
                      Text(
                        widget.headline!,
                        style: GoogleFonts.fredoka(
                          fontSize: 18,
                          fontWeight: FontWeight.w600,
                          color: const Color(0xFFFF9800),
                        ),
                      ),
                      const SizedBox(height: 8),
                    ],
                    if (_animationsDisabled(context))
                      emoji
                    else
                      TweenAnimationBuilder<double>(
                        tween: Tween(begin: 0.3, end: 1),
                        duration: const Duration(milliseconds: 900),
                        curve: Curves.elasticOut,
                        builder: (context, scale, child) =>
                            Transform.scale(scale: scale, child: child),
                        child: emoji,
                      ),
                    const SizedBox(height: 12),
                    Text(
                      widget.title,
                      textAlign: TextAlign.center,
                      style: GoogleFonts.fredoka(
                        fontSize: 30,
                        fontWeight: FontWeight.w600,
                        color: const Color(0xFF1A1A2E),
                      ),
                    ),
                    if (widget.subtitle != null) ...[
                      const SizedBox(height: 8),
                      Text(
                        widget.subtitle!,
                        textAlign: TextAlign.center,
                        style: GoogleFonts.nunito(
                          fontSize: 18,
                          color: Colors.grey.shade700,
                        ),
                      ),
                    ],
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
