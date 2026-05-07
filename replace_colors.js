const fs = require('fs');
const path = require('path');

function processDirectory(dirPath) {
    const files = fs.readdirSync(dirPath);
    for (const file of files) {
        const fullPath = path.join(dirPath, file);
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
            processDirectory(fullPath);
        } else if (fullPath.endsWith('.jsx')) {
            let content = fs.readFileSync(fullPath, 'utf8');
            let originalContent = content;
            
            // Replace bg-white and border-white with surface variants
            // Use regex to ensure we don't partially replace classes, although standard classes are fine
            // We need to match things like bg-white, bg-white/50, border-white, border-white/20
            
            content = content.replace(/\bbg-white\b/g, 'bg-surface');
            content = content.replace(/\bborder-white\b/g, 'border-surface');
            
            if (content !== originalContent) {
                fs.writeFileSync(fullPath, content, 'utf8');
                console.log(`Updated: ${fullPath}`);
            }
        }
    }
}

processDirectory(path.join(__dirname, 'frontend/src'));
console.log('Done replacing classes');
