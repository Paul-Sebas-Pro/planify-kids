// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'planning_wall_provider.dart';

// **************************************************************************
// RiverpodGenerator
// **************************************************************************

// GENERATED CODE - DO NOT MODIFY BY HAND
// ignore_for_file: type=lint, type=warning

@ProviderFor(weekPlanning)
final weekPlanningProvider = WeekPlanningProvider._();

final class WeekPlanningProvider
    extends
        $FunctionalProvider<
          AsyncValue<List<ScheduleItem>>,
          List<ScheduleItem>,
          Stream<List<ScheduleItem>>
        >
    with
        $FutureModifier<List<ScheduleItem>>,
        $StreamProvider<List<ScheduleItem>> {
  WeekPlanningProvider._()
    : super(
        from: null,
        argument: null,
        retry: null,
        name: r'weekPlanningProvider',
        isAutoDispose: true,
        dependencies: null,
        $allTransitiveDependencies: null,
      );

  @override
  String debugGetCreateSourceHash() => _$weekPlanningHash();

  @$internal
  @override
  $StreamProviderElement<List<ScheduleItem>> $createElement(
    $ProviderPointer pointer,
  ) => $StreamProviderElement(pointer);

  @override
  Stream<List<ScheduleItem>> create(Ref ref) {
    return weekPlanning(ref);
  }
}

String _$weekPlanningHash() => r'5359681fc63f0b4be004bb0d3d1387096094a4fa';

@ProviderFor(planningWallMembers)
final planningWallMembersProvider = PlanningWallMembersProvider._();

final class PlanningWallMembersProvider
    extends
        $FunctionalProvider<
          AsyncValue<List<FamilyMember>>,
          List<FamilyMember>,
          Stream<List<FamilyMember>>
        >
    with
        $FutureModifier<List<FamilyMember>>,
        $StreamProvider<List<FamilyMember>> {
  PlanningWallMembersProvider._()
    : super(
        from: null,
        argument: null,
        retry: null,
        name: r'planningWallMembersProvider',
        isAutoDispose: true,
        dependencies: null,
        $allTransitiveDependencies: null,
      );

  @override
  String debugGetCreateSourceHash() => _$planningWallMembersHash();

  @$internal
  @override
  $StreamProviderElement<List<FamilyMember>> $createElement(
    $ProviderPointer pointer,
  ) => $StreamProviderElement(pointer);

  @override
  Stream<List<FamilyMember>> create(Ref ref) {
    return planningWallMembers(ref);
  }
}

String _$planningWallMembersHash() =>
    r'9c6f26e5095b67f5b778c1e50c0670425324604e';
