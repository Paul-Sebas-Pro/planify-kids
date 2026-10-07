import 'package:powersync/powersync.dart';

const appSchema = Schema([
  Table(
    'schedule_items',
    [
      Column.text('task_id'),
      Column.text('schedule_id'),
      Column.text('assigned_to_member_id'),
      Column.text('date'),
      Column.text('slot'),
      Column.text('status'),
    ],
    // Ancien statut joint à chaque écriture (CrudEntry.previousValues) :
    // envoyé au serveur en `expectedStatus` pour détecter un conflit
    // (statut modifié côté serveur pendant que la tablette était hors ligne).
    trackPreviousValues: TrackPreviousValuesOptions(columnFilter: ['status']),
  ),
  Table('tasks', [
    Column.text('name'),
    Column.text('icon'),
    Column.integer('points'),
    Column.integer('is_active'),
    Column.text('family_id'),
  ]),
  Table('member_badges', [
    Column.text('member_id'),
    Column.text('badge_id'),
    Column.text('earned_at'),
  ]),
  Table('badges', [
    Column.text('name'),
    Column.text('icon'),
    Column.text('description'),
    Column.text('condition_type'),
    Column.integer('condition_value'),
  ]),
  Table('exchanges', [
    Column.text('schedule_item_id'),
    Column.text('from_member_id'),
    Column.text('to_member_id'),
    Column.text('status'),
    Column.text('created_at'),
  ]),
  Table('family_members', [
    Column.text('name'),
    Column.text('role'),
    Column.integer('points'),
    Column.text('color'),
    Column.text('avatar'),
    Column.text('family_id'),
  ]),
]);
