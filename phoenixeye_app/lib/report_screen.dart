import 'dart:io';
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:geolocator/geolocator.dart';

import 'thank_you_screen.dart';
import 'location_picker_screen.dart';

class ReportScreen extends StatefulWidget {
  const ReportScreen({super.key});

  @override
  State<ReportScreen> createState() => _ReportScreenState();
}

class _ReportScreenState extends State<ReportScreen> {
  final _formKey = GlobalKey<FormState>();

  // Animal type
  final List<String> _animals = [
    'Cat',
    'Dog',
    'Camel',
    'Bird',
    'Rabbit',
    'Goat',
    'Other'
  ];
  String? _selectedAnimal;
  final TextEditingController _otherAnimalCtrl = TextEditingController();

  // Image
  File? _imageFile;
  final ImagePicker _picker = ImagePicker();

  // Location
  bool _shareLocation = true;
  double? _lat;
  double? _lng;
  String? _locationLabel;

  bool _gettingGps = false;

  @override
  void dispose() {
    _otherAnimalCtrl.dispose();
    super.dispose();
  }

  void _showSnack(String msg) {
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(msg)));
  }

  // ---------- Image ----------
  Future<void> _pickImageFromGallery() async {
    final XFile? file = await _picker.pickImage(source: ImageSource.gallery);
    if (file != null) setState(() => _imageFile = File(file.path));
  }

  Future<void> _pickImageFromCamera() async {
    final XFile? file = await _picker.pickImage(source: ImageSource.camera);
    if (file != null) setState(() => _imageFile = File(file.path));
  }

  // ---------- Location ----------
  Future<void> _getCurrentLocation() async {
    setState(() => _gettingGps = true);

    try {
      final enabled = await Geolocator.isLocationServiceEnabled();
      if (!enabled) {
        _showSnack('Location services are OFF. Turn on GPS and try again.');
        return;
      }

      LocationPermission perm = await Geolocator.checkPermission();
      if (perm == LocationPermission.denied) {
        perm = await Geolocator.requestPermission();
      }

      if (perm == LocationPermission.denied) {
        _showSnack('Location permission denied.');
        return;
      }

      if (perm == LocationPermission.deniedForever) {
        _showSnack('Location permission is permanently denied. Enable it in Settings.');
        return;
      }

      final pos = await Geolocator.getCurrentPosition(
        desiredAccuracy: LocationAccuracy.high,
      );

      setState(() {
        _lat = pos.latitude;
        _lng = pos.longitude;
        _locationLabel = 'Captured current location';
      });
    } catch (_) {
      _showSnack('Failed to get location.');
    } finally {
      if (mounted) setState(() => _gettingGps = false);
    }
  }

  Future<void> _pickOnMap() async {
    final result = await Navigator.push(
      context,
      MaterialPageRoute(builder: (_) => const LocationPickerScreen()),
    );

    if (result is LocationPickerResult) {
      setState(() {
        _lat = result.lat;
        _lng = result.lng;
        _locationLabel = 'Pinned on map';
      });
    }
  }

  // ---------- Submit ----------
  void _submit() {
    if (!_formKey.currentState!.validate()) return;

    if (_imageFile == null) {
      _showSnack('Please add a photo (camera or gallery).');
      return;
    }

    if (_shareLocation && (_lat == null || _lng == null)) {
      _showSnack('Please select location (GPS or map).');
      return;
    }

    Navigator.push(
      context,
      MaterialPageRoute(builder: (_) => const ThankYouScreen()),
    );
  }

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final showOtherField = _selectedAnimal == 'Other';

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
          // Dark overlay
          Positioned.fill(
            child: Container(color: Colors.black.withOpacity(0.65)),
          ),

          SafeArea(
            child: Column(
              children: [
                // Top bar
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                  child: Row(
                    children: [
                      IconButton(
                        onPressed: () => Navigator.pop(context),
                        icon: const Icon(Icons.arrow_back),
                      ),
                      const Expanded(
                        child: Text(
                          'Report Roadkill',
                          textAlign: TextAlign.center,
                          style: TextStyle(fontSize: 18, fontWeight: FontWeight.w700),
                        ),
                      ),
                      const SizedBox(width: 48), // balances back button space
                    ],
                  ),
                ),

                Expanded(
                  child: SingleChildScrollView(
                    padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 10),
                    child: ConstrainedBox(
                      constraints: const BoxConstraints(maxWidth: 520),
                      child: Container(
                        padding: const EdgeInsets.all(18),
                        decoration: BoxDecoration(
                          color: const Color(0xFF071A2B).withOpacity(0.92),
                          borderRadius: BorderRadius.circular(18),
                          border: Border.all(
                            color: const Color(0xFF1D4ED8).withOpacity(0.35),
                          ),
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
                            crossAxisAlignment: CrossAxisAlignment.stretch,
                            children: [
                              // Animal dropdown
                              DropdownButtonFormField<String>(
                                value: _selectedAnimal,
                                items: _animals
                                    .map((a) => DropdownMenuItem(value: a, child: Text(a)))
                                    .toList(),
                                onChanged: (v) {
                                  setState(() {
                                    _selectedAnimal = v;
                                    if (v != 'Other') _otherAnimalCtrl.clear();
                                  });
                                },
                                decoration: const InputDecoration(
                                  labelText: 'Animal Type',
                                ),
                                validator: (v) => (v == null) ? 'Please select animal type' : null,
                              ),

                              const SizedBox(height: 12),

                              if (showOtherField)
                                TextFormField(
                                  controller: _otherAnimalCtrl,
                                  decoration: const InputDecoration(
                                    labelText: 'Type other animal',
                                  ),
                                  validator: (v) {
                                    if (_selectedAnimal == 'Other' &&
                                        (v == null || v.trim().isEmpty)) {
                                      return 'Please enter the animal type';
                                    }
                                    return null;
                                  },
                                ),

                              const SizedBox(height: 18),

                              // Photo
                              Text('Photo', style: Theme.of(context).textTheme.titleMedium),
                              const SizedBox(height: 8),

                              Container(
                                height: 180,
                                decoration: BoxDecoration(
                                  border: Border.all(color: Colors.white24),
                                  borderRadius: BorderRadius.circular(12),
                                ),
                                child: _imageFile == null
                                    ? const Center(child: Text('No image selected'))
                                    : ClipRRect(
                                  borderRadius: BorderRadius.circular(12),
                                  child: Image.file(_imageFile!, fit: BoxFit.cover),
                                ),
                              ),

                              const SizedBox(height: 10),

                              Row(
                                children: [
                                  Expanded(
                                    child: ElevatedButton.icon(
                                      onPressed: _pickImageFromCamera,
                                      icon: const Icon(Icons.camera_alt),
                                      label: const Text('Camera'),
                                    ),
                                  ),
                                  const SizedBox(width: 10),
                                  Expanded(
                                    child: ElevatedButton.icon(
                                      onPressed: _pickImageFromGallery,
                                      icon: const Icon(Icons.photo_library),
                                      label: const Text('Gallery'),
                                    ),
                                  ),
                                ],
                              ),

                              const SizedBox(height: 18),

                              // Location section + toggle
                              Row(
                                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                children: [
                                  Text('Location', style: Theme.of(context).textTheme.titleMedium),
                                  Row(
                                    children: [
                                      Text(
                                        _shareLocation ? 'Share' : 'Manual',
                                        style: TextStyle(color: cs.onSurfaceVariant),
                                      ),
                                      Switch(
                                        value: _shareLocation,
                                        onChanged: (v) {
                                          setState(() {
                                            _shareLocation = v;
                                            if (!v) {
                                              _lat = null;
                                              _lng = null;
                                              _locationLabel = 'Location tracking disabled';
                                            } else {
                                              _locationLabel = null;
                                            }
                                          });
                                        },
                                      ),
                                    ],
                                  ),
                                ],
                              ),

                              const SizedBox(height: 8),

                              if (_shareLocation) ...[
                                ElevatedButton.icon(
                                  onPressed: _gettingGps ? null : _getCurrentLocation,
                                  icon: _gettingGps
                                      ? const SizedBox(
                                    width: 18,
                                    height: 18,
                                    child: CircularProgressIndicator(strokeWidth: 2),
                                  )
                                      : const Icon(Icons.my_location),
                                  label: const Text('Use my current location'),
                                ),
                                const SizedBox(height: 10),
                                OutlinedButton.icon(
                                  onPressed: _pickOnMap,
                                  icon: const Icon(Icons.map),
                                  label: const Text('Pick on map'),
                                ),
                              ] else ...[
                                Text(
                                  'You chose manual mode. We will not capture GPS.',
                                  style: TextStyle(color: cs.onSurfaceVariant),
                                ),
                              ],

                              const SizedBox(height: 10),

                              if (_locationLabel != null)
                                Text('Status: $_locationLabel', style: TextStyle(color: cs.onSurfaceVariant)),
                              if (_lat != null && _lng != null)
                                Text('Lat: ${_lat!.toStringAsFixed(6)}, Lng: ${_lng!.toStringAsFixed(6)}'),

                              const SizedBox(height: 22),

                              // Submit
                              FilledButton(
                                onPressed: _submit,
                                child: const Padding(
                                  padding: EdgeInsets.symmetric(vertical: 12),
                                  child: Text('Submit Report'),
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}