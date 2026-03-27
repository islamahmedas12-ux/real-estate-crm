import 'package:flutter/material.dart';

/// A centered [CircularProgressIndicator] — reusable loading state widget.
class LoadingIndicator extends StatelessWidget {
  const LoadingIndicator({super.key});

  @override
  Widget build(BuildContext context) {
    return const Center(child: CircularProgressIndicator());
  }
}
