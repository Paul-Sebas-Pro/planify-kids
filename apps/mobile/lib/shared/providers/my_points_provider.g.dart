// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'my_points_provider.dart';

// **************************************************************************
// RiverpodGenerator
// **************************************************************************

// GENERATED CODE - DO NOT MODIFY BY HAND
// ignore_for_file: type=lint, type=warning
/// Points du membre connecté, suivis en direct.
///
/// `AuthUser.points` n'est qu'une copie figée au login : les points crédités
/// (tâche faite) ou débités (récompense) par le serveur n'y apparaissent
/// jamais. La table locale `family_members` est, elle, tenue à jour par la
/// sync PowerSync. Repli sur la valeur du login tant que la ligne locale
/// n'existe pas (avant 1re sync, PowerSync non configuré).

@ProviderFor(myPoints)
final myPointsProvider = MyPointsProvider._();

/// Points du membre connecté, suivis en direct.
///
/// `AuthUser.points` n'est qu'une copie figée au login : les points crédités
/// (tâche faite) ou débités (récompense) par le serveur n'y apparaissent
/// jamais. La table locale `family_members` est, elle, tenue à jour par la
/// sync PowerSync. Repli sur la valeur du login tant que la ligne locale
/// n'existe pas (avant 1re sync, PowerSync non configuré).

final class MyPointsProvider
    extends $FunctionalProvider<AsyncValue<int>, int, Stream<int>>
    with $FutureModifier<int>, $StreamProvider<int> {
  /// Points du membre connecté, suivis en direct.
  ///
  /// `AuthUser.points` n'est qu'une copie figée au login : les points crédités
  /// (tâche faite) ou débités (récompense) par le serveur n'y apparaissent
  /// jamais. La table locale `family_members` est, elle, tenue à jour par la
  /// sync PowerSync. Repli sur la valeur du login tant que la ligne locale
  /// n'existe pas (avant 1re sync, PowerSync non configuré).
  MyPointsProvider._()
    : super(
        from: null,
        argument: null,
        retry: null,
        name: r'myPointsProvider',
        isAutoDispose: true,
        dependencies: null,
        $allTransitiveDependencies: null,
      );

  @override
  String debugGetCreateSourceHash() => _$myPointsHash();

  @$internal
  @override
  $StreamProviderElement<int> $createElement($ProviderPointer pointer) =>
      $StreamProviderElement(pointer);

  @override
  Stream<int> create(Ref ref) {
    return myPoints(ref);
  }
}

String _$myPointsHash() => r'91e9a23a9b335002fae7928b44bcbcaf4975f5c0';
