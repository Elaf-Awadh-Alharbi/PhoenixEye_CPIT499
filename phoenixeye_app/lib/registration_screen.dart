import 'dart:async';
import 'package:flutter/material.dart';
import 'report_screen.dart';

class RegistrationScreen extends StatefulWidget {
  const RegistrationScreen({super.key});

  @override
  State<RegistrationScreen> createState() => _RegistrationScreenState();
}

class _RegistrationScreenState extends State<RegistrationScreen> {
  final _formKey = GlobalKey<FormState>();

  final _firstName = TextEditingController();
  final _lastName = TextEditingController();
  final _phone = TextEditingController();
  final _otp = TextEditingController();
  final _password = TextEditingController();

  bool _isSendingCode = false;
  bool _codeSent = false;

  bool _isVerifyingCode = false;
  bool _codeVerified = false;

  bool _isCreatingAccount = false;

  @override
  void dispose() {
    _firstName.dispose();
    _lastName.dispose();
    _phone.dispose();
    _otp.dispose();
    _password.dispose();
    super.dispose();
  }

  String? _required(String? v, String label) {
    if (v == null || v.trim().isEmpty) return '$label is required';
    return null;
  }

  String? _validatePhone(String? v) {
    if (v == null || v.trim().isEmpty) return 'Phone number is required';
    final cleaned = v.replaceAll(RegExp(r'[^0-9+]'), '');
    if (cleaned.length < 9) return 'Enter a valid phone number';
    return null;
  }

  String? _validatePassword(String? v) {
    if (v == null || v.isEmpty) return 'Password is required';
    if (v.length < 8) return 'Password must be at least 8 characters';
    return null;
  }

