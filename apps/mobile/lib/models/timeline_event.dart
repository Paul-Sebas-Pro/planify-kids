class TimelineEvent {
  final String type;
  final String date;
  final String title;
  final String? description;
  final int? points;
  final String? icon;

  const TimelineEvent({
    required this.type,
    required this.date,
    required this.title,
    this.description,
    this.points,
    this.icon,
  });

  factory TimelineEvent.fromJson(Map<String, dynamic> json) => TimelineEvent(
        type: json['type'] as String,
        date: json['date'] as String,
        title: json['title'] as String,
        description: json['description'] as String?,
        points: json['points'] as int?,
        icon: json['icon'] as String?,
      );

  String get typeLabel => switch (type) {
        'TASK_COMPLETED' => 'Tâche terminée',
        'BADGE_EARNED' => 'Badge obtenu',
        'REWARD_CLAIMED' => 'Récompense',
        _ => type,
      };

  String get typeIcon => switch (type) {
        'TASK_COMPLETED' => '✅',
        'BADGE_EARNED' => '🏅',
        'REWARD_CLAIMED' => '🎁',
        _ => '📌',
      };

  bool get isPositivePoints => points != null && points! > 0;
}
