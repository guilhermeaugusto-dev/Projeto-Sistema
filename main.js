const { app, BrowserWindow } = require('electron');
const path = require('path');
const { spawn } = require('child_process');

let backendProcess;

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'Front-End', 'src', 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
    icon: path.join(__dirname, 'icons', 'procaj.ico'),
  });

  win.loadFile(path.join(__dirname, 'Front-End', 'src', 'Views', 'login', 'login-cadastro.html'));
}
app.whenReady().then(() => {
  backendProcess = spawn('node', ['./backend/src/server.js'], {
    cwd: __dirname,
    shell: true,
  });

  backendProcess.stdout.on('data', (data) => {
    console.log(`BACKEND: ${data}`);
  });

  backendProcess.stderr.on('data', (data) => {
    console.error(`BACKEND ERROR: ${data}`);
  });

  createWindow();
});

app.on('window-all-closed', () => {
  if (backendProcess) backendProcess.kill();
  if (process.platform !== 'darwin') app.quit();
});
