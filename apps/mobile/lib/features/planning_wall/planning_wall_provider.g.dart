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

String _$weekPlanningHash() => r'2b666f091eca2513d56f8563dc88623a68a0bd67';

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
    r'358e2141b1721f43d5da018272e7b27163941c77';
