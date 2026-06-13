import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

final appTheme = ThemeData(
  useMaterial3: true,
  colorScheme: ColorScheme.fromSeed(
    seedColor: const Color(0xFF6C63FF),
    brightness: Brightness.light,
  ),
  textTheme: GoogleFonts.nunitoTextTheme().copyWith(
    headlineLarge: GoogleFonts.fredoka(fontWeight: FontWeight.bold),
    headlineMedium: GoogleFonts.fredoka(fontWeight: FontWeight.bold),
    headlineSmall: GoogleFonts.fredoka(fontWeight: FontWeight.w600),
    titleLarge: GoogleFonts.fredoka(fontWeight: FontWeight.w600),
  ),
  cardTheme: CardThemeData(
    elevation: 0,
    shape: RoundedRectangleBorder(
      borderRadius: BorderRadius.circular(16),
      side: BorderSide(color: Colors.grey.shade200),
    ),
  ),
  inputDecorationTheme: InputDecorationTheme(
    border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
    filled: true,
  ),
  filledButtonTheme: FilledButtonThemeData(
    style: FilledButton.styleFrom(
      minimumSize: const Size.fromHeight(48),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
    ),
  ),
);
