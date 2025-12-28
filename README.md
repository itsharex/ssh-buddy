<p align="center">
  <img src="public/logo-rounded.png" alt="SSH Buddy" width="128" height="128" style="border-radius: 20px;">
</p>

<h1 align="center">SSH Buddy</h1>

<p align="center">
  <em>Your friendly SSH companion</em> 🐢
</p>

<p align="center">
  A modern, offline-first SSH configuration manager for macOS and Windows.<br>
  Manage your SSH hosts and keys without the hassle of editing config files manually.
</p>

<p align="center">
  <a href="https://github.com/ssh-buddy/ssh-buddy/releases">Download latest release</a>
</p>

<p align="center">
  <img alt="macOS" src="https://img.shields.io/badge/macOS-supported-1f2937">
  <img alt="Windows" src="https://img.shields.io/badge/Windows-supported-1f2937">
  <img alt="License" src="https://img.shields.io/badge/License-MIT-1f2937">
  <img alt="Release" src="https://img.shields.io/github/v/release/ssh-buddy/ssh-buddy">
</p>

## Why SSH Buddy

SSH Buddy keeps SSH management fast and local. No accounts, no cloud sync, and no hidden config edits. You get a clean UI, smart templates, and safe previews for every change.

## Screenshots

<p align="center">
  <img src="public/screenshots/hosts.png" alt="Hosts view" width="780">
</p>

<p align="center">
  <img src="public/screenshots/security.png" alt="Hosts view" width="780">
</p>


## Features

### Host Management
- **Visual Config Editor** - Add, edit, and remove SSH hosts through an intuitive interface
- **Smart Templates** - Quickly create common configurations (bastion, port forwarding, jump hosts)
- **Tagging & Search** - Organize hosts with tags and filter them instantly
- **Favorites** - Mark frequently used hosts for quick access
- **Validation** - Get helpful warnings before applying changes

### Key Management
- **Key Overview** - View all your SSH keys in one place
- **Generate Keys** - Create new Ed25519 or RSA key pairs
- **Copy Public Keys** - One-click copy for authorized_keys setup

### Security
- **Health Checks** - Scan for insecure key types and weak algorithms
- **Known Hosts Review** - Clean up stale or duplicate entries
- **Algorithm Warnings** - Get notified about deprecated ciphers

### User Experience
- **Onboarding Guide** - Learn SSH basics with friendly explanations
- **Inline Help** - Contextual explanations for every option
- **Change Preview** - Review changes before saving
- **Dark Theme** - Modern, comfortable interface
- **Auto Updates** - Check for and install updates with one click

## Offline-First

SSH Buddy is designed to work completely offline. Your configuration and keys never leave your device:

- No cloud sync
- No remote telemetry
- No account required
- All data stays in `~/.ssh/`

## Installation

### macOS

Download the latest `.dmg` from Releases and drag to Applications.

### Windows

Download the latest `.msi` from Releases and run the installer.

## Development

SSH Buddy is built with:
- [Tauri](https://tauri.app/) - Lightweight native app framework
- [React](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/) - UI framework
- [Tailwind CSS](https://tailwindcss.com/) - Styling
- [Vite](https://vite.dev/) - Build tool

### Prerequisites

- [Node.js](https://nodejs.org/) (v18+)
- [pnpm](https://pnpm.io/)
- [Rust](https://www.rust-lang.org/) (for Tauri)

### Setup

```bash
# Install dependencies
pnpm install

# Start development server
pnpm tauri dev

# Build for production
pnpm tauri build
```

## License

MIT
