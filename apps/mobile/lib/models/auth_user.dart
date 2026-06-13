class AuthUser {
  final String id;
  final String name;
  final String role;
  final String familyId;
  final String? color;
  final String? avatar;
  final int points;

  const AuthUser({
    required this.id,
    required this.name,
    required this.role,
    required this.familyId,
    this.color,
    this.avatar,
    this.points = 0,
  });

  bool get isChild => role == 'CHILD';
  bool get isParent => role == 'PARENT';

  factory AuthUser.fromJson(Map<String, dynamic> json) {
    final member = json['member'] as Map<String, dynamic>? ?? json;
    return AuthUser(
      id: member['id'] as String,
      name: member['name'] as String,
      role: member['role'] as String,
      familyId: member['familyId'] as String,
      color: member['color'] as String?,
      avatar: member['avatar'] as String?,
      points: (member['points'] as int?) ?? 0,
    );
  }
}
