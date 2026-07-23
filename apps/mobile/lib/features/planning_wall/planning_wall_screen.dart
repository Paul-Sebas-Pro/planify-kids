import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';

import '../../models/family_member.dart';
import '../../models/schedule_item.dart';
import '../../shared/l10n/l10n_extensions.dart';
import '../../shared/providers/locale_provider.dart';
import '../../shared/widgets/api_error_widget.dart';
import 'planning_wall_provider.dart';

const _noonColor = Color(0xFFFFA726);
const _eveningColor = Color(0xFF5C6BC0);

String _dayKey(DateTime d) =>
    '${d.year}-${d.month.toString().padLeft(2, '0')}-${d.day.toString().padLeft(2, '0')}';

class PlanningWallScreen extends ConsumerStatefulWidget {
  const PlanningWallScreen({super.key});

  @override
  ConsumerState<PlanningWallScreen> createState() =>
      _PlanningWallScreenState();
}

class _PlanningWallScreenState extends ConsumerState<PlanningWallScreen> {
  String? _filterMemberId;
  String? _filterStatus;

  @override
  Widget build(BuildContext context) {
    final itemsAsync = ref.watch(weekPlanningProvider);
    final members = ref.watch(planningWallMembersProvider).value ?? [];
    final membersById = {for (final m in members) m.id: m};

    return Scaffold(
      appBar: AppBar(
        title: Text(context.l10n.planningWallTitle),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: () {
              ref.invalidate(weekPlanningProvider);
              ref.invalidate(planningWallMembersProvider);
            },
          ),
        ],
      ),
      body: itemsAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => ApiErrorWidget(
          error: e,
          onRetry: () => ref.invalidate(weekPlanningProvider),
        ),
        data: (items) {
          if (items.isEmpty) {
            return Center(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const Text('📅', style: TextStyle(fontSize: 64)),
                  const SizedBox(height: 12),
                  Text(context.l10n.planningWallEmpty),
                ],
              ),
            );
          }

          final filtered = items.where((i) {
            if (_filterMemberId != null &&
                i.assignedToMemberId != _filterMemberId) {
              return false;
            }
            if (_filterStatus != null && i.status != _filterStatus) {
              return false;
            }
            return true;
          }).toList();

          final byDay = <String, List<ScheduleItem>>{};
          for (final item in filtered) {
            (byDay[_dayKey(item.date)] ??= []).add(item);
          }
          final sortedKeys = byDay.keys.toList()..sort();

          return Column(
            children: [
              _FilterBar(
                members: members,
                filterMemberId: _filterMemberId,
                filterStatus: _filterStatus,
                onMemberChanged: (id) => setState(() => _filterMemberId = id),
                onStatusChanged: (s) => setState(() => _filterStatus = s),
              ),
              Expanded(
                child: sortedKeys.isEmpty
                    ? Center(
                        child: Text(context.l10n.planningWallEmpty),
                      )
                    : ListView.builder(
                        padding: const EdgeInsets.symmetric(vertical: 8),
                        itemCount: sortedKeys.length,
                        itemBuilder: (context, i) => _DaySection(
                          date: byDay[sortedKeys[i]]!.first.date,
                          items: byDay[sortedKeys[i]]!,
                          membersById: membersById,
                        ),
                      ),
              ),
            ],
          );
        },
      ),
    );
  }
}

class _FilterBar extends StatelessWidget {
  final List<FamilyMember> members;
  final String? filterMemberId;
  final String? filterStatus;
  final ValueChanged<String?> onMemberChanged;
  final ValueChanged<String?> onStatusChanged;

  const _FilterBar({
    required this.members,
    required this.filterMemberId,
    required this.filterStatus,
    required this.onMemberChanged,
    required this.onStatusChanged,
  });

  @override
  Widget build(BuildContext context) {
    final statusOptions = <String, String>{
      'PENDING': context.l10n.planningWallStatusPending,
      'COMPLETED': context.l10n.planningWallStatusCompleted,
      'SKIPPED': context.l10n.planningWallStatusSkipped,
    };

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      decoration: BoxDecoration(
        border: Border(bottom: BorderSide(color: Colors.grey.shade200)),
      ),
      child: SingleChildScrollView(
        scrollDirection: Axis.horizontal,
        child: Row(
          children: [
            _FilterChip(
              label: context.l10n.planningWallFilterAllMembers,
              active: filterMemberId == null,
              onTap: () => onMemberChanged(null),
            ),
            for (final m in members)
              _FilterChip(
                label: m.name,
                active: filterMemberId == m.id,
                dotColor: m.color != null
                    ? Color(
                        int.parse(m.color!.substring(1), radix: 16) +
                            0xFF000000)
                    : null,
                onTap: () => onMemberChanged(m.id),
              ),
            Container(
              width: 1,
              height: 20,
              margin: const EdgeInsets.symmetric(horizontal: 6),
              color: Colors.grey.shade200,
            ),
            _FilterChip(
              label: context.l10n.planningWallFilterAllStatus,
              active: filterStatus == null,
              onTap: () => onStatusChanged(null),
            ),
            for (final entry in statusOptions.entries)
              _FilterChip(
                label: entry.value,
                active: filterStatus == entry.key,
                onTap: () => onStatusChanged(entry.key),
              ),
          ],
        ),
      ),
    );
  }
}

