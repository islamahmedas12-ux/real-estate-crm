import 'package:flutter/material.dart';

import '../models/lead.dart';

class LeadStatusBadge extends StatelessWidget {
  final LeadStatus status;
  final bool large;

  const LeadStatusBadge({
    super.key,
    required this.status,
    this.large = false,
  });

  Color get _color {
    switch (status) {
      case LeadStatus.newLead:
        return Colors.blue;
      case LeadStatus.contacted:
        return Colors.cyan;
      case LeadStatus.qualified:
        return Colors.teal;
      case LeadStatus.proposal:
        return Colors.orange;
      case LeadStatus.negotiation:
        return Colors.deepOrange;
      case LeadStatus.won:
        return Colors.green;
      case LeadStatus.lost:
        return Colors.red;
    }
  }

  IconData get _icon {
    switch (status) {
      case LeadStatus.newLead:
        return Icons.fiber_new;
      case LeadStatus.contacted:
        return Icons.phone_callback;
      case LeadStatus.qualified:
        return Icons.verified;
      case LeadStatus.proposal:
        return Icons.description;
      case LeadStatus.negotiation:
        return Icons.handshake;
      case LeadStatus.won:
        return Icons.emoji_events;
      case LeadStatus.lost:
        return Icons.cancel;
    }
  }

  @override
  Widget build(BuildContext context) {
    final fontSize = large ? 13.0 : 11.0;
    final hPad = large ? 12.0 : 8.0;
    final vPad = large ? 4.0 : 2.0;

    return Container(
      padding: EdgeInsets.symmetric(horizontal: hPad, vertical: vPad),
      decoration: BoxDecoration(
        color: _color.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(large ? 16 : 12),
        border: large
            ? Border.all(color: _color.withValues(alpha: 0.4))
            : null,
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          if (large) ...[
            Icon(_icon, size: 14, color: _color),
            const SizedBox(width: 4),
          ],
          Text(
            status.label,
            style: TextStyle(
              color: _color,
              fontSize: fontSize,
              fontWeight: FontWeight.w600,
            ),
          ),
        ],
      ),
    );
  }
}

class LeadPriorityBadge extends StatelessWidget {
  final LeadPriority priority;

  const LeadPriorityBadge({super.key, required this.priority});

  Color get _color {
    switch (priority) {
      case LeadPriority.low:
        return Colors.grey;
      case LeadPriority.medium:
        return Colors.blue;
      case LeadPriority.high:
        return Colors.orange;
      case LeadPriority.urgent:
        return Colors.red;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
      decoration: BoxDecoration(
        color: _color.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Text(
        priority.label,
        style: TextStyle(
          color: _color,
          fontSize: 11,
          fontWeight: FontWeight.w600,
        ),
      ),
    );
  }
}
