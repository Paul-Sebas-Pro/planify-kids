import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';

import 'api_client.dart';

// Handler de messages en arrière-plan (top-level, requis Firebase)
@pragma('vm:entry-point')
Future<void> _firebaseBackgroundHandler(RemoteMessage message) async {
  // Pas d'init Firebase ici : déjà fait dans main()
  // Les notifications système sont affichées automatiquement par le plugin.
}

class PushNotificationService {
  static bool _initialized = false;

  static final FlutterLocalNotificationsPlugin _localNotif =
      FlutterLocalNotificationsPlugin();

  static Future<void> init(ApiClient api, String memberId) async {
    if (_initialized) return;
    if (Firebase.apps.isEmpty) return; // Pas de config Firebase présente

    // Demande permission
    final settings = await FirebaseMessaging.instance.requestPermission(
      alert: true,
      badge: true,
      sound: true,
    );
    if (settings.authorizationStatus == AuthorizationStatus.denied) return;

    // Init canal local Android
    await _localNotif.initialize(
      const InitializationSettings(
        android: AndroidInitializationSettings('@mipmap/ic_launcher'),
        iOS: DarwinInitializationSettings(),
      ),
    );

    // Handler messages background
    FirebaseMessaging.onBackgroundMessage(_firebaseBackgroundHandler);

    // Message reçu en foreground → notification locale
    FirebaseMessaging.onMessage.listen((message) {
      final notif = message.notification;
      if (notif == null) return;
      _localNotif.show(
        notif.hashCode,
        notif.title,
        notif.body,
        const NotificationDetails(
          android: AndroidNotificationDetails(
            'planify_kids_channel',
            'Planify Kids',
            importance: Importance.high,
            priority: Priority.high,
          ),
        ),
      );
    });

    // Enregistre le token FCM auprès du backend
    await _registerToken(api, memberId);

    // Rafraîchit si le token FCM tourne
    FirebaseMessaging.instance.onTokenRefresh.listen(
      (token) => api.registerFcmToken(memberId, token).ignore(),
    );

    _initialized = true;
  }

  static Future<void> _registerToken(ApiClient api, String memberId) async {
    final token = await FirebaseMessaging.instance.getToken();
    if (token == null) return;
    await api.registerFcmToken(memberId, token);
  }
}
