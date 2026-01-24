// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  getToken: () => localStorage.getItem('token'),
  getUsuarioNome: () => localStorage.getItem('usuarioNome'), 
  


  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('usuarioNome'); 
    ipcRenderer.send('do-logout'); 
  },

 
  getUsuario: () => ipcRenderer.invoke('get-usuario')
});