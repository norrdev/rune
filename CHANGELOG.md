# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).


## 3.6.1 - 2026-11-03

### Added
- Page for setting a new password after following a password reset link.
- Sign-in page for magic links.

### Fixed
- Password reset and magic links led to the map instead of completing sign-in.
- Password reset and magic link emails sent from the mobile and desktop apps contained unreachable links.
- Users with an unconfirmed email could press "Mark as Visited", which always failed.
- Profile briefly showed "Not Logged In" after a page reload.
- A failed attempt to mark a runestone as visited broke the Profile page.
- Account deletion gave no feedback on failure and kept the user on the Profile page on success.
- A single failed map tile showed a "Failed to load map style" error over a working map.
- Retry did not reload the map after the map style failed to load.
- "No runestones found" flashed while the map was loading.
- The back button could leave the site when a page was opened from an external link.
- Lag when marking runestones as visited.
- Search ran on every keystroke and could show stale results after clearing the query.
- Search query disappeared when reopening the sidebar on mobile.
- Runestones without coordinates were shown off the coast of Africa.
- Mislabeled "Style" and "Material type" fields in runestone details.

### Removed
- Unused code.

## 3.6.0 - 2026-10-05

### Removed
- Removed Google Fonts from the project.

### Changed
- New color scheme for the application.
- Updated site and application icons to match the parchment color palette.

## 3.5.0 - 2026-09-24

### Added
- Loading indicators and visual feedback when marking or unmarking runestones as visited.
- macOS build support and Android APK release build scripts.

### Changed
- Improved visited runestones list view in Profile.
- Updated application icons across all platforms.

## 3.4.0 - 2026-07-25

### Fixed
- Various bug fixes.

## 3.3.0 - 2026-06-12

### Fixed
- Bug with showing visited runestones.

## 3.2.0 - 2026-06-02

### Added
- Ability to export GPX with visited runestones.
- Ability to export GPX with all runestones.

## 3.1.0 - 2026-05-24

### Added
- First Android version.

### Changed
- Updated application icon.

### Fixed
- Bug with map centering on location.

## 3.0.0 - 2026-05-06

### Changed
- Refactoring of the codebase using Tauri.

### Fixed
- Various bug fixes.

## 2.3.0 - 2026-04-17

### Added
- Map controls (location and compass buttons).
- Loading, error, and no data messages.
- Runestone modal.
- Runestone preview pictures.

## 2.0.0 - 2026-01-03

### Added
- Login page.
- Runestones pictures.
- Preparation for mobile app version.

### Changed
- Refactoring of the codebase using React Native and Expo.

### Removed
- Login widget.

## 1.1.0 - 2025-08-10

### Added
- Ability to delete account and data.

## 1.0.0 - 2025-07-29

### Added
- Initial release.
