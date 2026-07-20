import 'package:riverpod_annotation/riverpod_annotation.dart';

import '../../models/family_member.dart';
import '../../models/schedule_item.dart';
import '../../shared/providers/providers.dart';

part 'planning_wall_provider.g.dart';

@riverpod
Future<List<ScheduleItem>> weekPlanning(Ref ref) async {
  final api = ref.watch(apiClientProvider);
  return api.getWeekSchedule();
}

@riverpod
Future<List<FamilyMember>> planningWallMembers(Ref ref) async {
  final api = ref.watch(apiClientProvider);
  return api.getFamilyMembers();
}
