FONT FILES REQUIRED
===================

This project uses IBM Plex Sans (English) and IBM Plex Sans Arabic (Arabic).
Download the font families and drop the .ttf files into the folders below,
using EXACTLY these filenames (empty placeholder files with these same names
already exist so the app builds without errors before you add the real fonts).

Download source: https://fonts.google.com/specimen/IBM+Plex+Sans
                  https://fonts.google.com/specimen/IBM+Plex+Sans+Arabic

src/assets/fonts/IBM-Plex-Sans/
  IBMPlexSans-Regular.ttf
  IBMPlexSans-Medium.ttf
  IBMPlexSans-SemiBold.ttf
  IBMPlexSans-Bold.ttf

src/assets/fonts/IBM-Plex-Sans-Arabic/
  IBMPlexSansArabic-Regular.ttf
  IBMPlexSansArabic-Medium.ttf
  IBMPlexSansArabic-SemiBold.ttf
  IBMPlexSansArabic-Bold.ttf

Once the real files are pasted in (overwriting the placeholders), no code
changes are needed — the @font-face rules in src/index.css already point
to these exact paths and filenames.
