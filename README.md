# Custom CSS Utilities IntelliSense

🎨 **Intelligent autocomplete and preview for custom CSS utility classes**

Transform your CSS development workflow with smart IntelliSense that understands your custom utility classes. Get Tailwind-like autocomplete for your own CSS files!

## ✨ Features

### 🚀 **Smart Autocomplete**
- Intelligent suggestions while typing class names
- Fuzzy search (type "btn-pr" to find "button-primary")  
- Category-based grouping (Layout, Typography, Colors, etc.)
- Usage count display for popular classes

### 🔍 **Rich Hover Preview**
- Complete CSS properties on hover
- Source file location with clickable links
- Category and usage statistics
- Documentation comments support

### 📍 **Go to Definition**
- Jump to CSS class definition with `F12`
- Peek definition with `Alt+F12`
- Find all references with `Shift+F12`

### 🎯 **Language Support**
- **JavaScript/TypeScript** (JSX, TSX)
- **HTML** templates
- **Vue** single-file components
- **React** projects

### 📁 **File Format Support**
- CSS
- SCSS/Sass
- Less
- PostCSS

## 🚀 Quick Start

1. **Install** the extension from VS Code Marketplace
2. **Open** a workspace with CSS/SCSS files
3. **Start typing** class names in your HTML/JSX files
4. **Enjoy** intelligent autocomplete!

### Example CSS File
```css
/**
 * @category Layout  
 * @description Centers content horizontally and vertically
 */
.flex-center {
  display: flex;
  justify-content: center;
  align-items: center;
}

.text-primary {
  color: #007bff;
  font-weight: 600;
}
```

### Usage in HTML/JSX
```html
<div class="flex-center">  <!-- Autocomplete suggestions appear here -->
  <h1 class="text-primary">Hello World</h1>
</div>
```

## ⚙️ Configuration

Customize the extension through VS Code settings:

```json
{
  "customCSSIntelliSense.enable": true,
  "customCSSIntelliSense.include": ["**/*.{css,scss,sass,less}"],
  "customCSSIntelliSense.exclude": ["**/node_modules/**", "**/dist/**"],
  "customCSSIntelliSense.languages": [
    "javascript", 
    "typescript", 
    "javascriptreact", 
    "typescriptreact", 
    "html", 
    "vue"
  ],
  "customCSSIntelliSense.showUsageCount": true,
  "customCSSIntelliSense.showCategory": true,
  "customCSSIntelliSense.maxSuggestions": 50,
  "customCSSIntelliSense.fuzzySearch": true
}
```

## 🎨 Documentation Comments

Enhance your CSS with documentation comments:

```css
/**
 * @category Layout
 * @description Flexible container for responsive layouts
 * @example <div class="flex-container">Content</div>
 */
.flex-container {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
}
```

## 📋 Commands

Access these commands via Command Palette (`Cmd/Ctrl + Shift + P`):

- **`Custom CSS: Rescan Files`** - Refresh CSS class index
- **`Custom CSS: Clear Cache`** - Clear cached classes  
- **`Custom CSS: Show Statistics`** - View indexing stats
- **`Custom CSS: Find Unused Classes`** - Coming soon!

## 🔥 Why Use This Extension?

### Before
```javascript
// No autocomplete, manual CSS file checking
<div className="flex-center-items"> {/* Typo! Should be flex-center */}
```

### After  
```javascript
// Smart suggestions with preview
<div className="flex-center"> {/* ✅ Autocomplete + hover preview */}
```

## 📊 Performance

- **Lightning fast** indexing with smart caching
- **Real-time updates** when CSS files change
- **Memory efficient** with LRU cache
- **Works with large codebases** (1000+ classes)

## 🛠️ Technical Details

- **Parser**: PostCSS-based for accuracy
- **Languages**: TypeScript for reliability  
- **Caching**: Intelligent LRU cache system
- **File Watching**: Real-time CSS file monitoring

## 🤝 Contributing

Found a bug or have a feature request? 

- 🐛 [Report Issues](https://github.com/your-username/custom-css-intellisense/issues)
- 💡 [Suggest Features](https://github.com/your-username/custom-css-intellisense/discussions)
- 🔧 [Contribute Code](https://github.com/your-username/custom-css-intellisense/pulls)

## 📝 License

MIT License - see [LICENSE](LICENSE) file

## 🙏 Acknowledgments

Inspired by the excellent developer experience of Tailwind CSS IntelliSense, adapted for custom utility classes.

---

**⭐ If this extension helps your workflow, please leave a review!**

*Happy coding! 🚀*