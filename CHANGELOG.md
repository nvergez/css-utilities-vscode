# Change Log

## [0.1.0] - 2025-09-07

### 🎉 Initial Release

#### ✨ Features
- **Smart Autocomplete** - Intelligent CSS class suggestions with fuzzy search
- **Rich Hover Preview** - Complete CSS properties display on hover
- **Go to Definition** - Jump to CSS class definitions (F12, Ctrl+Click)
- **Multi-language Support** - JavaScript, TypeScript, HTML, Vue, React
- **File Format Support** - CSS, SCSS, Sass, Less, PostCSS
- **Real-time Indexing** - Automatic CSS file scanning with file watcher
- **Category Grouping** - Layout, Typography, Background, Spacing, etc.
- **Documentation Comments** - Support for `@category` and `@description` tags

#### ⚙️ Configuration
- Customizable file inclusion/exclusion patterns
- Language support configuration
- Display options for usage count and categories
- Fuzzy search toggle
- Maximum suggestions limit

#### 📋 Commands
- `Custom CSS: Rescan Files` - Refresh CSS class index
- `Custom CSS: Clear Cache` - Clear cached classes
- `Custom CSS: Show Statistics` - View indexing statistics

#### 🛠️ Technical
- PostCSS-based parser for accuracy
- Intelligent LRU caching system
- Memory efficient with smart indexing
- TypeScript for reliability
- Supports large codebases (1000+ classes)