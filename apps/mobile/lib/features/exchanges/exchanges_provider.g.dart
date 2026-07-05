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
    extends $AsyncNotifierProvider<ExchangesNotifier, List<Exchange>> {
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

String _$exchangesNotifierHash() => r'07702aa946446201b4d4fe752da5fd1d44fa61d1';

abstract class _$ExchangesNotifier extends $AsyncNotifier<List<Exchange>> {
  FutureOr<List<Exchange>> build();
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
          FutureOr<List<FamilyMember>>
        >
    with
        $FutureModifier<List<FamilyMember>>,
        $FutureProvider<List<FamilyMember>> {
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
  $FutureProviderElement<List<FamilyMember>> $createElement(
    $ProviderPointer pointer,
  ) => $FutureProviderElement(pointer);

  @override
  FutureOr<List<FamilyMember>> create(Ref ref) {
    return familyMembers(ref);
  }
}

String _$familyMembersHash() => r'5a7bf36d7528ecd8fc6941cc12c721b46de21f00';
