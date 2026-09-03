const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
  });
}

walkDir('c:/vegah/Frontend/src/modules/admin/pages', function(filePath) {
  if (filePath.endsWith('.jsx')) {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Use regex to find <thead ...> followed by <tr className="..."> or <tr>
    // We only want to replace the FIRST <tr> inside the <thead>.
    
    let newContent = content;
    // We will do a generic replacement:
    const theadRegex = /<thead[^>]*>\s*<tr(\s+className="[^"]*")?>/g;
    newContent = newContent.replace(theadRegex, (match) => {
        return match.replace(/<tr(\s+className="[^"]*")?>/, '<tr className="bg-gray-800 text-sm text-white">');
    });

    if (content !== newContent) {
      fs.writeFileSync(filePath, newContent);
      console.log('Updated', filePath);
    }
  }
});
