enum LeadStatus {
  newLead('NEW', 'New'),
  contacted('CONTACTED', 'Contacted'),
  qualified('QUALIFIED', 'Qualified'),
  proposal('PROPOSAL', 'Proposal'),
  negotiation('NEGOTIATION', 'Negotiation'),
  won('WON', 'Won'),
  lost('LOST', 'Lost');

  final String value;
  final String label;
  const LeadStatus(this.value, this.label);

  static LeadStatus fromValue(String value) {
    return LeadStatus.values.firstWhere(
      (e) => e.value == value,
      orElse: () => LeadStatus.newLead,
    );
  }
}

enum LeadPriority {
  low('LOW', 'Low'),
  medium('MEDIUM', 'Medium'),
  high('HIGH', 'High'),
  urgent('URGENT', 'Urgent');

  final String value;
  final String label;
  const LeadPriority(this.value, this.label);

  static LeadPriority fromValue(String value) {
    return LeadPriority.values.firstWhere(
      (e) => e.value == value,
      orElse: () => LeadPriority.medium,
    );
  }
}

enum LeadActivityType {
  call('CALL', 'Call'),
  email('EMAIL', 'Email'),
  meeting('MEETING', 'Meeting'),
  note('NOTE', 'Note'),
  viewing('VIEWING', 'Viewing'),
  followUp('FOLLOW_UP', 'Follow Up'),
  statusChange('STATUS_CHANGE', 'Status Change');

  final String value;
  final String label;
  const LeadActivityType(this.value, this.label);

  static LeadActivityType fromValue(String value) {
    return LeadActivityType.values.firstWhere(
      (e) => e.value == value,
      orElse: () => LeadActivityType.note,
    );
  }
}

class LeadClient {
  final String id;
  final String firstName;
  final String lastName;
  final String phone;
  final String? email;

  const LeadClient({
    required this.id,
    required this.firstName,
    required this.lastName,
    required this.phone,
    this.email,
  });

  String get fullName => '$firstName $lastName';

  factory LeadClient.fromJson(Map<String, dynamic> json) {
    return LeadClient(
      id: json['id'] as String,
      firstName: json['firstName'] as String,
      lastName: json['lastName'] as String,
      phone: json['phone'] as String,
      email: json['email'] as String?,
    );
  }
}

class LeadProperty {
  final String id;
  final String title;

  const LeadProperty({required this.id, required this.title});

  factory LeadProperty.fromJson(Map<String, dynamic> json) {
    return LeadProperty(
      id: json['id'] as String,
      title: json['title'] as String,
    );
  }
}

class LeadAgent {
  final String id;
  final String name;

  const LeadAgent({required this.id, required this.name});

  factory LeadAgent.fromJson(Map<String, dynamic> json) {
    return LeadAgent(
      id: json['id'] as String,
      name: json['name'] as String,
    );
  }
}

class Lead {
  final String id;
  final String clientId;
  final LeadClient? client;
  final String? propertyId;
  final LeadProperty? property;
  final LeadStatus status;
  final LeadPriority priority;
  final String? source;
  final double? budget;
  final String? notes;
  final String? assignedAgentId;
  final LeadAgent? assignedAgent;
  final DateTime? nextFollowUp;
  final DateTime createdAt;
  final DateTime updatedAt;

  const Lead({
    required this.id,
    required this.clientId,
    this.client,
    this.propertyId,
    this.property,
    required this.status,
    required this.priority,
    this.source,
    this.budget,
    this.notes,
    this.assignedAgentId,
    this.assignedAgent,
    this.nextFollowUp,
    required this.createdAt,
    required this.updatedAt,
  });

  String get clientName => client?.fullName ?? 'Unknown';

  String get budgetFormatted {
    if (budget == null) return 'N/A';
    final b = budget!;
    if (b >= 1000000) {
      return '${(b / 1000000).toStringAsFixed(b % 1000000 == 0 ? 0 : 1)}M EGP';
    }
    if (b >= 1000) {
      return '${(b / 1000).toStringAsFixed(b % 1000 == 0 ? 0 : 1)}K EGP';
    }
    return '${b.toStringAsFixed(0)} EGP';
  }

  factory Lead.fromJson(Map<String, dynamic> json) {
    return Lead(
      id: json['id'] as String,
      clientId: json['clientId'] as String,
      client: json['client'] != null
          ? LeadClient.fromJson(json['client'] as Map<String, dynamic>)
          : null,
      propertyId: json['propertyId'] as String?,
      property: json['property'] != null
          ? LeadProperty.fromJson(json['property'] as Map<String, dynamic>)
          : null,
      status: LeadStatus.fromValue(json['status'] as String),
      priority: LeadPriority.fromValue(json['priority'] as String),
      source: json['source'] as String?,
      budget: json['budget'] != null
          ? double.tryParse('${json['budget']}')
          : null,
      notes: json['notes'] as String?,
      assignedAgentId: json['assignedAgentId'] as String?,
      assignedAgent: json['assignedAgent'] != null
          ? LeadAgent.fromJson(json['assignedAgent'] as Map<String, dynamic>)
          : null,
      nextFollowUp: json['nextFollowUp'] != null
          ? DateTime.tryParse(json['nextFollowUp'] as String)
          : null,
      createdAt: DateTime.parse(json['createdAt'] as String),
      updatedAt: DateTime.parse(json['updatedAt'] as String),
    );
  }

  Map<String, dynamic> toCreateJson() {
    return {
      'clientId': clientId,
      if (propertyId != null) 'propertyId': propertyId,
      'status': status.value,
      'priority': priority.value,
      if (source != null) 'source': source,
      if (budget != null) 'budget': budget,
      if (notes != null) 'notes': notes,
      if (assignedAgentId != null) 'assignedAgentId': assignedAgentId,
      if (nextFollowUp != null) 'nextFollowUp': nextFollowUp!.toIso8601String(),
    };
  }
}

class LeadActivity {
  final String id;
  final String leadId;
  final LeadActivityType type;
  final String description;
  final String? performedBy;
  final LeadAgent? performedByUser;
  final DateTime createdAt;

  const LeadActivity({
    required this.id,
    required this.leadId,
    required this.type,
    required this.description,
    this.performedBy,
    this.performedByUser,
    required this.createdAt,
  });

  factory LeadActivity.fromJson(Map<String, dynamic> json) {
    return LeadActivity(
      id: json['id'] as String,
      leadId: json['leadId'] as String,
      type: LeadActivityType.fromValue(json['type'] as String),
      description: json['description'] as String,
      performedBy: json['performedBy'] as String?,
      performedByUser: json['performedByUser'] != null
          ? LeadAgent.fromJson(json['performedByUser'] as Map<String, dynamic>)
          : null,
      createdAt: DateTime.parse(json['createdAt'] as String),
    );
  }
}

class LeadListResponse {
  final List<Lead> data;
  final int total;
  final int page;
  final int pageSize;

  const LeadListResponse({
    required this.data,
    required this.total,
    required this.page,
    required this.pageSize,
  });

  int get totalPages => (total / pageSize).ceil();

  factory LeadListResponse.fromJson(Map<String, dynamic> json) {
    return LeadListResponse(
      data: (json['data'] as List)
          .map((item) => Lead.fromJson(item as Map<String, dynamic>))
          .toList(),
      total: json['total'] as int? ?? 0,
      page: json['page'] as int? ?? 1,
      pageSize: json['pageSize'] as int? ?? 20,
    );
  }
}
