const fs = require('fs');
let code = fs.readFileSync('components/design-lab/ProjectStudio.tsx', 'utf8');

code = code.replace(/handleFileAction\(e, file.filePath, 'download'/g, "handleFileAction(e, file.filePath || '', 'download'");
code = code.replace(/handleFileAction\(e, file.filePath, 'copy'/g, "handleFileAction(e, file.filePath || '', 'copy'");
code = code.replace(/handleFileAction\(e, file.filePath, 'open'/g, "handleFileAction(e, file.filePath || '', 'open'");

fs.writeFileSync('components/design-lab/ProjectStudio.tsx', code);
