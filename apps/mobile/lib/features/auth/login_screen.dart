import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../shared/l10n/l10n_extensions.dart';
import '../../shared/providers/providers.dart';
import 'auth_provider.dart';

class LoginScreen extends ConsumerStatefulWidget {
  const LoginScreen({super.key});

  @override
  ConsumerState<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends ConsumerState<LoginScreen>
    with SingleTickerProviderStateMixin {
  late final TabController _tabs;

  @override
  void initState() {
    super.initState();
    _tabs = TabController(length: 2, vsync: this);
  }

  @override
  void dispose() {
    _tabs.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Scaffold(
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 24),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Text(
                context.l10n.loginTitle,
                style: theme.textTheme.headlineMedium?.copyWith(
                  fontWeight: FontWeight.bold,
                  color: theme.colorScheme.primary,
                ),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 32),
              TabBar(
                controller: _tabs,
                tabs: [
                  Tab(text: context.l10n.loginTabParent, icon: const Icon(Icons.shield_outlined)),
                  Tab(text: context.l10n.loginTabChild, icon: const Icon(Icons.child_care)),
                ],
              ),
              const SizedBox(height: 24),
              SizedBox(
                height: 300,
                child: TabBarView(
                  controller: _tabs,
                  children: const [
                    _ParentLoginForm(),
                    _ChildLoginForm(),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

// ── Formulaire parent ─────────────────────────────────────────────────────────

class _ParentLoginForm extends ConsumerStatefulWidget {
  const _ParentLoginForm();

  @override
  ConsumerState<_ParentLoginForm> createState() => _ParentLoginFormState();
}

class _ParentLoginFormState extends ConsumerState<_ParentLoginForm> {
  final _formKey = GlobalKey<FormState>();
  final _emailCtrl = TextEditingController();
  final _passwordCtrl = TextEditingController();
  bool _obscure = true;

  @override
  void dispose() {
    _emailCtrl.dispose();
    _passwordCtrl.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    await ref
        .read(authProvider.notifier)
        .login(_emailCtrl.text.trim(), _passwordCtrl.text);

    if (!mounted) return;
    final authState = ref.read(authProvider);
    if (authState.hasError) {
      final err = authState.error;
      final bool isNetwork = err is DioException &&
          err.type == DioExceptionType.connectionError;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(
        content: Text(isNetwork
            ? context.l10n.loginNetworkError
            : context.l10n.loginInvalidCredentials),
        backgroundColor: Theme.of(context).colorScheme.error,
      ));
    }
  }

  @override
  Widget build(BuildContext context) {
    final isLoading = ref.watch(authProvider).isLoading;
    return Form(
      key: _formKey,
      child: Column(
        children: [
          TextFormField(
            controller: _emailCtrl,
            keyboardType: TextInputType.emailAddress,
            decoration: InputDecoration(
              labelText: context.l10n.loginEmailLabel,
              prefixIcon: const Icon(Icons.email_outlined),
            ),
            validator: (v) => (v == null || v.isEmpty) ? context.l10n.loginFieldRequired : null,
          ),
          const SizedBox(height: 16),
          TextFormField(
            controller: _passwordCtrl,
            obscureText: _obscure,
            decoration: InputDecoration(
              labelText: context.l10n.loginPasswordLabel,
              prefixIcon: const Icon(Icons.lock_outlined),
              suffixIcon: IconButton(
                icon:
                    Icon(_obscure ? Icons.visibility : Icons.visibility_off),
                onPressed: () => setState(() => _obscure = !_obscure),
              ),
            ),
            validator: (v) => (v == null || v.isEmpty) ? context.l10n.loginFieldRequired : null,
          ),
          const SizedBox(height: 24),
          FilledButton(
            onPressed: isLoading ? null : _submit,
            child: isLoading
                ? const SizedBox(
                    height: 20,
                    width: 20,
                    child: CircularProgressIndicator(strokeWidth: 2),
                  )
                : Text(context.l10n.loginSubmit),
          ),
        ],
      ),
    );
  }
}

// ── Formulaire enfant ─────────────────────────────────────────────────────────

class _ChildLoginForm extends ConsumerStatefulWidget {
  const _ChildLoginForm();

  @override
  ConsumerState<_ChildLoginForm> createState() => _ChildLoginFormState();
}

class _ChildLoginFormState extends ConsumerState<_ChildLoginForm> {
  final _codeCtrl = TextEditingController();
  List<Map<String, dynamic>> _children = [];
  String? _selectedMemberId;
  bool _loadingCode = false;
  String? _codeError;

  final _pinCtrl = TextEditingController();

  @override
  void initState() {
    super.initState();
    _restoreFamilyCode();
  }

  @override
  void dispose() {
    _codeCtrl.dispose();
    _pinCtrl.dispose();
    super.dispose();
  }

  Future<void> _restoreFamilyCode() async {
    final storage = ref.read(secureStorageServiceProvider);
    final saved = await storage.getFamilyCode();
    if (saved == null || saved.isEmpty || !mounted) return;
    _codeCtrl.text = saved;
    await _loadChildren();
  }

  Future<void> _loadChildren() async {
    final code = _codeCtrl.text.trim().toUpperCase();
    if (code.length != 6) {
      setState(() => _codeError = context.l10n.loginCodeRequired);
      return;
    }
    setState(() {
      _loadingCode = true;
      _codeError = null;
      _children = [];
      _selectedMemberId = null;
    });
    try {
      final api = ref.read(apiClientProvider);
      final members = await api.getChildrenByCode(code);
      setState(() => _children = members);
    } on DioException catch (e) {
      final is404 = e.response?.statusCode == 400 ||
          e.response?.statusCode == 401;
      setState(() => _codeError = is404
          ? context.l10n.loginInvalidFamilyCode
          : context.l10n.loginNetworkErrorGeneric);
    } finally {
      setState(() => _loadingCode = false);
    }
  }

  /// PIN exigé pour l'enfant sélectionné. Le parent peut le désactiver
  /// (enfant jeune) ; absent de la réponse API (ancienne version) = exigé.
  bool get _pinRequired {
    final child = _children.where((m) => m['id'] == _selectedMemberId);
    if (child.isEmpty) return true;
    return child.first['pinRequired'] as bool? ?? true;
  }

  bool get _canSubmit =>
      _selectedMemberId != null &&
      (!_pinRequired || _pinCtrl.text.length == 4);

  void _selectChild(String id) {
    setState(() => _selectedMemberId = id);
    // Sans PIN : toucher son prénom suffit pour se connecter.
    if (!_pinRequired) _submit();
  }

  Future<void> _submit() async {
    if (!_canSubmit) return;
    final pinRequired = _pinRequired;
    await ref.read(authProvider.notifier).loginChild(
          _codeCtrl.text.trim().toUpperCase(),
          _selectedMemberId!,
          pinRequired ? _pinCtrl.text : null,
        );

    if (!mounted) return;
    final authState = ref.read(authProvider);
    if (authState.hasError) {
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(
        content: Text(pinRequired
            ? context.l10n.loginPinIncorrect
            : context.l10n.loginChildFailed),
        backgroundColor: Theme.of(context).colorScheme.error,
      ));
    }
  }

  @override
  Widget build(BuildContext context) {
    final isLoading = ref.watch(authProvider).isLoading;
    return Column(
      children: [
        Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Expanded(
              child: TextField(
                controller: _codeCtrl,
                maxLength: 6,
                textCapitalization: TextCapitalization.characters,
                decoration: InputDecoration(
                  labelText: context.l10n.loginFamilyCodeLabel,
                  prefixIcon: const Icon(Icons.home_outlined),
                  errorText: _codeError,
                  counterText: '',
                ),
                onSubmitted: (_) => _loadChildren(),
              ),
            ),
            const SizedBox(width: 8),
            Padding(
              padding: const EdgeInsets.only(top: 4),
              child: _loadingCode
                  ? const SizedBox(
                      height: 48,
                      width: 48,
                      child: Center(
                          child:
                              CircularProgressIndicator(strokeWidth: 2)),
                    )
                  : IconButton.filled(
                      onPressed: _loadChildren,
                      icon: const Icon(Icons.search),
                    ),
            ),
          ],
        ),
        if (_children.isNotEmpty) ...[
          const SizedBox(height: 12),
          Wrap(
            spacing: 8,
            children: _children.map((m) {
              final selected = m['id'] == _selectedMemberId;
              return FilterChip(
                label: Text(m['name'] as String),
                selected: selected,
                onSelected: isLoading
                    ? null
                    : (_) => _selectChild(m['id'] as String),
              );
            }).toList(),
          ),
          if (_pinRequired) ...[
            const SizedBox(height: 12),
            TextField(
              controller: _pinCtrl,
              maxLength: 4,
              obscureText: true,
              keyboardType: TextInputType.number,
              decoration: InputDecoration(
                labelText: context.l10n.loginPinLabel,
                prefixIcon: const Icon(Icons.pin_outlined),
                counterText: '',
              ),
              onChanged: (_) => setState(() {}),
            ),
          ],
          const SizedBox(height: 16),
          FilledButton(
            onPressed: (isLoading || !_canSubmit) ? null : _submit,
            child: isLoading
                ? const SizedBox(
                    height: 20,
                    width: 20,
                    child: CircularProgressIndicator(strokeWidth: 2),
                  )
                : Text(context.l10n.loginSubmit),
          ),
        ],
      ],
    );
  }
}
