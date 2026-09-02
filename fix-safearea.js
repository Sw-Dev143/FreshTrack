const fs = require('fs');
const path = require('path');

const screensDir = path.join(__dirname, 'src', 'screens');
const files = fs.readdirSync(screensDir).filter(f => f.endsWith('.tsx'));

for (const file of files) {
  const filePath = path.join(screensDir, file);
  let content = fs.readFileSync(filePath, 'utf8');

  if (content.includes('SafeAreaView') && content.includes("'react-native'")) {
    // Modify standard react-native import, remove SafeAreaView
    let modified = content.replace(/import\s+{([^}]*?)}\s+from\s+['"]react-native['"];/g, (match, p1) => {
      let imports = p1.split(',').map(i => i.trim());
      if (imports.includes('SafeAreaView')) {
        imports = imports.filter(i => i !== 'SafeAreaView');
        if (imports.length === 0) return '';
        return `import { ${imports.join(', ')} } from 'react-native';`;
      }
      return match;
    });

    // Add import for SafeAreaView from react-native-safe-area-context
    if (content.includes('SafeAreaView') && content !== modified) {
       modified = `import { SafeAreaView } from 'react-native-safe-area-context';\n` + modified;
       fs.writeFileSync(filePath, modified);
       console.log('Fixed', file);
    }
  }
}
