// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'exchanges_provider.dart';

// **************************************************************************
// RiverpodGenerator
// **************************************************************************

// GENERATED CODE - DO NOT MODIFY BY HAND
// ignore_for_file: type=lint, type=warning

@ProviderFor(ExchangesNotifier)
final exchangesProvider = ExchangesNotifierProvider._();

final class ExchangesNotifierProvider
    extends $StreamNotifierProvider<ExchangesNotifier, List<Exchange>> {
  ExchangesNotifierProvider._()
    : super(
        from: null,
        argument: null,
        retry: null,
        name: r'exchangesProvider',
        isAutoDispose: true,
        dependencies: null,
        $allTransitiveDependencies: null,
      );

  @override
  String debugGetCreateSourceHash() => _$exchangesNotifierHash();

  @$internal
  @override
  ExchangesNotifier create() => ExchangesNotifier();
}

String _$exchangesNotifierHash() => r'1527b1fbb5dd6172d467d840867a2546ef3243f9';

abstract class _$ExchangesNotifier extends $StreamNotifier<List<Exchange>> {
  Stream<List<Exchange>> build();
  @$mustCallSuper
  @override
  WhenComplete runBuild() {
    final ref = this.ref as $Ref<AsyncValue<List<Exchange>>, List<Exchange>>;
    final element =
        ref.element
            as $ClassProviderElement<
              AnyNotifier<AsyncValue<List<Exchange>>, List<Exchange>>,
              AsyncValue<List<Exchange>>,
              Object?,
              Object?
            >;
    return element.handleCreate(ref, build);
  }
}

@ProviderFor(familyMembers)
final familyMembersProvider = FamilyMembersProvider._();

final class FamilyMembersProvider
    extends
        $FunctionalProvider<
          AsyncValue<List<FamilyMember>>,
          List<FamilyMember>,
          Stream<List<FamilyMember>>
        >
    with
        $FutureModifier<List<FamilyMember>>,
        $StreamProvider<List<FamilyMember>> {
  FamilyMembersProvider._()
    : super(
        from: null,
        argument: null,
        retry: null,
        name: r'familyMembersProvider',
        isAutoDispose: true,
        dependencies: null,
        $allTransitiveDependencies: null,
      );

  @override
  String debugGetCreateSourceHash() => _$familyMembersHash();

  @$internal
  @override
  $StreamProviderElement<List<FamilyMember>> $createElement(
    $ProviderPointer pointer,
  ) => $StreamProviderElement(pointer);

  @override
  Stream<List<FamilyMember>> create(Ref ref) {
    return familyMembers(ref);
  }
}

String _$familyMembersHash() => r'feee5948278634a80c5ed5e44588d115967541ce';
