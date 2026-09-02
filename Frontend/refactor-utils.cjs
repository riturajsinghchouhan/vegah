const fs = require('fs');
const path = require('path');

const srcDir = path.resolve('src');
const oldUtilsDir = path.resolve('src/utils');
const newUserUtilsDir = path.resolve('src/modules/user/utils');

// 1. Move files
if (fs.existsSync(oldUtilsDir)) {
  const files = fs.readdirSync(oldUtilsDir);
  files.forEach(file => {
    const oldPath = path.join(oldUtilsDir, file);
    const newPath = path.join(newUserUtilsDir, file);
    if (!fs.statSync(oldPath).isDirectory()) {
      fs.renameSync(oldPath, newPath);
      console.log(`Moved ${file} to user module utils`);
    }
  });
}

// Helper to get all files in src
function getAllFiles(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(getAllFiles(file));
    } else if (file.endsWith('.jsx') || file.endsWith('.js')) {
      results.push(file);
    }
  });
  return results;
}

const allFiles = getAllFiles(srcDir);

// 2. Update imports in all files
allFiles.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let modified = false;

  const fileDir = path.dirname(file);

  content = content.replace(/from\s+["'](\.\.?\/.*?)["']/g, (match, importPath) => {
    const targetAbsPath = path.resolve(fileDir, importPath);

    if (targetAbsPath.startsWith(oldUtilsDir)) {
      const fileName = path.basename(targetAbsPath);
      const newTargetAbsPath = path.join(newUserUtilsDir, fileName);
      
      let newRelPath = path.relative(fileDir, newTargetAbsPath).replace(/\\/g, '/');
      if (!newRelPath.startsWith('.')) {
        newRelPath = './' + newRelPath;
      }
      
      modified = true;
      return `from "${newRelPath}"`;
    }
    return match;
  });

  if (modified) {
    fs.writeFileSync(file, content);
    console.log(`Updated util imports in ${path.relative(srcDir, file)}`);
  }
});

console.log("Util refactoring complete.");
