import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../features/auth/auth_provider.dart';
import '../l10n/l10n_extensions.dart';

class ApiErrorWidget extends ConsumerWidget {
  final Object error;
  final VoidCallback? onRetry;

  const ApiErrorWidget({super.key, required this.error, this.onRetry});

  bool get _isUnauthorized =>
      error is DioException &&
      (error as DioException).response?.statusCode == 401;

  bool get _isNetworkError =>
      error is DioException &&
      (error as DioException).type == DioExceptionType.connectionError;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final theme = Theme.of(context);

    if (_isUnauthorized) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(Icons.lock_clock_outlined,
                  size: 56, color: theme.colorScheme.error),
              const SizedBox(height: 12),
              Text(
                context.l10n.apiErrorSessionExpiredTitle,
                style: theme.textTheme.titleMedium,
              ),
              const SizedBox(height: 4),
              Text(
                context.l10n.apiErrorSessionExpiredHint,
                style: theme.textTheme.bodySmall?.copyWith(
                  color: theme.colorScheme.onSurfaceVariant,
                ),
              ),
              const SizedBox(height: 20),
              FilledButton.icon(
                icon: const Icon(Icons.login),
                label: Text(context.l10n.apiErrorReconnect),
                onPressed: () =>
                    ref.read(authProvider.notifier).logout(),
              ),
            ],
          ),
        ),
      );
    }

    final message = _isNetworkError
        ? context.l10n.apiErrorNetwork
        : context.l10n.apiErrorGeneric;

    if (!_isNetworkError) {
      debugPrint('ApiErrorWidget: $error');
    }

    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(Icons.wifi_off_outlined,
                size: 56, color: theme.colorScheme.onSurfaceVariant),
            const SizedBox(height: 12),
            Text(message, style: theme.textTheme.titleMedium),
            if (onRetry != null) ...[
              const SizedBox(height: 16),
              OutlinedButton.icon(
                icon: const Icon(Icons.refresh),
                label: Text(context.l10n.apiErrorRetry),
                onPressed: onRetry,
              ),
            ],
          ],
        ),
      ),
    );
  }
}
