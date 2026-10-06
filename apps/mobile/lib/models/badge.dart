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

  factory Badge.fromLocalRow(dynamic row) {
    return Badge(
      id: row['badge_id'] as String,
      name: row['badge_name'] as String,
      icon: row['badge_icon'] as String,
      description: row['badge_description'] as String?,
      conditionType: row['badge_condition_type'] as String,
      conditionValue: row['badge_condition_value'] as int,
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

  factory MemberBadge.fromLocalRow(dynamic row) {
    return MemberBadge(
      id: row['id'] as String,
      earnedAt: parseUtcTimestamp(row['earned_at'] as String),
      badge: Badge.fromLocalRow(row),
    );
  }
}

/// Lit un `timestamp` Postgres synchronisé par PowerSync.
///
/// Prisma stocke les `DateTime` en `timestamp` **sans fuseau** (valeurs UTC),
/// que PowerSync transmet au format `YYYY-MM-DD hh:mm:ss.sss` sans `Z`.
/// `DateTime.parse` le lirait comme heure locale (décalage de 1-2 h en
/// France) : on force l'UTC quand aucun fuseau n'est indiqué.
DateTime parseUtcTimestamp(String raw) {
  final hasZone = RegExp(r'(Z|[+-]\d{2}:?\d{2})$').hasMatch(raw);
  return DateTime.parse(hasZone ? raw : '${raw.replaceFirst(' ', 'T')}Z');
}
