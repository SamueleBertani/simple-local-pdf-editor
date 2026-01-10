# Local PDF Editor

A privacy-focused, client-side PDF editor that runs entirely in your browser. No uploads, no servers, no tracking - your documents never leave your device.

## Features

- **Handwriting / Signatures** - Add natural-looking handwritten text and signatures
- **Text Annotations** - Insert typed text with customizable fonts and colors
- **Image Placement** - Add images and photos to your PDFs
- **Stamps** - Apply pre-made stamps or custom images
- **Cover Tool** - Redact or cover sensitive information with rectangles
- **Export Options**:
  - Save PDF (high quality)
  - Minimize PDF (with compression options)
  - Scanner Export (PNG with realistic scan effects)
- **Undo/Redo** - Full history support for all editing operations
- **Dark Mode** - Easy on the eyes
- **PWA Support** - Install as a standalone app, works offline
- **Responsive Design** - Works on desktop and mobile devices

## Privacy First

This editor processes everything locally in your browser using:
- [pdf.js](https://mozilla.github.io/pdf.js/) for PDF rendering
- [pdf-lib](https://pdf-lib.js.org/) for PDF manipulation
- [Fabric.js](http://fabricjs.com/) for canvas-based annotations

**Your PDFs are never uploaded anywhere.**

## Tech Stack

- React 19
- TypeScript
- Vite
- Tailwind CSS
- Zustand (state management)
- PWA with Workbox

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/local-pdf-editor.git
cd local-pdf-editor

# Install dependencies
npm install

# Start development server
npm run dev
```

### Build for Production

```bash
npm run build
npm run preview
```

## Project Structure

```
src/
├── components/       # React components
│   ├── canvas/       # Canvas overlay handlers
│   ├── layout/       # Sidebar, toolbar layouts
│   ├── modals/       # Export and settings modals
│   ├── toolbar/      # Tool buttons and settings
│   ├── ui/           # Reusable UI components
│   ├── upload/       # File upload dropzone
│   └── viewer/       # PDF viewer components
├── core/             # Core business logic
│   ├── handwriting/  # Handwriting generation
│   ├── image/        # Image processing (scanner effect)
│   └── pdf/          # PDF export and compression
├── hooks/            # Custom React hooks
│   ├── export/       # Export-related hooks
│   └── shortcuts/    # Keyboard shortcut hooks
├── store/            # Zustand stores
├── types/            # TypeScript type definitions
├── utils/            # Utility functions
└── constants/        # App constants
```

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `S` | Select tool |
| `H` | Handwriting tool |
| `T` | Text tool |
| `R` | Rectangle/Cover tool |
| `I` | Image tool |
| `P` | Stamp tool |
| `Ctrl/Cmd + Z` | Undo |
| `Ctrl/Cmd + Shift + Z` | Redo |
| `Ctrl/Cmd + C` | Copy |
| `Ctrl/Cmd + V` | Paste |
| `Delete/Backspace` | Delete selected |
| `Ctrl/Cmd + S` | Quick save PDF |
| `Ctrl/Cmd + Shift + S` | Minimize PDF |
| `Ctrl/Cmd + Shift + E` | Scanner export |

## License

MIT License - see [LICENSE](LICENSE) for details.

## Contributing

Contributions are welcome! Please read [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.
