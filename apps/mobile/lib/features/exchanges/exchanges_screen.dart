import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';

import '../../models/exchange.dart';
import '../../models/family_member.dart';
import '../../models/schedule_item.dart';
import '../../shared/l10n/l10n_extensions.dart';
import '../../shared/providers/locale_provider.dart';
import '../../shared/widgets/api_error_widget.dart';
import '../auth/auth_provider.dart';
import '../tasks/tasks_provider.dart';
import 'exchanges_provider.dart';

class ExchangesScreen extends ConsumerWidget {
  const ExchangesScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final exchangesAsync = ref.watch(exchangesProvider);
    final currentUser = ref.watch(authProvider).value;

    return Scaffold(
      appBar: AppBar(
        title: Text(context.l10n.exchangesTitle),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: () => ref.invalidate(exchangesProvider),
          ),
        ],
      ),
      floatingActionButton: currentUser == null
          ? null
          : FloatingActionButton.extended(
              onPressed: () => showDialog<void>(
                context: context,
                builder: (_) =>
                    _ProposeExchangeDialog(fromMemberId: currentUser.id),
              ),
              icon: const Icon(Icons.swap_horiz),
              label: Text(context.l10n.exchangesPropose),
            ),
      body: exchangesAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => ApiErrorWidget(
          error: e,
          onRetry: () => ref.invalidate(exchangesProvider),
        ),
        data: (exchanges) {
          if (exchanges.isEmpty) {
            return Center(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const Text('🔄', style: TextStyle(fontSize: 64)),
                  const SizedBox(height: 8),
                  Text(context.l10n.exchangesEmpty),
                ],
              ),
            );
          }

          final incoming = exchanges
              .where((e) =>
                  e.toMemberId == currentUser?.id && e.isPending)
              .toList();
          final outgoing = exchanges
              .where((e) =>
                  e.fromMemberId == currentUser?.id && e.isPending)
              .toList();
          final history = exchanges
              .where((e) => !e.isPending)
              .toList();

          return ListView(
            children: [
              if (incoming.isNotEmpty) ...[
                _SectionTitle(context.l10n.exchangesIncoming(incoming.length)),
                ...incoming.map((e) => _ExchangeCard(
                      exchange: e,
                      isIncoming: true,
                      onAccept: () => ref
                          .read(exchangesProvider.notifier)
                          .respond(e.id, 'ACCEPTED'),
                      onRefuse: () => ref
                          .read(exchangesProvider.notifier)
                          .respond(e.id, 'REFUSED'),
                    )),
              ],
              if (outgoing.isNotEmpty) ...[
                _SectionTitle(context.l10n.exchangesOutgoing(outgoing.length)),
                ...outgoing.map((e) => _ExchangeCard(exchange: e)),
              ],
              if (history.isNotEmpty) ...[
                _SectionTitle(context.l10n.exchangesHistory),
                ...history.map((e) => _ExchangeCard(exchange: e)),
              ],
              const SizedBox(height: 80),
            ],
          );
        },
      ),
    );
  }
}

class _SectionTitle extends StatelessWidget {
  final String title;
  const _SectionTitle(this.title);

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 4),
      child: Text(
        title,
        style: Theme.of(context).textTheme.labelMedium?.copyWith(
              color: Theme.of(context).colorScheme.onSurfaceVariant,
            ),
      ),
    );
  }
}

class _ExchangeCard extends StatelessWidget {
  final Exchange exchange;
  final bool isIncoming;
  final VoidCallback? onAccept;
  final VoidCallback? onRefuse;

  const _ExchangeCard({
    required this.exchange,
    this.isIncoming = false,
    this.onAccept,
    this.onRefuse,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final item = exchange.scheduleItem;
    final locale = ProviderScope.containerOf(context).read(appLocaleProvider);
    final dateStr = item != null
        ? DateFormat('EEE d MMM', dateLocaleFor(locale)).format(item.date)
        : '';

    Color statusColor;
    String statusLabel;
    switch (exchange.status) {
      case 'ACCEPTED':
        statusColor = Colors.green;
        statusLabel = context.l10n.exchangesStatusAccepted;
      case 'REFUSED':
        statusColor = theme.colorScheme.error;
        statusLabel = context.l10n.exchangesStatusRefused;
      default:
        statusColor = Colors.orange;
        statusLabel = context.l10n.exchangesStatusPending;
    }

    return Card(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Text(item?.taskIcon ?? '🔄',
                    style: const TextStyle(fontSize: 24)),
                const SizedBox(width: 8),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        item?.taskName ?? context.l10n.exchangesDefaultTaskName,
                        style: theme.textTheme.titleSmall,
                      ),
                      if (dateStr.isNotEmpty)
                        Text(
                          dateStr,
                          style: theme.textTheme.bodySmall?.copyWith(
                            color: theme.colorScheme.onSurfaceVariant,
                          ),
                        ),
                    ],
                  ),
                ),
                Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  decoration: BoxDecoration(
                    color: statusColor.withValues(alpha: 0.15),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Text(
                    statusLabel,
                    style: theme.textTheme.labelSmall
                        ?.copyWith(color: statusColor),
                  ),
                ),
              ],
            ),
            if (isIncoming && exchange.isPending) ...[
              const SizedBox(height: 8),
              Row(
                children: [
                  Expanded(
                    child: OutlinedButton(
                      onPressed: onRefuse,
                      child: Text(context.l10n.exchangesRefuse),
                    ),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: FilledButton(
                      onPressed: onAccept,
                      child: Text(context.l10n.exchangesAccept),
                    ),
                  ),
                ],
              ),
            ],
          ],
        ),
      ),
    );
  }
}

