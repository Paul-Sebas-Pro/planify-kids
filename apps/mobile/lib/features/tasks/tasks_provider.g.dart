// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'tasks_provider.dart';

// **************************************************************************
// RiverpodGenerator
// **************************************************************************

// GENERATED CODE - DO NOT MODIFY BY HAND
// ignore_for_file: type=lint, type=warning

@ProviderFor(todayTasks)
final todayTasksProvider = TodayTasksProvider._();

final class TodayTasksProvider
    extends
        $FunctionalProvider<
          AsyncValue<List<ScheduleItem>>,
          List<ScheduleItem>,
          FutureOr<List<ScheduleItem>>
        >
    with
        $FutureModifier<List<ScheduleItem>>,
        $FutureProvider<List<ScheduleItem>> {
  TodayTasksProvider._()
    : super(
        from: null,
        argument: null,
        retry: null,
        name: r'todayTasksProvider',
        isAutoDispose: true,
        dependencies: null,
        $allTransitiveDependencies: null,
      );

  @override
  String debugGetCreateSourceHash() => _$todayTasksHash();

  @$internal
  @override
  $FutureProviderElement<List<ScheduleItem>> $createElement(
    $ProviderPointer pointer,
  ) => $FutureProviderElement(pointer);

  @override
  FutureOr<List<ScheduleItem>> create(Ref ref) {
    return todayTasks(ref);
  }
}

String _$todayTasksHash() => r'3d894449617132dabe551dfeaadb5a015effc504';

@ProviderFor(TasksNotifier)
final tasksProvider = TasksNotifierProvider._();

final class TasksNotifierProvider
    extends $AsyncNotifierProvider<TasksNotifier, List<ScheduleItem>> {
  TasksNotifierProvider._()
    : super(
        from: null,
        argument: null,
        retry: null,
        name: r'tasksProvider',
        isAutoDispose: true,
        dependencies: null,
        $allTransitiveDependencies: null,
      );

  @override
  String debugGetCreateSourceHash() => _$tasksNotifierHash();

  @$internal
  @override
  TasksNotifier create() => TasksNotifier();
}

String _$tasksNotifierHash() => r'1e6d6b0824d7cf2424ee26498f35d888d00657ce';

abstract class _$TasksNotifier extends $AsyncNotifier<List<ScheduleItem>> {
  FutureOr<List<ScheduleItem>> build();
  @$mustCallSuper
  @override
  WhenComplete runBuild() {
    final ref =
        this.ref as $Ref<AsyncValue<List<ScheduleItem>>, List<ScheduleItem>>;
    final element =
        ref.element
            as $ClassProviderElement<
              AnyNotifier<AsyncValue<List<ScheduleItem>>, List<ScheduleItem>>,
              AsyncValue<List<ScheduleItem>>,
              Object?,
              Object?
            >;
    return element.handleCreate(ref, build);
  }
}
