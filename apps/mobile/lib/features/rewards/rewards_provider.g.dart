// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'rewards_provider.dart';

// **************************************************************************
// RiverpodGenerator
// **************************************************************************

// GENERATED CODE - DO NOT MODIFY BY HAND
// ignore_for_file: type=lint, type=warning

@ProviderFor(rewards)
final rewardsProvider = RewardsProvider._();

final class RewardsProvider
    extends
        $FunctionalProvider<
          AsyncValue<List<Reward>>,
          List<Reward>,
          FutureOr<List<Reward>>
        >
    with $FutureModifier<List<Reward>>, $FutureProvider<List<Reward>> {
  RewardsProvider._()
    : super(
        from: null,
        argument: null,
        retry: null,
        name: r'rewardsProvider',
        isAutoDispose: true,
        dependencies: null,
        $allTransitiveDependencies: null,
      );

  @override
  String debugGetCreateSourceHash() => _$rewardsHash();

  @$internal
  @override
  $FutureProviderElement<List<Reward>> $createElement(
    $ProviderPointer pointer,
  ) => $FutureProviderElement(pointer);

  @override
  FutureOr<List<Reward>> create(Ref ref) {
    return rewards(ref);
  }
}

String _$rewardsHash() => r'9ca883eb95e560d0e4c9fd3de7b908129fedfc6f';

@ProviderFor(MyClaimsNotifier)
final myClaimsProvider = MyClaimsNotifierProvider._();

final class MyClaimsNotifierProvider
    extends $AsyncNotifierProvider<MyClaimsNotifier, List<RewardClaim>> {
  MyClaimsNotifierProvider._()
    : super(
        from: null,
        argument: null,
        retry: null,
        name: r'myClaimsProvider',
        isAutoDispose: true,
        dependencies: null,
        $allTransitiveDependencies: null,
      );

  @override
  String debugGetCreateSourceHash() => _$myClaimsNotifierHash();

  @$internal
  @override
  MyClaimsNotifier create() => MyClaimsNotifier();
}

String _$myClaimsNotifierHash() => r'52e80dbd3985fd8b68e8af962975ba1282bd458d';

abstract class _$MyClaimsNotifier extends $AsyncNotifier<List<RewardClaim>> {
  FutureOr<List<RewardClaim>> build();
  @$mustCallSuper
  @override
  WhenComplete runBuild() {
    final ref =
        this.ref as $Ref<AsyncValue<List<RewardClaim>>, List<RewardClaim>>;
    final element =
        ref.element
            as $ClassProviderElement<
              AnyNotifier<AsyncValue<List<RewardClaim>>, List<RewardClaim>>,
              AsyncValue<List<RewardClaim>>,
              Object?,
              Object?
            >;
    return element.handleCreate(ref, build);
  }
}
