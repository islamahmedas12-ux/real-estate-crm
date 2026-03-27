import 'package:flutter/material.dart';
import 'package:intl/intl.dart';

import '../models/lead.dart';

class ActivityTimeline extends StatelessWidget {
  final List<LeadActivity> activities;

  const ActivityTimeline({super.key, required this.activities});

  @override
  Widget build(BuildContext context) {
    if (activities.isEmpty) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(32),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(Icons.timeline, size: 48, color: Colors.grey.shade400),
              const SizedBox(height: 12),
              Text(
                'No activities yet',
                style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                      color: Colors.grey,
                    ),
              ),
            ],
          ),
        ),
      );
    }

    return ListView.builder(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      padding: EdgeInsets.zero,
      itemCount: activities.length,
      itemBuilder: (context, index) {
        final activity = activities[index];
        final isLast = index == activities.length - 1;
        return _ActivityTile(activity: activity, isLast: isLast);
      },
    );
  }
}

class _ActivityTile extends StatelessWidget {
  final LeadActivity activity;
  final bool isLast;

  const _ActivityTile({required this.activity, required this.isLast});

  Color get _typeColor {
    switch (activity.type) {
      case LeadActivityType.call:
        return Colors.green;
      case LeadActivityType.email:
        return Colors.blue;
      case LeadActivityType.meeting:
        return Colors.purple;
      case LeadActivityType.note:
        return Colors.grey;
      case LeadActivityType.viewing:
        return Colors.orange;
      case LeadActivityType.followUp:
        return Colors.teal;
      case LeadActivityType.statusChange:
        return Colors.indigo;
    }
  }

  IconData get _typeIcon {
    switch (activity.type) {
      case LeadActivityType.call:
        return Icons.phone;
      case LeadActivityType.email:
        return Icons.email;
      case LeadActivityType.meeting:
        return Icons.groups;
      case LeadActivityType.note:
        return Icons.note;
      case LeadActivityType.viewing:
        return Icons.visibility;
      case LeadActivityType.followUp:
        return Icons.follow_the_signs;
      case LeadActivityType.statusChange:
        return Icons.swap_horiz;
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final dateStr = DateFormat('MMM d, y  h:mm a').format(activity.createdAt);

    return IntrinsicHeight(
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Timeline column
          SizedBox(
            width: 40,
            child: Column(
              children: [
                Container(
                  width: 32,
                  height: 32,
                  decoration: BoxDecoration(
                    color: _typeColor.withValues(alpha: 0.15),
                    shape: BoxShape.circle,
                  ),
                  child: Icon(_typeIcon, size: 16, color: _typeColor),
                ),
                if (!isLast)
                  Expanded(
                    child: Container(
                      width: 2,
                      color: Colors.grey.shade300,
                    ),
                  ),
              ],
            ),
          ),
          const SizedBox(width: 8),
          // Content
          Expanded(
            child: Padding(
              padding: const EdgeInsets.only(bottom: 16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 6,
                          vertical: 1,
                        ),
                        decoration: BoxDecoration(
                          color: _typeColor.withValues(alpha: 0.1),
                          borderRadius: BorderRadius.circular(4),
                        ),
                        child: Text(
                          activity.type.label,
                          style: TextStyle(
                            color: _typeColor,
                            fontSize: 11,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Text(
                          dateStr,
                          style: theme.textTheme.bodySmall?.copyWith(
                            color: theme.colorScheme.onSurfaceVariant,
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 4),
                  Text(
                    activity.description,
                    style: theme.textTheme.bodyMedium,
                  ),
                  if (activity.performedByUser != null) ...[
                    const SizedBox(height: 2),
                    Text(
                      'by ${activity.performedByUser!.name}',
                      style: theme.textTheme.bodySmall?.copyWith(
                        color: theme.colorScheme.onSurfaceVariant,
                        fontStyle: FontStyle.italic,
                      ),
                    ),
                  ],
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}
