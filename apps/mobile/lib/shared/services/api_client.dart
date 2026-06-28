import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';

import '../../config/env.dart';
import '../../models/auth_user.dart';
import '../../models/badge.dart';
import '../../models/exchange.dart';
import '../../models/family_member.dart';
import '../../models/notification_item.dart';
import '../../models/reward.dart';
import '../../models/timeline_event.dart';
import '../../models/schedule_item.dart';
import 'secure_storage.dart';

class ApiClient {
  late final Dio _dio;
  final SecureStorageService _storage;

  ApiClient(this._storage, {VoidCallback? onUnauthorized}) {
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
      onError: (DioException e, handler) {
        if (e.response?.statusCode == 401) {
          onUnauthorized?.call();
        }
        handler.next(e);
      },
    ));
  }

  Map<String, dynamic> _unwrap(Response res) {
    return (res.data as Map<String, dynamic>)['data'] as Map<String, dynamic>;
  }

  List<dynamic> _unwrapList(Response res) {
    return (res.data as Map<String, dynamic>)['data'] as List<dynamic>;
  }

  // ── Auth ──────────────────────────────────────────────────────────────────

  Future<({String token, AuthUser member})> login(
      String email, String password) async {
    final res = await _dio.post('/auth/login', data: {
      'email': email,
      'password': password,
    });
    final data = _unwrap(res);
    final member = AuthUser.fromLoginData(data);
    final token =
        (data['tokens'] as Map<String, dynamic>)['accessToken'] as String;
    return (token: token, member: member);
  }

  Future<List<Map<String, dynamic>>> getChildrenByCode(String code) async {
    final res = await _dio.get('/auth/family-members',
        queryParameters: {'code': code.toUpperCase()});
    final data = _unwrap(res);
    return (data['members'] as List<dynamic>)
        .map((e) => e as Map<String, dynamic>)
        .toList();
  }

  Future<({String token, AuthUser member})> loginChild(
      String familyCode, String memberId, String pin) async {
    final res = await _dio.post('/auth/login-child', data: {
      'familyCode': familyCode.toUpperCase(),
      'memberId': memberId,
      'pin': pin,
    });
    final data = _unwrap(res);
    final member = AuthUser.fromLoginData(data);
    final token =
        (data['tokens'] as Map<String, dynamic>)['accessToken'] as String;
    return (token: token, member: member);
  }

  // ── Planning ──────────────────────────────────────────────────────────────

  Future<List<ScheduleItem>> getTodayItems(String memberId) async {
    final today = DateTime.now().toIso8601String().split('T').first;
    final listRes = await _dio.get('/planning');
    final schedules = _unwrapList(listRes);
    final items = <ScheduleItem>[];
    for (final schedule in schedules) {
      final scheduleId = (schedule as Map<String, dynamic>)['id'] as String;
      final detailRes = await _dio.get('/planning/$scheduleId');
      final detail = _unwrap(detailRes);
      for (final item in (detail['items'] as List<dynamic>? ?? [])) {
        final si = ScheduleItem.fromJson(item as Map<String, dynamic>);
        final itemDate = si.date.toIso8601String().split('T').first;
        if (si.assignedToMemberId == memberId && itemDate == today) {
          items.add(si);
        }
      }
    }
    return items;
  }

  Future<ScheduleItem> updateScheduleItemStatus(
      String itemId, String status) async {
    final res = await _dio.patch('/planning/items/$itemId', data: {
      'status': status,
    });
    return ScheduleItem.fromJson(_unwrap(res));
  }

  // ── Badges ────────────────────────────────────────────────────────────────

  Future<List<MemberBadge>> getMemberBadges(String memberId) async {
    final res = await _dio.get('/badges/member/$memberId');
    return _unwrapList(res)
        .map((e) => MemberBadge.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  // ── Exchanges ─────────────────────────────────────────────────────────────

  Future<List<Exchange>> getExchanges() async {
    final res = await _dio.get('/exchanges');
    return _unwrapList(res)
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

  // ── Family ────────────────────────────────────────────────────────────────

  Future<List<FamilyMember>> getFamilyMembers() async {
    final res = await _dio.get('/family/members');
    return _unwrapList(res)
        .map((e) => FamilyMember.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  Future<Map<String, dynamic>> getFamilyStats() async {
    final res = await _dio.get('/family/stats');
    return _unwrap(res);
  }

  // ── Rewards ───────────────────────────────────────────────────────────────

  Future<List<Reward>> getRewards() async {
    final res = await _dio.get('/rewards');
    return _unwrapList(res)
        .map((e) => Reward.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  Future<List<RewardClaim>> getMyRewardClaims() async {
    final res = await _dio.get('/rewards/my-claims');
    return _unwrapList(res)
        .map((e) => RewardClaim.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  Future<void> claimReward(String rewardId, String memberId) async {
    await _dio.post('/rewards/$rewardId/claim', data: {'memberId': memberId});
  }

  // ── Notifications ─────────────────────────────────────────────────────────

  Future<List<NotificationItem>> getNotifications() async {
    final res = await _dio.get('/notifications');
    return _unwrapList(res)
        .map((e) => NotificationItem.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  Future<void> markNotificationRead(String id) async {
    await _dio.patch('/notifications/$id/read');
  }

  Future<void> markAllNotificationsRead() async {
    await _dio.patch('/notifications/read-all');
  }

  Future<List<TimelineEvent>> getTimeline(String memberId) async {
    final res = await _dio.get('/family/members/$memberId/timeline');
    final data = (res.data['data'] as List<dynamic>);
    return data
        .map((e) => TimelineEvent.fromJson(e as Map<String, dynamic>))
        .toList();
  }
}
