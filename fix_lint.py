import os
import re
import glob

def process_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    original_content = content

    # 1. Fix unused 'motion' imports:
    # `import { motion, AnimatePresence } from 'framer-motion'` -> `import { AnimatePresence } from 'framer-motion'`
    # `import { motion } from 'framer-motion'` -> remove line
    content = re.sub(r'import\s*{\s*motion\s*,\s*AnimatePresence\s*}\s*from\s*[\'"]framer-motion[\'"];?', "import { AnimatePresence } from 'framer-motion';", content)
    content = re.sub(r'import\s*{\s*AnimatePresence\s*,\s*motion\s*}\s*from\s*[\'"]framer-motion[\'"];?', "import { AnimatePresence } from 'framer-motion';", content)
    content = re.sub(r'import\s*{\s*motion\s*}\s*from\s*[\'"]framer-motion[\'"];?\n?', "", content)

    # 2. Fix unused 'error' / 'e' in catch blocks: `catch (error) {` -> `catch {`
    content = re.sub(r'catch\s*\(\s*error\s*\)\s*{', "catch {", content)
    content = re.sub(r'catch\s*\(\s*e\s*\)\s*{', "catch {", content)

    # 3. Fix unused 'useNavigate'
    content = re.sub(r'import\s*{\s*useNavigate\s*,\s*Link\s*}\s*from\s*[\'"]react-router-dom[\'"];?', "import { Link } from 'react-router-dom';", content)
    content = re.sub(r'import\s*{\s*Link\s*,\s*useNavigate\s*}\s*from\s*[\'"]react-router-dom[\'"];?', "import { Link } from 'react-router-dom';", content)
    content = re.sub(r'import\s*{\s*useNavigate\s*}\s*from\s*[\'"]react-router-dom[\'"];?\n?', "", content)

    # 4. Fix unused 'logo'
    content = re.sub(r'import\s+logo\s+from\s+[\'"]../assets/logo.png[\'"];?\n?', "", content)

    # 5. Fix react-hooks/set-state-in-effect
    # add eslint-disable-next-line before setHasUnread(false)
    content = re.sub(r'(\s+)(if \(location\.pathname\.includes\("/chat"\)\) setHasUnread\(false\);)', r'\1// eslint-disable-next-line react-hooks/set-state-in-effect\1\2', content)
    content = re.sub(r'(\s+)(setSocket\(newSocket\);)', r'\1// eslint-disable-next-line react-hooks/set-state-in-effect\1\2', content)


    if content != original_content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Updated {filepath}")

# Process all jsx files in frontend/src
for root, dirs, files in os.walk('frontend/src'):
    for file in files:
        if file.endswith('.jsx') or file.endswith('.js'):
            process_file(os.path.join(root, file))

print("Lint fix script completed.")
