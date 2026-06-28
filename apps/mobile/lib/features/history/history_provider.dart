import 'package:riverpod_annotation/riverpod_annotation.dart';

import '../../models/timeline_event.dart';
import '../../shared/providers/providers.dart';

part 'history_provider.g.dart';

@riverpod
Future<List<TimelineEvent>> memberTimeline(
  Ref ref,
  String memberId,
) async {
  final client = ref.watch(apiClientProvider);
  return client.getTimeline(memberId);
}