class _ProposeExchangeDialog extends ConsumerStatefulWidget {
  final String fromMemberId;
  const _ProposeExchangeDialog({required this.fromMemberId});

  @override
  ConsumerState<_ProposeExchangeDialog> createState() =>
      _ProposeExchangeDialogState();
}

class _ProposeExchangeDialogState
    extends ConsumerState<_ProposeExchangeDialog> {
  ScheduleItem? _selectedItem;
  FamilyMember? _selectedMember;
  bool _submitting = false;
  String? _error;

  Future<void> _submit() async {
    if (_selectedItem == null || _selectedMember == null) return;
    setState(() {
      _submitting = true;
      _error = null;
    });
    try {
      await ref.read(exchangesProvider.notifier).propose(
            scheduleItemId: _selectedItem!.id,
            fromMemberId: widget.fromMemberId,
            toMemberId: _selectedMember!.id,
          );
      if (!mounted) return;
      Navigator.of(context).pop();
    } catch (_) {
      setState(() => _error = context.l10n.exchangesSubmitError);
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final tasksAsync = ref.watch(todayTasksProvider);
    final membersAsync = ref.watch(familyMembersProvider);

    return AlertDialog(
      title: Text(context.l10n.exchangesProposeDialogTitle),
      content: SizedBox(
        width: 320,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            tasksAsync.when(
              loading: () => const CircularProgressIndicator(),
              error: (_, _) => Text(context.l10n.exchangesLoadTasksError),
              data: (items) {
                final pending = items
                    .where((i) =>
                        i.isPending && i.assignedToMemberId == widget.fromMemberId)
                    .toList();
                if (pending.isEmpty) {
                  return Text(context.l10n.exchangesNoTaskToday);
                }
                return DropdownButtonFormField<ScheduleItem>(
                  initialValue: _selectedItem,
                  decoration: InputDecoration(labelText: context.l10n.exchangesMyTaskLabel),
                  items: pending
                      .map((i) => DropdownMenuItem(
                            value: i,
                            child: Text('${i.taskIcon ?? '📋'} ${i.taskName}'),
                          ))
                      .toList(),
                  onChanged: (v) => setState(() => _selectedItem = v),
                );
              },
            ),
            const SizedBox(height: 16),
            membersAsync.when(
              loading: () => const CircularProgressIndicator(),
              error: (_, _) => Text(context.l10n.exchangesLoadMembersError),
              data: (members) {
                final siblings = members
                    .where((m) =>
                        m.role == 'CHILD' && m.id != widget.fromMemberId)
                    .toList();
                if (siblings.isEmpty) {
                  return Text(context.l10n.exchangesNoSiblings);
                }
                return DropdownButtonFormField<FamilyMember>(
                  initialValue: _selectedMember,
                  decoration: InputDecoration(labelText: context.l10n.exchangesExchangeWithLabel),
                  items: siblings
                      .map((m) => DropdownMenuItem(
                            value: m,
                            child: Text(m.name),
                          ))
                      .toList(),
                  onChanged: (v) => setState(() => _selectedMember = v),
                );
              },
            ),
            if (_error != null) ...[
              const SizedBox(height: 8),
              Text(_error!,
                  style: TextStyle(color: Theme.of(context).colorScheme.error)),
            ],
          ],
        ),
      ),
      actions: [
        TextButton(
          onPressed: () => Navigator.of(context).pop(),
          child: Text(context.l10n.exchangesCancel),
        ),
        FilledButton(
          onPressed: (_selectedItem == null ||
                  _selectedMember == null ||
                  _submitting)
              ? null
              : _submit,
          child: _submitting
              ? const SizedBox(
                  height: 16,
                  width: 16,
                  child: CircularProgressIndicator(strokeWidth: 2),
                )
              : Text(context.l10n.exchangesPropose),
        ),
      ],
    );
  }
}