  void _toast(String msg) {
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(msg)));
  }

  // --- PLACEHOLDER (we will connect to backend later) ---
  Future<void> _sendOtp() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _isSendingCode = true);
    try {
      await Future<void>.delayed(const Duration(seconds: 1));
      setState(() {
        _codeSent = true;
        _codeVerified = false;
      });
      _toast('Verification code sent.');
    } catch (_) {
      _toast('Failed to send code.');
    } finally {
      if (mounted) setState(() => _isSendingCode = false);
    }
  }

  Future<void> _verifyOtp() async {
    if (!_codeSent) {
      _toast('Send the code first.');
      return;
    }
    if (_otp.text.trim().isEmpty) {
      _toast('Enter the verification code.');
      return;
    }

    setState(() => _isVerifyingCode = true);
    try {
      await Future<void>.delayed(const Duration(seconds: 1));
      setState(() => _codeVerified = true);
      _toast('Phone verified ✅');
    } catch (_) {
      _toast('Invalid code.');
    } finally {
      if (mounted) setState(() => _isVerifyingCode = false);
    }
  }

  Future<void> _createAccount() async {
    if (!_formKey.currentState!.validate()) return;

    if (!_codeVerified) {
      _toast('Verify your phone first.');
      return;
    }

    setState(() => _isCreatingAccount = true);
    try {
      await Future<void>.delayed(const Duration(seconds: 1));
      _toast('Account created successfully!');


      if (!mounted) return;
      Navigator.pushReplacement(
        context,
        MaterialPageRoute(builder: (_) => const ReportScreen()),
      );
    } catch (_) {
      _toast('Registration failed.');
    } finally {
      if (mounted) setState(() => _isCreatingAccount = false);
    }
  }
  // ------------------------------------------------------

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;

    return Scaffold(
      body: Stack(
        children: [
          // Background
          Positioned.fill(
            child: Image.asset(
              'assets/images/bg.png',
              fit: BoxFit.cover,
            ),
          ),

          // Dark overlay for readability
          Positioned.fill(
            child: Container(color: Colors.black.withOpacity(0.65)),
          ),

          SafeArea(
            child: Center(
              child: SingleChildScrollView(
                padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 18),
                child: ConstrainedBox(
                  constraints: const BoxConstraints(maxWidth: 420),
                  child: Container(
                    padding: const EdgeInsets.all(18),
                    decoration: BoxDecoration(
                      color: const Color(0xFF071A2B).withOpacity(0.92),
                      borderRadius: BorderRadius.circular(18),
                      border: Border.all(color: const Color(0xFF1D4ED8).withOpacity(0.35)),
                      boxShadow: [
                        BoxShadow(
                          blurRadius: 18,
                          spreadRadius: 2,
                          color: Colors.black.withOpacity(0.25),
                        ),
                      ],
                    ),
                    child: Form(
                      key: _formKey,
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Image.asset(
                            'assets/images/logo.jpeg',
                            width: 92,
                            height: 92,
                            fit: BoxFit.contain,
                          ),
                          const SizedBox(height: 10),
                          const Text(
                            'Create Account',
                            style: TextStyle(fontSize: 20, fontWeight: FontWeight.w800),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            'PhoenixEye Citizen App',
                            style: TextStyle(color: cs.onSurfaceVariant),
                          ),
                          const SizedBox(height: 16),

                          Row(
                            children: [
                              Expanded(
                                child: TextFormField(
                                  controller: _firstName,
                                  textInputAction: TextInputAction.next,
                                  decoration: const InputDecoration(labelText: 'First name'),
                                  validator: (v) => _required(v, 'First name'),
                                ),
                              ),
                              const SizedBox(width: 12),
                              Expanded(
                                child: TextFormField(
                                  controller: _lastName,
                                  textInputAction: TextInputAction.next,
                                  decoration: const InputDecoration(labelText: 'Last name'),
                                  validator: (v) => _required(v, 'Last name'),
                                ),
                              ),
                            ],
                          ),

                          const SizedBox(height: 12),

                          TextFormField(
                            controller: _phone,
                            keyboardType: TextInputType.phone,
                            textInputAction: TextInputAction.next,
                            decoration: const InputDecoration(
                              labelText: 'Phone number',
                              hintText: '05xxxxxxxx or +9665xxxxxxxx',
                              prefixIcon: Icon(Icons.phone),
                            ),
                            validator: _validatePhone,
                          ),

                          const SizedBox(height: 12),

                          SizedBox(
                            width: double.infinity,
                            child: FilledButton.icon(
                              onPressed: _isSendingCode ? null : _sendOtp,
                              icon: _isSendingCode
                                  ? const SizedBox(
                                width: 18,
                                height: 18,
                                child: CircularProgressIndicator(strokeWidth: 2),
                              )
                                  : const Icon(Icons.sms),
                              label: Text(_codeSent ? 'Resend Code' : 'Send Code'),
                            ),
                          ),

                          const SizedBox(height: 12),

                          Row(
                            children: [
                              Expanded(
                                child: TextField(
                                  controller: _otp,
                                  keyboardType: TextInputType.number,
                                  decoration: InputDecoration(
                                    labelText: 'Verification code',
                                    prefixIcon: const Icon(Icons.verified),
                                    suffixIcon: _codeVerified
                                        ? const Icon(Icons.check_circle, color: Colors.green)
                                        : null,
                                  ),
                                ),
                              ),
                              const SizedBox(width: 12),
                              ElevatedButton(
                                onPressed: (_isVerifyingCode || !_codeSent) ? null : _verifyOtp,
                                child: _isVerifyingCode
                                    ? const SizedBox(
                                  width: 18,
                                  height: 18,
                                  child: CircularProgressIndicator(strokeWidth: 2),
                                )
                                    : const Text('Verify'),
                              ),
                            ],
                          ),

                          const SizedBox(height: 12),

                          TextFormField(
                            controller: _password,
                            obscureText: true,
                            decoration: const InputDecoration(
                              labelText: 'Password',
                              prefixIcon: Icon(Icons.lock),
                            ),
                            validator: _validatePassword,
                          ),

                          const SizedBox(height: 16),

                          SizedBox(
                            width: double.infinity,
                            child: FilledButton(
                              onPressed: _isCreatingAccount ? null : _createAccount,
                              child: _isCreatingAccount
                                  ? const SizedBox(
                                width: 18,
                                height: 18,
                                child: CircularProgressIndicator(strokeWidth: 2),
                              )
                                  : const Text('Create Account'),
                            ),
                          ),

                          const SizedBox(height: 10),

                          Text(
                            _codeVerified
                                ? 'Phone verified ✅ You can create your account.'
                                : 'Verify your phone number to complete registration.',
                            style: TextStyle(
                              color: _codeVerified ? Colors.green : cs.onSurfaceVariant,
                            ),
                            textAlign: TextAlign.center,
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}