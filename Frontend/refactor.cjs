const fs = require('fs');
const path = require('path');

function fixImports(dir) {
  try {
    const list = fs.readdirSync(dir);
    list.forEach(file => {
      const fullPath = path.join(dir, file);
      const stat = fs.statSync(fullPath);
      if (stat && stat.isDirectory()) {
        fixImports(fullPath);
      } else if (fullPath.endsWith('.jsx') || fullPath.endsWith('.js')) {
        let content = fs.readFileSync(fullPath, 'utf8');
        let modified = false;
        
        // We only want to prepend '../' if the import is going up the tree.
        // Wait, if it goes to '../components' originally, it was escaping 'src/pages/foo/' 
        // which has depth 3 (src -> pages -> foo).
        // Now it's in 'src/modules/user/pages/foo/', depth 5 (src -> modules -> user -> pages -> foo).
        // So we need to add '../../' to the import path, not just '../', because it moved 2 levels down.
        // Let's verify:
        // Old: src/pages/auth/LoginPage.jsx imports '../../components/Button' 
        // (from auth -> pages -> src -> components -> Button).
        // New: src/modules/user/pages/auth/LoginPage.jsx
        // (from auth -> pages -> user -> modules -> src -> components -> Button)
        // So we need to prepend '../../' to any import starting with '../'.
        
        // Let's just blindly add '../../' to any import starting with '../' that is trying to reach outside of 'pages' or 'layouts'.
        // Wait, what if it's importing a sibling in the same folder? E.g. './styles.css'. That doesn't start with '../'.
        // What if it's importing from a parent folder INSIDE pages? e.g. '../shared/Component'
        // If it imports '../shared/Component', it used to go up to `pages` and down to `shared`.
        // Now it goes up to `pages` and down to `shared`. That STILL WORKS without adding '../../'!
        // Because the relative structure INSIDE `pages` is identical!
        
        // So we ONLY need to add '../../' if the path escapes the `pages` or `layouts` directory entirely.
        // How do we know if it escapes? We can compute the absolute path of the original import, 
        // see if it points outside `src/pages`, and if so, compute the new relative path from the new location.
        
        // Let's do it rigorously.
        const oldFileLocation = fullPath.replace(path.normalize('src/modules/user/'), path.normalize('src/'));
        const oldFileDir = path.dirname(oldFileLocation);
        const newFileDir = path.dirname(fullPath);
        
        content = content.replace(/from\s+["'](\.\.\/.*?|.\/.*?)["']/g, (match, importPath) => {
          // Calculate where the old import was pointing
          const oldTarget = path.resolve(oldFileDir, importPath);
          
          // Check if it was pointing inside src/pages or src/layouts
          const pagesDir = path.resolve('src/pages');
          const layoutsDir = path.resolve('src/layouts');
          
          let newTarget = oldTarget;
          
          // If the target is OUTSIDE both pages and layouts, it means we are importing something from components, hooks, etc.
          // Since those didn't move, the target absolute path is the same.
          // We just need to compute the relative path from the NEW file directory to the old target.
          
          const isInsidePages = oldTarget.startsWith(pagesDir);
          const isInsideLayouts = oldTarget.startsWith(layoutsDir);
          
          if (!isInsidePages && !isInsideLayouts) {
            // Target is outside, so it hasn't moved.
            // Compute relative path from newFileDir to oldTarget
            let newRelPath = path.relative(newFileDir, oldTarget).replace(/\\/g, '/');
            if (!newRelPath.startsWith('.')) {
              newRelPath = './' + newRelPath;
            }
            modified = true;
            return `from "${newRelPath}"`;
          } else {
            // Target was INSIDE pages or layouts.
            // That means the target ALSO moved to src/modules/user/...
            // Since both the file and the target moved together, the relative path remains EXACTLY the same!
            return match; // No modification needed
          }
        });
        
        // Also handle dynamic imports like `import("../../pages/...")`
        content = content.replace(/import\s*\(\s*["'](\.\.\/.*?|.\/.*?)["']\s*\)/g, (match, importPath) => {
          const oldTarget = path.resolve(oldFileDir, importPath);
          const pagesDir = path.resolve('src/pages');
          const layoutsDir = path.resolve('src/layouts');
          
          const isInsidePages = oldTarget.startsWith(pagesDir);
          const isInsideLayouts = oldTarget.startsWith(layoutsDir);
          
          if (!isInsidePages && !isInsideLayouts) {
            let newRelPath = path.relative(newFileDir, oldTarget).replace(/\\/g, '/');
            if (!newRelPath.startsWith('.')) {
              newRelPath = './' + newRelPath;
            }
            modified = true;
            return `import("${newRelPath}")`;
          }
          return match;
        });

        if (modified) {
          fs.writeFileSync(fullPath, content);
          console.log(`Updated ${fullPath}`);
        }
      }
    });
  } catch(e) {
    console.error(e);
  }
}

fixImports('src/modules/user/pages');
fixImports('src/modules/user/layouts');
console.log("Done fixing imports in pages and layouts.");
