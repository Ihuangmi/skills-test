const fs = require('fs');
let css = fs.readFileSync('packages/frontend/src/index.css', 'utf-8');
const lines = css.split('\n');

const rangesToRemove = [
  [250, 497], // app-container to sidebar
  [499, 523], // config-about
  [525, 615], // chat-messages
  [617, 825], // chat-main
  [827, 873], // config-panel
  [1107, 1133], // media max-width 1024
  [1154, 1157], // .message-body
  [1159, 1162], // .user-message
  [1193, 1195], // .session-item:hover
  [1197, 1199], // .session-item.active
  [1206, 1227], // .messages-container
  [1240, 1242], // .config-panel
  [1244, 1246], // .chat-sidebar
  [1248, 1250], // .message-input-container
  [1252, 1255], // .messages-container
  [1257, 1259], // .message-item
];

let newLines = [];
for(let i=0; i<lines.length; i++) {
  const lineNum = i + 1;
  let shouldRemove = false;
  for (const [start, end] of rangesToRemove) {
    if (lineNum >= start && lineNum <= end) {
      shouldRemove = true;
      break;
    }
  }
  if (!shouldRemove) {
    newLines.push(lines[i]);
  }
}

fs.writeFileSync('packages/frontend/src/index.css', newLines.join('\n'));
