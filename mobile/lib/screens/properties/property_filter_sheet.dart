import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../models/property.dart';
import '../../providers/property_provider.dart';

class PropertyFilterSheet extends ConsumerStatefulWidget {
  const PropertyFilterSheet({super.key});

  @override
  ConsumerState<PropertyFilterSheet> createState() => _PropertyFilterSheetState();
}

class _PropertyFilterSheetState extends ConsumerState<PropertyFilterSheet> {
  late PropertyFilter _filter;
  final _minPriceController = TextEditingController();
  final _maxPriceController = TextEditingController();
  final _cityController = TextEditingController();

  @override
  void initState() {
    super.initState();
    _filter = ref.read(propertyFilterProvider);
    _minPriceController.text =
        _filter.minPrice != null ? _filter.minPrice!.toStringAsFixed(0) : '';
    _maxPriceController.text =
        _filter.maxPrice != null ? _filter.maxPrice!.toStringAsFixed(0) : '';
    _cityController.text = _filter.city ?? '';
  }

  @override
  void dispose() {
    _minPriceController.dispose();
    _maxPriceController.dispose();
    _cityController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return DraggableScrollableSheet(
      initialChildSize: 0.75,
      maxChildSize: 0.95,
      minChildSize: 0.5,
      expand: false,
      builder: (context, scrollController) {
        return Column(
          children: [
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 12, 8, 0),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text('Filters', style: theme.textTheme.titleLarge),
                  Row(
                    children: [
                      TextButton(
                        onPressed: _clearFilters,
                        child: const Text('Clear'),
                      ),
                      FilledButton(
                        onPressed: _applyFilters,
                        child: const Text('Apply'),
                      ),
                    ],
                  ),
                ],
              ),
            ),
            const Divider(),
            Expanded(
              child: ListView(
                controller: scrollController,
                padding: const EdgeInsets.all(16),
                children: [
                  // Property type
                  Text('Property Type', style: theme.textTheme.titleSmall),
                  const SizedBox(height: 8),
                  Wrap(
                    spacing: 8,
                    runSpacing: 8,
                    children: PropertyType.values.map((type) {
                      final selected = _filter.type == type;
                      return FilterChip(
                        label: Text(type.label),
                        selected: selected,
                        onSelected: (sel) {
                          setState(() {
                            _filter = _filter.copyWith(
                              type: () => sel ? type : null,
                            );
                          });
                        },
                      );
                    }).toList(),
                  ),

                  const SizedBox(height: 24),

                  // Status
                  Text('Status', style: theme.textTheme.titleSmall),
                  const SizedBox(height: 8),
                  Wrap(
                    spacing: 8,
                    runSpacing: 8,
                    children: PropertyStatus.values.map((status) {
                      final selected = _filter.status == status;
                      return FilterChip(
                        label: Text(status.label),
                        selected: selected,
                        onSelected: (sel) {
                          setState(() {
                            _filter = _filter.copyWith(
                              status: () => sel ? status : null,
                            );
                          });
                        },
                      );
                    }).toList(),
                  ),

                  const SizedBox(height: 24),

                  // City
                  Text('City', style: theme.textTheme.titleSmall),
                  const SizedBox(height: 8),
                  TextField(
                    controller: _cityController,
                    decoration: const InputDecoration(
                      hintText: 'e.g. Cairo',
                      prefixIcon: Icon(Icons.location_city),
                    ),
                  ),

                  const SizedBox(height: 24),

                  // Price range
                  Text('Price Range (EGP)', style: theme.textTheme.titleSmall),
                  const SizedBox(height: 8),
                  Row(
                    children: [
                      Expanded(
                        child: TextField(
                          controller: _minPriceController,
                          keyboardType: TextInputType.number,
                          decoration: const InputDecoration(hintText: 'Min'),
                        ),
                      ),
                      const Padding(
                        padding: EdgeInsets.symmetric(horizontal: 12),
                        child: Text('—'),
                      ),
                      Expanded(
                        child: TextField(
                          controller: _maxPriceController,
                          keyboardType: TextInputType.number,
                          decoration: const InputDecoration(hintText: 'Max'),
                        ),
                      ),
                    ],
                  ),

                  const SizedBox(height: 24),

                  // Bedrooms
                  Text('Bedrooms', style: theme.textTheme.titleSmall),
                  const SizedBox(height: 8),
                  Wrap(
                    spacing: 8,
                    children: [null, 1, 2, 3, 4, 5].map((beds) {
                      final selected = _filter.bedrooms == beds;
                      return ChoiceChip(
                        label: Text(beds == null ? 'Any' : '$beds+'),
                        selected: selected,
                        onSelected: (sel) {
                          setState(() {
                            _filter = _filter.copyWith(
                              bedrooms: () => sel ? beds : null,
                            );
                          });
                        },
                      );
                    }).toList(),
                  ),

                  const SizedBox(height: 24),

                  // Sort
                  Text('Sort By', style: theme.textTheme.titleSmall),
                  const SizedBox(height: 8),
                  Wrap(
                    spacing: 8,
                    children: [
                      ('createdAt', 'Newest'),
                      ('price', 'Price'),
                      ('area', 'Area'),
                    ].map((entry) {
                      final selected = _filter.sortBy == entry.$1;
                      return ChoiceChip(
                        label: Text(entry.$2),
                        selected: selected,
                        onSelected: (sel) {
                          setState(() {
                            _filter = _filter.copyWith(sortBy: entry.$1);
                          });
                        },
                      );
                    }).toList(),
                  ),
                  const SizedBox(height: 8),
                  SegmentedButton<String>(
                    segments: const [
                      ButtonSegment(value: 'desc', label: Text('Descending')),
                      ButtonSegment(value: 'asc', label: Text('Ascending')),
                    ],
                    selected: {_filter.sortOrder},
                    onSelectionChanged: (val) {
                      setState(() {
                        _filter = _filter.copyWith(sortOrder: val.first);
                      });
                    },
                  ),
                ],
              ),
            ),
          ],
        );
      },
    );
  }

  void _clearFilters() {
    _minPriceController.clear();
    _maxPriceController.clear();
    _cityController.clear();
    setState(() {
      _filter = const PropertyFilter();
    });
  }

  void _applyFilters() {
    final minPrice = double.tryParse(_minPriceController.text);
    final maxPrice = double.tryParse(_maxPriceController.text);
    final city = _cityController.text.trim();

    ref.read(propertyFilterProvider.notifier).state = _filter.copyWith(
      minPrice: () => minPrice,
      maxPrice: () => maxPrice,
      city: () => city.isNotEmpty ? city : null,
    );
    Navigator.of(context).pop();
  }
}
