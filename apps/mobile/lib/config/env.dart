abstract final class Env {
  static const apiBaseUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: 'http://10.0.2.2:3000',
  );

  static const powerSyncUrl = String.fromEnvironment(
    'POWERSYNC_URL',
    defaultValue: '',
  );
}
