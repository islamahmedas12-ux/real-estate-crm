enum ClientType {
  buyer('BUYER', 'Buyer'),
  seller('SELLER', 'Seller'),
  tenant('TENANT', 'Tenant'),
  landlord('LANDLORD', 'Landlord'),
  investor('INVESTOR', 'Investor');

  final String value;
  final String label;
  const ClientType(this.value, this.label);

  static ClientType fromValue(String value) {
    return ClientType.values.firstWhere(
      (e) => e.value == value,
      orElse: () => ClientType.buyer,
    );
  }
}

enum ClientSource {
  referral('REFERRAL', 'Referral'),
  website('WEBSITE', 'Website'),
  socialMedia('SOCIAL_MEDIA', 'Social Media'),
  walkIn('WALK_IN', 'Walk-in'),
  phone('PHONE', 'Phone'),
  other('OTHER', 'Other');

  final String value;
  final String label;
  const ClientSource(this.value, this.label);

  static ClientSource fromValue(String value) {
    return ClientSource.values.firstWhere(
      (e) => e.value == value,
      orElse: () => ClientSource.other,
    );
  }
}

class ClientAgent {
  final String id;
  final String name;

  const ClientAgent({required this.id, required this.name});

  factory ClientAgent.fromJson(Map<String, dynamic> json) {
    return ClientAgent(
      id: json['id'] as String,
      name: json['name'] as String,
    );
  }
}

class Client {
  final String id;
  final String firstName;
  final String lastName;
  final String? email;
  final String phone;
  final String? nationalId;
  final ClientType type;
  final ClientSource source;
  final String? notes;
  final String? assignedAgentId;
  final ClientAgent? assignedAgent;
  final int leadsCount;
  final int contractsCount;
  final DateTime createdAt;
  final DateTime updatedAt;

  const Client({
    required this.id,
    required this.firstName,
    required this.lastName,
    this.email,
    required this.phone,
    this.nationalId,
    required this.type,
    required this.source,
    this.notes,
    this.assignedAgentId,
    this.assignedAgent,
    this.leadsCount = 0,
    this.contractsCount = 0,
    required this.createdAt,
    required this.updatedAt,
  });

  String get fullName => '$firstName $lastName';

  factory Client.fromJson(Map<String, dynamic> json) {
    final counts = json['_count'] as Map<String, dynamic>?;
    return Client(
      id: json['id'] as String,
      firstName: json['firstName'] as String,
      lastName: json['lastName'] as String,
      email: json['email'] as String?,
      phone: json['phone'] as String,
      nationalId: json['nationalId'] as String?,
      type: ClientType.fromValue(json['type'] as String),
      source: ClientSource.fromValue(json['source'] as String),
      notes: json['notes'] as String?,
      assignedAgentId: json['assignedAgentId'] as String?,
      assignedAgent: json['assignedAgent'] != null
          ? ClientAgent.fromJson(json['assignedAgent'] as Map<String, dynamic>)
          : null,
      leadsCount: counts?['leads'] as int? ?? 0,
      contractsCount: counts?['contracts'] as int? ?? 0,
      createdAt: DateTime.parse(json['createdAt'] as String),
      updatedAt: DateTime.parse(json['updatedAt'] as String),
    );
  }

  Map<String, dynamic> toCreateJson() {
    return {
      'firstName': firstName,
      'lastName': lastName,
      if (email != null && email!.isNotEmpty) 'email': email,
      'phone': phone,
      if (nationalId != null && nationalId!.isNotEmpty) 'nationalId': nationalId,
      'type': type.value,
      'source': source.value,
      if (notes != null && notes!.isNotEmpty) 'notes': notes,
    };
  }
}

class ClientLeadSummary {
  final String id;
  final String status;
  final String priority;
  final String? source;
  final DateTime createdAt;
  final String? propertyId;
  final String? propertyTitle;

  const ClientLeadSummary({
    required this.id,
    required this.status,
    required this.priority,
    this.source,
    required this.createdAt,
    this.propertyId,
    this.propertyTitle,
  });

  factory ClientLeadSummary.fromJson(Map<String, dynamic> json) {
    final property = json['property'] as Map<String, dynamic>?;
    return ClientLeadSummary(
      id: json['id'] as String,
      status: json['status'] as String,
      priority: json['priority'] as String,
      source: json['source'] as String?,
      createdAt: DateTime.parse(json['createdAt'] as String),
      propertyId: property?['id'] as String?,
      propertyTitle: property?['title'] as String?,
    );
  }
}

class ClientContractSummary {
  final String id;
  final String type;
  final String status;
  final double totalAmount;
  final DateTime createdAt;
  final String? propertyId;
  final String? propertyTitle;

  const ClientContractSummary({
    required this.id,
    required this.type,
    required this.status,
    required this.totalAmount,
    required this.createdAt,
    this.propertyId,
    this.propertyTitle,
  });

  factory ClientContractSummary.fromJson(Map<String, dynamic> json) {
    final property = json['property'] as Map<String, dynamic>?;
    return ClientContractSummary(
      id: json['id'] as String,
      type: json['type'] as String,
      status: json['status'] as String,
      totalAmount: double.tryParse('${json['totalAmount']}') ?? 0,
      createdAt: DateTime.parse(json['createdAt'] as String),
      propertyId: property?['id'] as String?,
      propertyTitle: property?['title'] as String?,
    );
  }
}

class ClientDetail {
  final Client client;
  final List<ClientLeadSummary> leads;
  final List<ClientContractSummary> contracts;

  const ClientDetail({
    required this.client,
    required this.leads,
    required this.contracts,
  });

  factory ClientDetail.fromJson(Map<String, dynamic> json) {
    final leadsRaw = json['leads'] as List? ?? [];
    final contractsRaw = json['contracts'] as List? ?? [];

    return ClientDetail(
      client: Client.fromJson(json),
      leads: leadsRaw
          .map((e) => ClientLeadSummary.fromJson(e as Map<String, dynamic>))
          .toList(),
      contracts: contractsRaw
          .map((e) => ClientContractSummary.fromJson(e as Map<String, dynamic>))
          .toList(),
    );
  }
}

class ClientListResponse {
  final List<Client> data;
  final int total;
  final int page;
  final int pageSize;

  const ClientListResponse({
    required this.data,
    required this.total,
    required this.page,
    required this.pageSize,
  });

  int get totalPages => (total / pageSize).ceil();

  factory ClientListResponse.fromJson(Map<String, dynamic> json) {
    return ClientListResponse(
      data: (json['data'] as List)
          .map((item) => Client.fromJson(item as Map<String, dynamic>))
          .toList(),
      total: json['total'] as int? ?? 0,
      page: json['page'] as int? ?? 1,
      pageSize: json['pageSize'] as int? ?? 20,
    );
  }
}
