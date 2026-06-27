class ScheduleItem {
  final String id;
  final String taskId;
  final String taskName;
  final String? taskIcon;
  final int taskPoints;
  final String assignedToMemberId;
  final DateTime date;
  final String status;

  const ScheduleItem({
    required this.id,
    required this.taskId,
    required this.taskName,
    this.taskIcon,
    required this.taskPoints,
    required this.assignedToMemberId,
    required this.date,
    required this.status,
  });

  bool get isPending => status == 'PENDING';
  bool get isCompleted => status == 'COMPLETED';
  bool get isSkipped => status == 'SKIPPED';
  bool get isLate => status == 'LATE';

  factory ScheduleItem.fromJson(Map<String, dynamic> json) {
    final task = json['task'] as Map<String, dynamic>? ?? {};
    return ScheduleItem(
      id: json['id'] as String,
      taskId: json['taskId'] as String? ?? task['id'] as String? ?? '',
      taskName: task['name'] as String? ?? '',
      taskIcon: task['icon'] as String?,
      taskPoints: (task['points'] as int?) ?? 0,
      assignedToMemberId: json['assignedToMemberId'] as String,
      date: DateTime.parse(json['date'] as String),
      status: json['status'] as String,
    );
  }

  ScheduleItem copyWith({String? status}) {
    return ScheduleItem(
      id: id,
      taskId: taskId,
      taskName: taskName,
      taskIcon: taskIcon,
      taskPoints: taskPoints,
      assignedToMemberId: assignedToMemberId,
      date: date,
      status: status ?? this.status,
    );
  }
}
