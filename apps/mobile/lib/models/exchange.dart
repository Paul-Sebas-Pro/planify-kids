class Exchange {
  final String id;
  final String scheduleItemId;
  final String fromMemberId;
  final String toMemberId;
  final String status;
  final DateTime createdAt;
  final ScheduleItemInfo? scheduleItem;

  const Exchange({
    required this.id,
    required this.scheduleItemId,
    required this.fromMemberId,
    required this.toMemberId,
    required this.status,
    required this.createdAt,
    this.scheduleItem,
  });

  bool get isPending => status == 'PENDING';

  factory Exchange.fromJson(Map<String, dynamic> json) {
    return Exchange(
      id: json['id'] as String,
      scheduleItemId: json['scheduleItemId'] as String,
      fromMemberId: json['fromMemberId'] as String,
      toMemberId: json['toMemberId'] as String,
      status: json['status'] as String,
      createdAt: DateTime.parse(json['createdAt'] as String),
      scheduleItem: json['scheduleItem'] != null
          ? ScheduleItemInfo.fromJson(
              json['scheduleItem'] as Map<String, dynamic>)
          : null,
    );
  }

  factory Exchange.fromLocalRow(dynamic row) {
    return Exchange(
      id: row['id'] as String,
      scheduleItemId: row['schedule_item_id'] as String,
      fromMemberId: row['from_member_id'] as String,
      toMemberId: row['to_member_id'] as String,
      status: row['status'] as String,
      createdAt: row['created_at'] != null
          ? DateTime.parse(row['created_at'] as String)
          : DateTime.now(),
      scheduleItem: row['si_date'] != null
          ? ScheduleItemInfo.fromLocalRow(row)
          : null,
    );
  }
}

class ScheduleItemInfo {
  final DateTime date;
  final String assignedToMemberId;
  final String taskName;
  final String? taskIcon;
  final int taskPoints;

  const ScheduleItemInfo({
    required this.date,
    required this.assignedToMemberId,
    required this.taskName,
    this.taskIcon,
    required this.taskPoints,
  });

  factory ScheduleItemInfo.fromJson(Map<String, dynamic> json) {
    final task = json['task'] as Map<String, dynamic>? ?? {};
    return ScheduleItemInfo(
      date: DateTime.parse(json['date'] as String),
      assignedToMemberId: json['assignedToMemberId'] as String? ?? '',
      taskName: task['name'] as String? ?? '',
      taskIcon: task['icon'] as String?,
      taskPoints: (task['points'] as int?) ?? 0,
    );
  }

  factory ScheduleItemInfo.fromLocalRow(dynamic row) {
    return ScheduleItemInfo(
      date: DateTime.parse(row['si_date'] as String),
      assignedToMemberId: row['si_assigned_to_member_id'] as String? ?? '',
      taskName: row['si_task_name'] as String? ?? '',
      taskIcon: row['si_task_icon'] as String?,
      taskPoints: (row['si_task_points'] as int?) ?? 0,
    );
  }
}
