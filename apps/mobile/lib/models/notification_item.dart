class NotificationItem {
  final String id;
  final String memberId;
  final String familyId;
  final String type;
  final String message;
  final DateTime? readAt;
  final DateTime createdAt;

  const NotificationItem({
    required this.id,
    required this.memberId,
    required this.familyId,
    required this.type,
    required this.message,
    required this.readAt,
    required this.createdAt,
  });

  bool get isUnread => readAt == null;

  factory NotificationItem.fromJson(Map<String, dynamic> json) {
    return NotificationItem(
      id: json['id'] as String,
      memberId: json['memberId'] as String,
      familyId: json['familyId'] as String,
      type: json['type'] as String,
      message: json['message'] as String,
      readAt: json['readAt'] != null
          ? DateTime.parse(json['readAt'] as String)
          : null,
      createdAt: DateTime.parse(json['createdAt'] as String),
    );
  }
}
