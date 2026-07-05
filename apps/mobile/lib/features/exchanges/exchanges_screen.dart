import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';

import '../../models/exchange.dart';
import '../../models/family_member.dart';
import '../../models/schedule_item.dart';
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
        title: const Text('Échanges'),
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
              label: const Text('Proposer'),
            ),
      body: exchangesAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => ApiErrorWidget(
          error: e,
          onRetry: () => ref.invalidate(exchangesProvider),
        ),
        data: (exchanges) {
          if (exchanges.isEmpty) {
            return const Center(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text('🔄', style: TextStyle(fontSize: 64)),
                  SizedBox(height: 8),
                  Text('Aucun échange en cours'),
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
                _SectionTitle('Demandes reçues (${incoming.length})'),
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
                _SectionTitle('Demandes envoyées (${outgoing.length})'),
                ...outgoing.map((e) => _ExchangeCard(exchange: e)),
              ],
              if (history.isNotEmpty) ...[
                _SectionTitle('Historique'),
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
    final dateStr = item != null
        ? DateFormat('EEE d MMM', 'fr_FR').format(item.date)
        : '';

    Color statusColor;
    String statusLabel;
    switch (exchange.status) {
      case 'ACCEPTED':
        statusColor = Colors.green;
        statusLabel = 'Accepté';
      case 'REFUSED':
        statusColor = theme.colorScheme.error;
        statusLabel = 'Refusé';
      default:
        statusColor = Colors.orange;
        statusLabel = 'En attente';
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
                        item?.taskName ?? 'Tâche',
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
                      child: const Text('Refuser'),
                    ),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: FilledButton(
                      onPressed: onAccept,
                      child: const Text('Accepter'),
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
      setState(() => _error = 'Impossible de proposer cet échange.');
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final tasksAsync = ref.watch(todayTasksProvider);
    final membersAsync = ref.watch(familyMembersProvider);

    return AlertDialog(
      title: const Text('Proposer un échange'),
      content: SizedBox(
        width: 320,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            tasksAsync.when(
              loading: () => const CircularProgressIndicator(),
              error: (_, _) => const Text('Erreur de chargement des tâches'),
              data: (items) {
                final pending = items
                    .where((i) =>
                        i.isPending && i.assignedToMemberId == widget.fromMemberId)
                    .toList();
                if (pending.isEmpty) {
                  return const Text(
                      'Aucune tâche à échanger aujourd\'hui.');
                }
                return DropdownButtonFormField<ScheduleItem>(
                  initialValue: _selectedItem,
                  decoration: const InputDecoration(labelText: 'Ma tâche'),
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
              error: (_, _) => const Text('Erreur de chargement des membres'),
              data: (members) {
                final siblings = members
                    .where((m) =>
                        m.role == 'CHILD' && m.id != widget.fromMemberId)
                    .toList();
                if (siblings.isEmpty) {
                  return const Text('Aucun autre enfant dans la famille.');
                }
                return DropdownButtonFormField<FamilyMember>(
                  initialValue: _selectedMember,
                  decoration: const InputDecoration(labelText: 'Échanger avec'),
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
          child: const Text('Annuler'),
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
              : const Text('Proposer'),
        ),
      ],
    );
  }
}
