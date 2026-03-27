class PropertyImage {
  final String id;
  final String url;
  final String? caption;
  final bool isPrimary;
  final int order;

  const PropertyImage({
    required this.id,
    required this.url,
    this.caption,
    this.isPrimary = false,
    this.order = 0,
  });

  factory PropertyImage.fromJson(Map<String, dynamic> json) {
    return PropertyImage(
      id: json['id'] as String,
      url: json['url'] as String,
      caption: json['caption'] as String?,
      isPrimary: json['isPrimary'] as bool? ?? false,
      order: json['order'] as int? ?? 0,
    );
  }
}

enum PropertyType {
  apartment('APARTMENT', 'Apartment'),
  villa('VILLA', 'Villa'),
  office('OFFICE', 'Office'),
  shop('SHOP', 'Shop'),
  land('LAND', 'Land'),
  building('BUILDING', 'Building'),
  chalet('CHALET', 'Chalet'),
  studio('STUDIO', 'Studio'),
  duplex('DUPLEX', 'Duplex'),
  penthouse('PENTHOUSE', 'Penthouse');

  final String value;
  final String label;
  const PropertyType(this.value, this.label);

  static PropertyType? fromValue(String? value) {
    if (value == null) return null;
    return PropertyType.values.cast<PropertyType?>().firstWhere(
          (e) => e!.value == value,
          orElse: () => null,
        );
  }
}

enum PropertyStatus {
  available('AVAILABLE', 'Available'),
  reserved('RESERVED', 'Reserved'),
  sold('SOLD', 'Sold'),
  rented('RENTED', 'Rented'),
  offMarket('OFF_MARKET', 'Off Market');

  final String value;
  final String label;
  const PropertyStatus(this.value, this.label);

  static PropertyStatus? fromValue(String? value) {
    if (value == null) return null;
    return PropertyStatus.values.cast<PropertyStatus?>().firstWhere(
          (e) => e!.value == value,
          orElse: () => null,
        );
  }
}

class Property {
  final String id;
  final String title;
  final String? description;
  final PropertyType type;
  final PropertyStatus status;
  final double price;
  final double area;
  final int? bedrooms;
  final int? bathrooms;
  final int? floor;
  final String address;
  final String city;
  final String region;
  final double? latitude;
  final double? longitude;
  final List<String> features;
  final String? assignedAgentId;
  final List<PropertyImage> images;
  final DateTime createdAt;
  final DateTime updatedAt;

  const Property({
    required this.id,
    required this.title,
    this.description,
    required this.type,
    required this.status,
    required this.price,
    required this.area,
    this.bedrooms,
    this.bathrooms,
    this.floor,
    required this.address,
    required this.city,
    required this.region,
    this.latitude,
    this.longitude,
    this.features = const [],
    this.assignedAgentId,
    this.images = const [],
    required this.createdAt,
    required this.updatedAt,
  });

  PropertyImage? get primaryImage {
    if (images.isEmpty) return null;
    return images.firstWhere(
      (img) => img.isPrimary,
      orElse: () => images.first,
    );
  }

  String get locationText => '$region, $city';

  String get priceFormatted {
    if (price >= 1000000) {
      return '${(price / 1000000).toStringAsFixed(price % 1000000 == 0 ? 0 : 1)}M EGP';
    }
    if (price >= 1000) {
      return '${(price / 1000).toStringAsFixed(price % 1000 == 0 ? 0 : 1)}K EGP';
    }
    return '${price.toStringAsFixed(0)} EGP';
  }

  factory Property.fromJson(Map<String, dynamic> json) {
    final featuresRaw = json['features'];
    List<String> features = [];
    if (featuresRaw is List) {
      features = featuresRaw.cast<String>();
    }

    final imagesRaw = json['images'];
    List<PropertyImage> images = [];
    if (imagesRaw is List) {
      images = imagesRaw
          .map((img) => PropertyImage.fromJson(img as Map<String, dynamic>))
          .toList()
        ..sort((a, b) => a.order.compareTo(b.order));
    }

    return Property(
      id: json['id'] as String,
      title: json['title'] as String,
      description: json['description'] as String?,
      type: PropertyType.fromValue(json['type'] as String?) ?? PropertyType.apartment,
      status: PropertyStatus.fromValue(json['status'] as String?) ?? PropertyStatus.available,
      price: double.tryParse('${json['price']}') ?? 0,
      area: double.tryParse('${json['area']}') ?? 0,
      bedrooms: json['bedrooms'] as int?,
      bathrooms: json['bathrooms'] as int?,
      floor: json['floor'] as int?,
      address: json['address'] as String,
      city: json['city'] as String,
      region: json['region'] as String,
      latitude: double.tryParse('${json['latitude']}'),
      longitude: double.tryParse('${json['longitude']}'),
      features: features,
      assignedAgentId: json['assignedAgentId'] as String?,
      images: images,
      createdAt: DateTime.parse(json['createdAt'] as String),
      updatedAt: DateTime.parse(json['updatedAt'] as String),
    );
  }
}

class PropertyListResponse {
  final List<Property> data;
  final int total;
  final int page;
  final int limit;

  const PropertyListResponse({
    required this.data,
    required this.total,
    required this.page,
    required this.limit,
  });

  int get totalPages => (total / limit).ceil();

  factory PropertyListResponse.fromJson(Map<String, dynamic> json) {
    return PropertyListResponse(
      data: (json['data'] as List)
          .map((item) => Property.fromJson(item as Map<String, dynamic>))
          .toList(),
      total: json['total'] as int? ?? 0,
      page: json['page'] as int? ?? 1,
      limit: json['limit'] as int? ?? 20,
    );
  }
}

class PropertyStats {
  final int total;
  final int available;
  final int reserved;
  final int sold;
  final int rented;

  const PropertyStats({
    required this.total,
    required this.available,
    required this.reserved,
    required this.sold,
    required this.rented,
  });

  factory PropertyStats.fromJson(Map<String, dynamic> json) {
    return PropertyStats(
      total: json['total'] as int? ?? 0,
      available: json['available'] as int? ?? 0,
      reserved: json['reserved'] as int? ?? 0,
      sold: json['sold'] as int? ?? 0,
      rented: json['rented'] as int? ?? 0,
    );
  }
}
