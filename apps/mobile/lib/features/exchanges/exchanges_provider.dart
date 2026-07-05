import 'package:riverpod_annotation/riverpod_annotation.dart';

import '../../models/exchange.dart';
import '../../models/family_member.dart';
import '../../shared/providers/providers.dart';

part 'exchanges_provider.g.dart';

@riverpod
class ExchangesNotifier extends _$ExchangesNotifier {
  @override
  Future<List<Exchange>> build() async {
    final api = ref.watch(apiClientProvider);
    return api.getExchanges();
  }

  Future<void> respond(String exchangeId, String status) async {
    final api = ref.read(apiClientProvider);
    await api.respondExchange(exchangeId, status);
    ref.invalidateSelf();
  }

  Future<void> propose({
    required String scheduleItemId,
    required String fromMemberId,
    required String toMemberId,
  }) async {
    final api = ref.read(apiClientProvider);
    await api.proposeExchange(
      scheduleItemId: scheduleItemId,
      fromMemberId: fromMemberId,
      toMemberId: toMemberId,
    );
    ref.invalidateSelf();
  }
}

@riverpod
Future<List<FamilyMember>> familyMembers(Ref ref) async {
  final api = ref.watch(apiClientProvider);
  return api.getFamilyMembers();
}
