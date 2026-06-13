import 'package:riverpod_annotation/riverpod_annotation.dart';

import '../../models/exchange.dart';
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
}
