import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:geolocator/geolocator.dart';
import 'package:latlong2/latlong.dart';

class LocationPickerResult {
  final double lat;
  final double lng;

  const LocationPickerResult({required this.lat, required this.lng});
}

class LocationPickerScreen extends StatefulWidget {
  const LocationPickerScreen({super.key});

  @override
  State<LocationPickerScreen> createState() => _LocationPickerScreenState();
}

class _LocationPickerScreenState extends State<LocationPickerScreen> {
  final MapController _mapController = MapController();

  LatLng? _selected;
  bool _loadingGps = false;

  // Default location (Jeddah-ish). Change if you want.
  static const LatLng _defaultCenter = LatLng(21.4858, 39.1925);

  Future<void> _useCurrentLocation() async {
    setState(() => _loadingGps = true);

    try {
      // 1) Check service
      final serviceEnabled = await Geolocator.isLocationServiceEnabled();
      if (!serviceEnabled) {
        _show('Location services are OFF. Turn on GPS.');
        return;
      }

      // 2) Check permission
      var permission = await Geolocator.checkPermission();
      if (permission == LocationPermission.denied) {
        permission = await Geolocator.requestPermission();
      }
      if (permission == LocationPermission.denied) {
        _show('Location permission denied.');
        return;
      }
      if (permission == LocationPermission.deniedForever) {
        _show('Location permission is permanently denied. Enable it from settings.');
        return;
      }

      // 3) Get position
      final pos = await Geolocator.getCurrentPosition(
        desiredAccuracy: LocationAccuracy.high,
      );

      final here = LatLng(pos.latitude, pos.longitude);

      setState(() {
        _selected = here;
      });

      _mapController.move(here, 16);
    } catch (e) {
      _show('Failed to get location.');
    } finally {
      if (mounted) setState(() => _loadingGps = false);
    }
  }

  void _show(String msg) {
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(msg)));
  }

  void _confirm() {
    if (_selected == null) {
      _show('Please select a point on the map.');
      return;
    }
    Navigator.pop(
      context,
      LocationPickerResult(lat: _selected!.latitude, lng: _selected!.longitude),
    );
  }

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Pick Location'),
        actions: [
          TextButton(
            onPressed: _confirm,
            child: Text('Done', style: TextStyle(color: cs.primary)),
          ),
        ],
      ),
      body: Stack(
        children: [
          FlutterMap(
            mapController: _mapController,
            options: MapOptions(
              initialCenter: _selected ?? _defaultCenter,
              initialZoom: 12,
              onTap: (tapPosition, latLng) {
                setState(() => _selected = latLng);
              },
            ),
            children: [
              TileLayer(
                // OpenStreetMap tiles (free)
                urlTemplate: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
                userAgentPackageName: 'com.example.phoenixeye_app',
              ),
              if (_selected != null)
                MarkerLayer(
                  markers: [
                    Marker(
                      point: _selected!,
                      width: 50,
                      height: 50,
                      child: const Icon(Icons.location_pin, size: 44),
                    ),
                  ],
                ),
            ],
          ),

          // Bottom controls
          Positioned(
            left: 16,
            right: 16,
            bottom: 16,
            child: Container(
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: const Color(0xFF071A2B).withOpacity(0.92),
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: const Color(0xFF1D4ED8).withOpacity(0.35)),
              ),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(
                    _selected == null
                        ? 'Tap on the map to select a location.'
                        : 'Selected: ${_selected!.latitude.toStringAsFixed(6)}, ${_selected!.longitude.toStringAsFixed(6)}',
                    textAlign: TextAlign.center,
                  ),
                  const SizedBox(height: 10),
                  Row(
                    children: [
                      Expanded(
                        child: ElevatedButton.icon(
                          onPressed: _loadingGps ? null : _useCurrentLocation,
                          icon: _loadingGps
                              ? const SizedBox(
                            width: 18,
                            height: 18,
                            child: CircularProgressIndicator(strokeWidth: 2),
                          )
                              : const Icon(Icons.my_location),
                          label: const Text('Use My Location'),
                        ),
                      ),
                      const SizedBox(width: 10),
                      Expanded(
                        child: ElevatedButton(
                          onPressed: _confirm,
                          child: const Text('Confirm'),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}