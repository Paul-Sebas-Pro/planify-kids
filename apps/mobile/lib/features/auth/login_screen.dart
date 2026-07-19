import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

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
                'Planify Kids 🌟',
                style: theme.textTheme.headlineMedium?.copyWith(
                  fontWeight: FontWeight.bold,
                  color: theme.colorScheme.primary,
                ),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 32),
              TabBar(
                controller: _tabs,
                tabs: const [
                  Tab(text: 'Parent', icon: Icon(Icons.shield_outlined)),
                  Tab(text: 'Enfant', icon: Icon(Icons.child_care)),
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
            ? 'Serveur inaccessible. Vérifie que l\'API est démarrée.'
            : 'Email ou mot de passe incorrect.'),
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
            decoration: const InputDecoration(
              labelText: 'Email',
              prefixIcon: Icon(Icons.email_outlined),
            ),
            validator: (v) => (v == null || v.isEmpty) ? 'Champ requis' : null,
          ),
          const SizedBox(height: 16),
          TextFormField(
            controller: _passwordCtrl,
            obscureText: _obscure,
            decoration: InputDecoration(
              labelText: 'Mot de passe',
              prefixIcon: const Icon(Icons.lock_outlined),
              suffixIcon: IconButton(
                icon:
                    Icon(_obscure ? Icons.visibility : Icons.visibility_off),
                onPressed: () => setState(() => _obscure = !_obscure),
              ),
            ),
            validator: (v) => (v == null || v.isEmpty) ? 'Champ requis' : null,
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
                : const Text('Se connecter'),
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
      setState(() => _codeError = 'Code de 6 caractères requis');
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
      setState(() =>
          _codeError = is404 ? 'Code famille invalide' : 'Erreur réseau');
    } finally {
      setState(() => _loadingCode = false);
    }
  }

  Future<void> _submit() async {
    if (_selectedMemberId == null || _pinCtrl.text.length != 4) return;
    await ref.read(authProvider.notifier).loginChild(
          _codeCtrl.text.trim().toUpperCase(),
          _selectedMemberId!,
          _pinCtrl.text,
        );

    if (!mounted) return;
    final authState = ref.read(authProvider);
    if (authState.hasError) {
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(
        content: const Text('PIN incorrect.'),
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
                  labelText: 'Code famille',
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
                onSelected: (_) =>
                    setState(() => _selectedMemberId = m['id'] as String),
              );
            }).toList(),
          ),
          const SizedBox(height: 12),
          TextField(
            controller: _pinCtrl,
            maxLength: 4,
            obscureText: true,
            keyboardType: TextInputType.number,
            decoration: const InputDecoration(
              labelText: 'PIN (4 chiffres)',
              prefixIcon: Icon(Icons.pin_outlined),
              counterText: '',
            ),
            onChanged: (_) => setState(() {}),
          ),
          const SizedBox(height: 16),
          FilledButton(
            onPressed: (isLoading ||
                    _selectedMemberId == null ||
                    _pinCtrl.text.length != 4)
                ? null
                : _submit,
            child: isLoading
                ? const SizedBox(
                    height: 20,
                    width: 20,
                    child: CircularProgressIndicator(strokeWidth: 2),
                  )
                : const Text('Se connecter'),
          ),
        ],
      ],
    );
  }
}
