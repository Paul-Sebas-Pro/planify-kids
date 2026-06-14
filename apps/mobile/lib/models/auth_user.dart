import 'dart:convert';

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

  // Parses the `data` field from POST /auth/login or /auth/register response.
  // data = { tokens: { accessToken, refreshToken }, user: { id, email },
  //          family: { id, name }, member: { id, name, role } }
  factory AuthUser.fromLoginData(Map<String, dynamic> data) {
    final member = data['member'] as Map<String, dynamic>;
    final family = data['family'] as Map<String, dynamic>;
    return AuthUser(
      id: member['id'] as String,
      name: member['name'] as String,
      role: member['role'] as String,
      familyId: family['id'] as String,
      color: member['color'] as String?,
      avatar: member['avatar'] as String?,
      points: (member['points'] as int?) ?? 0,
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'name': name,
        'role': role,
        'familyId': familyId,
        if (color != null) 'color': color,
        if (avatar != null) 'avatar': avatar,
        'points': points,
      };

  factory AuthUser.fromStorageJson(Map<String, dynamic> json) {
    return AuthUser(
      id: json['id'] as String,
      name: json['name'] as String,
      role: json['role'] as String,
      familyId: json['familyId'] as String,
      color: json['color'] as String?,
      avatar: json['avatar'] as String?,
      points: (json['points'] as int?) ?? 0,
    );
  }

  static AuthUser fromStorageString(String jsonStr) {
    return AuthUser.fromStorageJson(
      jsonDecode(jsonStr) as Map<String, dynamic>,
    );
  }
}
