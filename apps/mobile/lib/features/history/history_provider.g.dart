// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'history_provider.dart';

// **************************************************************************
// RiverpodGenerator
// **************************************************************************

// GENERATED CODE - DO NOT MODIFY BY HAND
// ignore_for_file: type=lint, type=warning

@ProviderFor(memberTimeline)
final memberTimelineProvider = MemberTimelineFamily._();

final class MemberTimelineProvider
    extends
        $FunctionalProvider<
          AsyncValue<List<TimelineEvent>>,
          List<TimelineEvent>,
          FutureOr<List<TimelineEvent>>
        >
    with
        $FutureModifier<List<TimelineEvent>>,
        $FutureProvider<List<TimelineEvent>> {
  MemberTimelineProvider._({
    required MemberTimelineFamily super.from,
    required String super.argument,
  }) : super(
         retry: null,
         name: r'memberTimelineProvider',
         isAutoDispose: true,
         dependencies: null,
         $allTransitiveDependencies: null,
       );

  @override
  String debugGetCreateSourceHash() => _$memberTimelineHash();

  @override
  String toString() {
    return r'memberTimelineProvider'
        ''
        '($argument)';
  }

  @$internal
  @override
  $FutureProviderElement<List<TimelineEvent>> $createElement(
    $ProviderPointer pointer,
  ) => $FutureProviderElement(pointer);

  @override
  FutureOr<List<TimelineEvent>> create(Ref ref) {
    final argument = this.argument as String;
    return memberTimeline(ref, argument);
  }

  @override
  bool operator ==(Object other) {
    return other is MemberTimelineProvider && other.argument == argument;
  }

  @override
  int get hashCode {
    return argument.hashCode;
  }
}

String _$memberTimelineHash() => r'8fe921d5c1a60ec043339b154e4c98e02f62534b';

final class MemberTimelineFamily extends $Family
    with $FunctionalFamilyOverride<FutureOr<List<TimelineEvent>>, String> {
  MemberTimelineFamily._()
    : super(
        retry: null,
        name: r'memberTimelineProvider',
        dependencies: null,
        $allTransitiveDependencies: null,
        isAutoDispose: true,
      );

  MemberTimelineProvider call(String memberId) =>
      MemberTimelineProvider._(argument: memberId, from: this);

  @override
  String toString() => r'memberTimelineProvider';
}
