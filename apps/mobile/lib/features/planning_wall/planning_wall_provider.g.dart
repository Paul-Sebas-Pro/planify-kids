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
          FutureOr<List<ScheduleItem>>
        >
    with
        $FutureModifier<List<ScheduleItem>>,
        $FutureProvider<List<ScheduleItem>> {
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
  $FutureProviderElement<List<ScheduleItem>> $createElement(
    $ProviderPointer pointer,
  ) => $FutureProviderElement(pointer);

  @override
  FutureOr<List<ScheduleItem>> create(Ref ref) {
    return weekPlanning(ref);
  }
}

String _$weekPlanningHash() => r'0e460df100a3d57307bd6bda538475d038114008';

@ProviderFor(planningWallMembers)
final planningWallMembersProvider = PlanningWallMembersProvider._();

final class PlanningWallMembersProvider
    extends
        $FunctionalProvider<
          AsyncValue<List<FamilyMember>>,
          List<FamilyMember>,
          FutureOr<List<FamilyMember>>
        >
    with
        $FutureModifier<List<FamilyMember>>,
        $FutureProvider<List<FamilyMember>> {
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
  $FutureProviderElement<List<FamilyMember>> $createElement(
    $ProviderPointer pointer,
  ) => $FutureProviderElement(pointer);

  @override
  FutureOr<List<FamilyMember>> create(Ref ref) {
    return planningWallMembers(ref);
  }
}

String _$planningWallMembersHash() =>
    r'907079c434d7d7dbd906710b3c62433e3d758a44';
