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

String _$exchangesNotifierHash() => r'327f01aab5a4e3a2bd4f9db713b38df799e93b3d';

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
