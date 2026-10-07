import 'dart:io';

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mobile/database/connector.dart';
import 'package:mobile/database/schema.dart';
import 'package:mobile/features/auth/auth_provider.dart';
import 'package:mobile/features/tasks/tasks_provider.dart';
import 'package:mobile/models/auth_user.dart';
import 'package:mobile/models/schedule_item.dart';
import 'package:mobile/shared/providers/my_points_provider.dart';
import 'package:mobile/shared/providers/providers.dart';
import 'package:mobile/shared/services/api_client.dart';
import 'package:mobile/shared/services/secure_storage.dart';
import 'package:path/path.dart';
import 'package:powersync/powersync.dart';

class _FakeAuthNotifier extends AuthNotifier {
  final AuthUser? _user;
  _FakeAuthNotifier(this._user);

  @override
  Future<AuthUser?> build() async => _user;
}

class _StubApiClient extends ApiClient {
  _StubApiClient() : super(SecureStorageService());

  final List<(String, String)> updateScheduleItemStatusCalls = [];

  @override
  Future<ScheduleItem> updateScheduleItemStatus(
      String itemId, String status) async {
    updateScheduleItemStatusCalls.add((itemId, status));
    return ScheduleItem(
      id: itemId,
      taskId: 'task-1',
      taskName: 'Ranger sa chambre',
      taskPoints: 10,
      assignedToMemberId: 'alice-id',
      date: DateTime(2026, 6, 16),
      status: status,
    );
  }
}

final _alice = AuthUser(
  id: 'alice-id',
  name: 'Alice',
  role: 'CHILD',
  familyId: 'fam-1',
  color: '#FF6584',
  points: 0,
);

Future<PowerSyncDatabase> _openTestDb() async {
  // ':memory:' n'est pas partagée entre les connexions du worker isolate
  // PowerSync (chaque connexion verrait une DB vide séparée) — un fichier
  // temporaire réel est nécessaire pour les tests.
  final dir = await Directory.systemTemp.createTemp('planify_test_db');
  final path = join(dir.path, 'test.db');
  final db = PowerSyncDatabase(schema: appSchema, path: path);
  await db.initialize();
  return db;
}

Future<void> _seedTask(PowerSyncDatabase db) async {
  await db.execute(
    'INSERT INTO tasks (id, name, icon, points, is_active, family_id) VALUES (?, ?, ?, ?, ?, ?)',
    ['task-1', 'Ranger sa chambre', '🛏️', 10, 1, 'fam-1'],
  );
}

Future<void> _seedScheduleItem(
  PowerSyncDatabase db, {
  String id = 'item-1',
  String status = 'PENDING',
}) async {
  await db.execute(
    '''
    INSERT INTO schedule_items
      (id, task_id, schedule_id, assigned_to_member_id, date, slot, status)
    VALUES (?, ?, ?, ?, ?, ?, ?)
    ''',
    [id, 'task-1', 'schedule-1', 'alice-id', '2026-06-16T00:00:00.000', 'EVENING', status],
  );
}

