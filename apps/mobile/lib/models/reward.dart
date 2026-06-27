class Reward {
  final String id;
  final String name;
  final String icon;
  final int pointsCost;

  const Reward({
    required this.id,
    required this.name,
    required this.icon,
    required this.pointsCost,
  });

  factory Reward.fromJson(Map<String, dynamic> json) {
    return Reward(
      id: json['id'] as String,
      name: json['name'] as String,
      icon: json['icon'] as String,
      pointsCost: json['pointsCost'] as int,
    );
  }
}

class RewardClaim {
  final String id;
  final String status;
  final Reward reward;
  final DateTime createdAt;

  const RewardClaim({
    required this.id,
    required this.status,
    required this.reward,
    required this.createdAt,
  });

  bool get isPending => status == 'PENDING';
  bool get isApproved => status == 'APPROVED';
  bool get isRejected => status == 'REJECTED';

  factory RewardClaim.fromJson(Map<String, dynamic> json) {
    return RewardClaim(
      id: json['id'] as String,
      status: json['status'] as String,
      reward: Reward.fromJson(json['reward'] as Map<String, dynamic>),
      createdAt: DateTime.parse(json['createdAt'] as String),
    );
  }
}
