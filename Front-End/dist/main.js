/******/ (() => { // webpackBootstrap
/******/ 	var __webpack_modules__ = ({

/***/ "electron":
/*!***************************!*\
  !*** external "electron" ***!
  \***************************/
/***/ ((module) => {

"use strict";
module.exports = require("electron");

/***/ }),

/***/ "path":
/*!***********************!*\
  !*** external "path" ***!
  \***********************/
/***/ ((module) => {

"use strict";
module.exports = require("path");

/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};
// This entry needs to be wrapped in an IIFE because it needs to be isolated against other modules in the chunk.
(() => {
/*!*********************!*\
  !*** ./src/main.js ***!
  \*********************/
const { app, BrowserWindow, ipcMain } = __webpack_require__(/*! electron */ "electron");
const path = __webpack_require__(/*! path */ "path");

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
})();

module.exports = __webpack_exports__;
/******/ })()
;
//# sourceMappingURL=main.js.map