void main() {
  group('todayTasksProvider (lecture locale PowerSync)', () {
    late PowerSyncDatabase db;

    setUp(() async {
      db = await _openTestDb();
      await _seedTask(db);
    });

    tearDown(() => db.close());

    // Requête SQL identique à celle de todayTasksProvider (tasks_provider.dart)
    // — testée directement contre la DB pour valider jointure + mapping,
    // sans passer par le cycle de vie autoDispose de Riverpod.
    const query = '''
      SELECT si.id, si.task_id, t.name as task_name, t.icon as task_icon,
             t.points as task_points, si.assigned_to_member_id, si.date,
             si.slot, si.status
      FROM schedule_items si
      LEFT JOIN tasks t ON t.id = si.task_id
      WHERE si.assigned_to_member_id = ? AND si.date LIKE ?
    ''';

    test('lit les tâches du jour depuis la DB locale, jointure tasks incluse',
        () async {
      await _seedScheduleItem(db);

      final rows = await db.getAll(query, ['alice-id', '2026-06-16%']);
      final items = rows.map(ScheduleItem.fromLocalRow).toList();

      expect(items, hasLength(1));
      expect(items.first.id, 'item-1');
      expect(items.first.taskName, 'Ranger sa chambre');
      expect(items.first.taskPoints, 10);
      expect(items.first.status, 'PENDING');
    });

    test('le stream réémet après une écriture locale (UPDATE)', () async {
      await _seedScheduleItem(db);

      final emissions = <List<ScheduleItem>>[];
      final sub = db
          .watch(query, parameters: ['alice-id', '2026-06-16%'])
          .map((rows) => rows.map(ScheduleItem.fromLocalRow).toList())
          .listen(emissions.add);
      addTearDown(sub.cancel);

      // Laisse le temps à la 1ère émission du watch().
      for (var i = 0; i < 40 && emissions.isEmpty; i++) {
        await Future<void>.delayed(const Duration(milliseconds: 50));
      }
      expect(emissions, isNotEmpty);
      expect(emissions.first.first.status, 'PENDING');

      await db.execute(
        'UPDATE schedule_items SET status = ? WHERE id = ?',
        ['COMPLETED', 'item-1'],
      );

      for (var i = 0; i < 40 && emissions.length < 2; i++) {
        await Future<void>.delayed(const Duration(milliseconds: 50));
      }

      expect(emissions.length, greaterThanOrEqualTo(2));
      expect(emissions.last.first.status, 'COMPLETED');
    });
  });

  group('TasksNotifier.markCompleted/markPending (écriture locale)', () {
    late PowerSyncDatabase db;

    setUp(() async {
      db = await _openTestDb();
      await _seedTask(db);
      await _seedScheduleItem(db);
    });

    tearDown(() => db.close());

    test('markCompleted écrit en local, relecture SQL confirme', () async {
      final container = ProviderContainer(overrides: [
        authProvider.overrideWith(() => _FakeAuthNotifier(_alice)),
        powerSyncDatabaseProvider.overrideWithValue(db),
      ]);
      addTearDown(container.dispose);

      await container.read(tasksProvider.notifier).markCompleted('item-1');

      final rows = await db.getAll(
        'SELECT status FROM schedule_items WHERE id = ?',
        ['item-1'],
      );
      expect(rows.first['status'], 'COMPLETED');
    });
  });

  group('myPointsProvider (points en direct depuis family_members)', () {
    late PowerSyncDatabase db;

    setUp(() async => db = await _openTestDb());
    tearDown(() => db.close());

    Future<int?> waitFor(ProviderContainer c, int expected) async {
      for (var i = 0; i < 40; i++) {
        final v = c.read(myPointsProvider).value;
        if (v == expected) return v;
        await Future<void>.delayed(const Duration(milliseconds: 50));
      }
      return c.read(myPointsProvider).value;
    }

    test('sans ligne locale — repli sur les points du login', () async {
      final container = ProviderContainer(overrides: [
        authProvider.overrideWith(() => _FakeAuthNotifier(AuthUser(
              id: 'alice-id',
              name: 'Alice',
              role: 'CHILD',
              familyId: 'fam-1',
              color: '#FF6584',
              points: 30,
            ))),
        powerSyncDatabaseProvider.overrideWithValue(db),
      ]);
      addTearDown(container.dispose);
      final sub = container.listen(myPointsProvider, (_, _) {});
      addTearDown(sub.close);

      expect(await waitFor(container, 30), 30);
    });

    test('suit la ligne locale et réémet quand la sync la met à jour',
        () async {
      await db.execute(
        'INSERT INTO family_members (id, name, role, points, color, avatar, family_id) VALUES (?, ?, ?, ?, ?, ?, ?)',
        ['alice-id', 'Alice', 'CHILD', 40, '#FF6584', null, 'fam-1'],
      );
      final container = ProviderContainer(overrides: [
        authProvider.overrideWith(() => _FakeAuthNotifier(_alice)),
        powerSyncDatabaseProvider.overrideWithValue(db),
      ]);
      addTearDown(container.dispose);
      final sub = container.listen(myPointsProvider, (_, _) {});
      addTearDown(sub.close);

      expect(await waitFor(container, 40), 40);

      await db.execute(
        'UPDATE family_members SET points = ? WHERE id = ?',
        [50, 'alice-id'],
      );
      expect(await waitFor(container, 50), 50);
    });
  });

  group('PlanifyConnector.uploadData (crud queue → REST)', () {
    late PowerSyncDatabase db;

    setUp(() async {
      db = await _openTestDb();
      await _seedTask(db);
      await _seedScheduleItem(db);
    });

    tearDown(() => db.close());

    test('rejoue une écriture locale vers ApiClient puis vide la crud queue',
        () async {
      final api = _StubApiClient();
      final connector = PlanifyConnector(api);

      await db.execute(
        'UPDATE schedule_items SET status = ? WHERE id = ?',
        ['COMPLETED', 'item-1'],
      );

      await connector.uploadData(db);

      expect(api.updateScheduleItemStatusCalls, contains(('item-1', 'COMPLETED')));
      final batch = await db.getCrudBatch();
      expect(batch, isNull);
    });
  });
}
