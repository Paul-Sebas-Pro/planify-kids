import 'package:riverpod_annotation/riverpod_annotation.dart';

import '../../models/schedule_item.dart';
import '../../shared/providers/providers.dart';
import '../auth/auth_provider.dart';

part 'tasks_provider.g.dart';

@riverpod
Future<List<ScheduleItem>> todayTasks(Ref ref) async {
  final user = ref.watch(authProvider).value;
  if (user == null) return [];
  final api = ref.watch(apiClientProvider);
  return api.getTodayItems(user.id);
}

@riverpod
class TasksNotifier extends _$TasksNotifier {
  @override
  Future<List<ScheduleItem>> build() async {
    return ref.watch(todayTasksProvider.future);
  }

  Future<void> markCompleted(String itemId) async {
    final api = ref.read(apiClientProvider);
    await api.updateScheduleItemStatus(itemId, 'COMPLETED');

    state = AsyncData(
      state.value
              ?.map((item) =>
                  item.id == itemId ? item.copyWith(status: 'COMPLETED') : item)
              .toList() ??
          [],
    );
  }

  Future<void> markPending(String itemId) async {
    final api = ref.read(apiClientProvider);
    await api.updateScheduleItemStatus(itemId, 'PENDING');

    state = AsyncData(
      state.value
              ?.map((item) =>
                  item.id == itemId ? item.copyWith(status: 'PENDING') : item)
              .toList() ??
          [],
    );
  }
}
