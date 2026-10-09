/// Lit un `timestamp` Postgres synchronisé par PowerSync.
///
/// Prisma stocke les `DateTime` en `timestamp` **sans fuseau** (valeurs UTC),
/// que PowerSync transmet au format `YYYY-MM-DD hh:mm:ss.sss` sans `Z`.
/// `DateTime.parse` le lirait comme heure locale (décalage de 1-2 h en
/// France) : on force l'UTC quand aucun fuseau n'est indiqué.
DateTime parseUtcTimestamp(String raw) {
  final hasZone = RegExp(r'(Z|[+-]\d{2}:?\d{2})$').hasMatch(raw);
  return DateTime.parse(hasZone ? raw : '${raw.replaceFirst(' ', 'T')}Z');
}
