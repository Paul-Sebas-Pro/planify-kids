class Badge {
  final String id;
  final String name;
  final String icon;
  final String? description;
  final String conditionType;
  final int conditionValue;

  const Badge({
    required this.id,
    required this.name,
    required this.icon,
    this.description,
    required this.conditionType,
    required this.conditionValue,
  });

  factory Badge.fromJson(Map<String, dynamic> json) {
    return Badge(
      id: json['id'] as String,
      name: json['name'] as String,
      icon: json['icon'] as String,
      description: json['description'] as String?,
      conditionType: json['conditionType'] as String,
      conditionValue: json['conditionValue'] as int,
    );
  }
}

class MemberBadge {
  final String id;
  final DateTime earnedAt;
  final Badge badge;

  const MemberBadge({
    required this.id,
    required this.earnedAt,
    required this.badge,
  });

  factory MemberBadge.fromJson(Map<String, dynamic> json) {
    return MemberBadge(
      id: json['id'] as String,
      earnedAt: DateTime.parse(json['earnedAt'] as String),
      badge: Badge.fromJson(json['badge'] as Map<String, dynamic>),
    );
  }
}
