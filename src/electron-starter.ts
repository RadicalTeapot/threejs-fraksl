import { app, BrowserWindow } from 'electron';

function createWindow () {
  // Create the browser window.
    let win: BrowserWindow = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            nodeIntegration: true,
        }
    });

    // and load the index.html of the app.
    win.loadURL('http://localhost:8181');
}

app.on('ready', createWindow)
