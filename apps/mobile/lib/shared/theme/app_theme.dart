import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

const _primary = Color(0xFF4CAF50);
const _accent = Color(0xFFFF9800);
const _background = Color(0xFFF5F7FB);

final appTheme = ThemeData(
  useMaterial3: true,
  colorScheme: ColorScheme.fromSeed(
    seedColor: _primary,
    brightness: Brightness.light,
  ),
  scaffoldBackgroundColor: _background,
  textTheme: GoogleFonts.nunitoTextTheme().copyWith(
    headlineLarge: GoogleFonts.fredoka(fontWeight: FontWeight.bold),
    headlineMedium: GoogleFonts.fredoka(fontWeight: FontWeight.bold),
    headlineSmall: GoogleFonts.fredoka(fontWeight: FontWeight.w600),
    titleLarge: GoogleFonts.fredoka(fontWeight: FontWeight.w600),
    titleMedium: GoogleFonts.fredoka(fontWeight: FontWeight.w500),
    // Baloo 2 réservé aux scores/points
    displaySmall: GoogleFonts.baloo2(
      fontWeight: FontWeight.bold,
      color: _accent,
    ),
  ),
  cardTheme: CardThemeData(
    elevation: 0,
    color: Colors.white,
    shape: RoundedRectangleBorder(
      borderRadius: BorderRadius.circular(20),
      side: BorderSide(color: Colors.grey.shade100),
    ),
  ),
  inputDecorationTheme: InputDecorationTheme(
    border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
    filled: true,
    fillColor: Colors.white,
  ),
  filledButtonTheme: FilledButtonThemeData(
    style: FilledButton.styleFrom(
      minimumSize: const Size.fromHeight(48),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
    ),
  ),
  navigationBarTheme: NavigationBarThemeData(
    backgroundColor: Colors.white,
    surfaceTintColor: Colors.transparent,
    elevation: 0,
    shadowColor: Colors.black12,
    indicatorColor: _primary.withValues(alpha: 0.12),
    labelTextStyle: WidgetStateProperty.resolveWith((states) {
      final selected = states.contains(WidgetState.selected);
      return GoogleFonts.nunito(
        fontSize: 11,
        fontWeight: selected ? FontWeight.w700 : FontWeight.w500,
        color: selected ? _primary : Colors.grey.shade500,
      );
    }),
    iconTheme: WidgetStateProperty.resolveWith((states) {
      final selected = states.contains(WidgetState.selected);
      return IconThemeData(
        color: selected ? _primary : Colors.grey.shade400,
      );
    }),
  ),
  appBarTheme: AppBarTheme(
    backgroundColor: Colors.white,
    surfaceTintColor: Colors.transparent,
    elevation: 0,
    shadowColor: Colors.black12,
    scrolledUnderElevation: 1,
    titleTextStyle: GoogleFonts.fredoka(
      fontSize: 20,
      fontWeight: FontWeight.w600,
      color: const Color(0xFF1A1A2E),
    ),
    iconTheme: const IconThemeData(color: Color(0xFF1A1A2E)),
  ),
);
