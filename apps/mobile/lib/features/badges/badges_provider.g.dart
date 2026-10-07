// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'badges_provider.dart';

// **************************************************************************
// RiverpodGenerator
// **************************************************************************

// GENERATED CODE - DO NOT MODIFY BY HAND
// ignore_for_file: type=lint, type=warning

@ProviderFor(memberBadges)
final memberBadgesProvider = MemberBadgesProvider._();

final class MemberBadgesProvider
    extends
        $FunctionalProvider<
          AsyncValue<List<MemberBadge>>,
          List<MemberBadge>,
          Stream<List<MemberBadge>>
        >
    with
        $FutureModifier<List<MemberBadge>>,
        $StreamProvider<List<MemberBadge>> {
  MemberBadgesProvider._()
    : super(
        from: null,
        argument: null,
        retry: null,
        name: r'memberBadgesProvider',
        isAutoDispose: true,
        dependencies: null,
        $allTransitiveDependencies: null,
      );

  @override
  String debugGetCreateSourceHash() => _$memberBadgesHash();

  @$internal
  @override
  $StreamProviderElement<List<MemberBadge>> $createElement(
    $ProviderPointer pointer,
  ) => $StreamProviderElement(pointer);

  @override
  Stream<List<MemberBadge>> create(Ref ref) {
    return memberBadges(ref);
  }
}

String _$memberBadgesHash() => r'a93577096018996cc0453a133cd6b2f7a06b640f';
