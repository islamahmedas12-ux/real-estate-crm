class DashboardStats {
  final int myLeads;
  final int myClients;
  final int myProperties;
  final int pendingFollowUps;

  const DashboardStats({
    required this.myLeads,
    required this.myClients,
    required this.myProperties,
    required this.pendingFollowUps,
  });

  factory DashboardStats.fromJson(Map<String, dynamic> json) {
    return DashboardStats(
      myLeads: json['myLeads'] as int? ?? 0,
      myClients: json['myClients'] as int? ?? 0,
      myProperties: json['myProperties'] as int? ?? 0,
      pendingFollowUps: json['pendingFollowUps'] as int? ?? 0,
    );
  }
}

class FollowUp {
  final String id;
  final String clientName;
  final String? propertyTitle;
  final String leadStatus;
  final DateTime scheduledAt;
  final String? notes;

  const FollowUp({
    required this.id,
    required this.clientName,
    this.propertyTitle,
    required this.leadStatus,
    required this.scheduledAt,
    this.notes,
  });

  factory FollowUp.fromJson(Map<String, dynamic> json) {
    return FollowUp(
      id: json['id'] as String,
      clientName: json['clientName'] as String,
      propertyTitle: json['propertyTitle'] as String?,
      leadStatus: json['leadStatus'] as String,
      scheduledAt: DateTime.parse(json['scheduledAt'] as String),
      notes: json['notes'] as String?,
    );
  }
}

class RecentActivity {
  final String id;
  final String type;
  final String description;
  final String entityType;
  final DateTime createdAt;

  const RecentActivity({
    required this.id,
    required this.type,
    required this.description,
    required this.entityType,
    required this.createdAt,
  });

  factory RecentActivity.fromJson(Map<String, dynamic> json) {
    return RecentActivity(
      id: json['id'] as String,
      type: json['type'] as String,
      description: json['description'] as String,
      entityType: json['entityType'] as String,
      createdAt: DateTime.parse(json['createdAt'] as String),
    );
  }
}
