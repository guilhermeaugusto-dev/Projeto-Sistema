const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');

function createWindow() {
  console.log('Criando janela...');

  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  mainWindow.on('closed', () => {
    console.log('Janela fechada');
  });

  mainWindow.loadFile(path.join(__dirname, 'Views', 'login', 'login-cadastro.html'))
    .then(() => {
      console.log('HTML carregado com sucesso');
      mainWindow.webContents.openDevTools();
    })
    .catch(err => {
      console.error('Erro ao carregar HTML:', err);
    });
}

app.whenReady().then(() => {
  console.log('App está pronto');
  ipcMain.on('logout', () => {
    console.log('MAIN: Recebido comando de logout...');
    app.quit();
  });

  createWindow();
});

app.on('window-all-closed', () => {
  console.log('Todas as janelas foram fechadas');
  if (process.platform !== 'darwin') app.quit();
});