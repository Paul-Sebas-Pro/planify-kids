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
          FutureOr<List<MemberBadge>>
        >
    with
        $FutureModifier<List<MemberBadge>>,
        $FutureProvider<List<MemberBadge>> {
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
  $FutureProviderElement<List<MemberBadge>> $createElement(
    $ProviderPointer pointer,
  ) => $FutureProviderElement(pointer);

  @override
  FutureOr<List<MemberBadge>> create(Ref ref) {
    return memberBadges(ref);
  }
}

String _$memberBadgesHash() => r'be014016e40a7deb30f0d783006383b5aadc8d72';
