class FamilyMember {
  final String id;
  final String name;
  final String role;
  final String familyId;
  final String? color;
  final String? avatar;
  final int points;

  const FamilyMember({
    required this.id,
    required this.name,
    required this.role,
    required this.familyId,
    this.color,
    this.avatar,
    this.points = 0,
  });

  factory FamilyMember.fromJson(Map<String, dynamic> json) {
    return FamilyMember(
      id: json['id'] as String,
      name: json['name'] as String,
      role: json['role'] as String,
      familyId: json['familyId'] as String,
      color: json['color'] as String?,
      avatar: json['avatar'] as String?,
      points: (json['points'] as int?) ?? 0,
    );
  }

  factory FamilyMember.fromLocalRow(dynamic row) {
    return FamilyMember(
      id: row['id'] as String,
      name: row['name'] as String,
      role: row['role'] as String,
      familyId: row['family_id'] as String,
      color: row['color'] as String?,
      avatar: row['avatar'] as String?,
      points: (row['points'] as int?) ?? 0,
    );
  }
}
