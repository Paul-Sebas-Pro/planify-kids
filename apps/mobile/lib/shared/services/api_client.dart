import 'package:dio/dio.dart';
import '../../config/env.dart';
import '../../models/auth_user.dart';
import '../../models/badge.dart';
import '../../models/exchange.dart';
import '../../models/family_member.dart';
import '../../models/schedule_item.dart';
import 'secure_storage.dart';

class ApiClient {
  late final Dio _dio;
  final SecureStorageService _storage;

  ApiClient(this._storage) {
    _dio = Dio(BaseOptions(
      baseUrl: Env.apiBaseUrl,
      connectTimeout: const Duration(seconds: 10),
      receiveTimeout: const Duration(seconds: 15),
    ));

    _dio.interceptors.add(InterceptorsWrapper(
      onRequest: (options, handler) async {
        final token = await _storage.getToken();
        if (token != null) {
          options.headers['Authorization'] = 'Bearer $token';
        }
        handler.next(options);
      },
    ));
  }

  // Auth
  Future<({String token, AuthUser member})> login(
      String email, String password) async {
    final res = await _dio.post('/auth/login', data: {
      'email': email,
      'password': password,
    });
    final data = res.data as Map<String, dynamic>;
    final member = AuthUser.fromJson(data);
    return (token: data['token'] as String, member: member);
  }

  Future<AuthUser> getCurrentUser() async {
    final res = await _dio.get('/auth/me');
    return AuthUser.fromJson(res.data as Map<String, dynamic>);
  }

  // Planning
  Future<List<ScheduleItem>> getTodayItems(String memberId) async {
    final today = DateTime.now().toIso8601String().split('T').first;
    final res = await _dio.get('/planning', queryParameters: {'date': today});
    final schedules = res.data as List<dynamic>;
    final items = <ScheduleItem>[];
    for (final schedule in schedules) {
      final s = schedule as Map<String, dynamic>;
      for (final item in (s['items'] as List<dynamic>? ?? [])) {
        final si = ScheduleItem.fromJson(item as Map<String, dynamic>);
        if (si.assignedToMemberId == memberId) items.add(si);
      }
    }
    return items;
  }

  Future<ScheduleItem> updateScheduleItemStatus(
      String itemId, String status) async {
    final res = await _dio.patch('/planning/items/$itemId', data: {
      'status': status,
    });
    return ScheduleItem.fromJson(res.data as Map<String, dynamic>);
  }

  // Badges
  Future<List<MemberBadge>> getMemberBadges(String memberId) async {
    final res = await _dio.get('/badges/member/$memberId');
    final list = res.data as List<dynamic>;
    return list
        .map((e) => MemberBadge.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  // Exchanges
  Future<List<Exchange>> getExchanges() async {
    final res = await _dio.get('/exchanges');
    final list = res.data as List<dynamic>;
    return list
        .map((e) => Exchange.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  Future<void> proposeExchange({
    required String scheduleItemId,
    required String fromMemberId,
    required String toMemberId,
  }) async {
    await _dio.post('/exchanges', data: {
      'scheduleItemId': scheduleItemId,
      'fromMemberId': fromMemberId,
      'toMemberId': toMemberId,
    });
  }

  Future<void> respondExchange(String exchangeId, String status) async {
    await _dio.patch('/exchanges/$exchangeId', data: {'status': status});
  }

  // Family
  Future<List<FamilyMember>> getFamilyMembers() async {
    final res = await _dio.get('/family/members');
    final list = res.data as List<dynamic>;
    return list
        .map((e) => FamilyMember.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  Future<Map<String, dynamic>> getFamilyStats() async {
    final res = await _dio.get('/family/stats');
    return res.data as Map<String, dynamic>;
  }
}