class _FilterChip extends StatelessWidget {
  final String label;
  final bool active;
  final Color? dotColor;
  final VoidCallback onTap;

  const _FilterChip({
    required this.label,
    required this.active,
    required this.onTap,
    this.dotColor,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Padding(
      padding: const EdgeInsets.only(right: 6),
      child: GestureDetector(
        onTap: onTap,
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
          decoration: BoxDecoration(
            color: active ? theme.colorScheme.primary : Colors.grey.shade100,
            borderRadius: BorderRadius.circular(20),
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              if (dotColor != null) ...[
                Container(
                  width: 8,
                  height: 8,
                  decoration:
                      BoxDecoration(color: dotColor, shape: BoxShape.circle),
                ),
                const SizedBox(width: 6),
              ],
              Text(
                label,
                style: TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.w600,
                  color: active ? Colors.white : Colors.grey.shade700,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _DaySection extends StatelessWidget {
  final DateTime date;
  final List<ScheduleItem> items;
  final Map<String, FamilyMember> membersById;

  const _DaySection({
    required this.date,
    required this.items,
    required this.membersById,
  });

  @override
  Widget build(BuildContext context) {
    final noon = items.where((i) => i.isNoon).toList();
    final evening = items.where((i) => !i.isNoon).toList();
    final locale = ProviderScope.containerOf(context).read(appLocaleProvider);
    final label = DateFormat('EEEE d MMMM', dateLocaleFor(locale)).format(date);

    return Card(
      margin: const EdgeInsets.fromLTRB(12, 6, 12, 6),
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              label[0].toUpperCase() + label.substring(1),
              style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w700),
            ),
            const SizedBox(height: 8),
            if (noon.isNotEmpty) ...[
              _SlotLabel(label: context.l10n.planningWallNoon, icon: Icons.wb_sunny_outlined, color: _noonColor),
              ...noon.map((i) => _MemberTaskRow(item: i, member: membersById[i.assignedToMemberId])),
            ],
            if (evening.isNotEmpty) ...[
              if (noon.isNotEmpty) const SizedBox(height: 6),
              _SlotLabel(label: context.l10n.planningWallEvening, icon: Icons.nights_stay_outlined, color: _eveningColor),
              ...evening.map((i) => _MemberTaskRow(item: i, member: membersById[i.assignedToMemberId])),
            ],
          ],
        ),
      ),
    );
  }
}

class _SlotLabel extends StatelessWidget {
  final String label;
  final IconData icon;
  final Color color;

  const _SlotLabel({required this.label, required this.icon, required this.color});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        children: [
          Icon(icon, size: 16, color: color),
          const SizedBox(width: 6),
          Text(
            label,
            style: TextStyle(fontSize: 13, fontWeight: FontWeight.w700, color: color),
          ),
        ],
      ),
    );
  }
}

class _MemberTaskRow extends StatelessWidget {
  final ScheduleItem item;
  final FamilyMember? member;

  const _MemberTaskRow({required this.item, this.member});

  @override
  Widget build(BuildContext context) {
    final memberColor = member?.color != null
        ? Color(int.parse(member!.color!.substring(1), radix: 16) + 0xFF000000)
        : Colors.grey;

    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        children: [
          Container(
            width: 10,
            height: 10,
            decoration: BoxDecoration(color: memberColor, shape: BoxShape.circle),
          ),
          const SizedBox(width: 8),
          Text(
            member?.name ?? '?',
            style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600),
          ),
          const SizedBox(width: 8),
          Expanded(
            child: Text(
              '${item.taskIcon ?? ''} ${item.taskName}',
              style: TextStyle(
                fontSize: 13,
                color: item.isCompleted ? Colors.grey.shade400 : Colors.black87,
                decoration: item.isCompleted ? TextDecoration.lineThrough : null,
              ),
              overflow: TextOverflow.ellipsis,
            ),
          ),
          if (item.isCompleted)
            Icon(Icons.check_circle, size: 16, color: Colors.green.shade400)
          else
            Text('+${item.taskPoints}', style: TextStyle(fontSize: 12, color: Colors.grey.shade500)),
        ],
      ),
    );
  }
}
