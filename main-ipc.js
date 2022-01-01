const fs = require('fs');
const { ipcMain, dialog } = require('electron');

const filepath = './public/example.yml';

ipcMain.on('load-example', (event, arg) => {
    fs.readFile(filepath, 'utf-8', (err, data) => {
        if (err) {
            event.reply('example-load-error', err.message);
            console.log(err);
            return;
        }
        event.reply('example-loaded', data);
    });
});

ipcMain.on('open', async (event, arg) => {
    const result = await dialog.showOpenDialog({
        properties: ['openFile'],
        filters: [{
            name: 'Floor generator saves',
            extensions: ['yml']
        }]
    });

    if (!result.filePaths || !result.filePaths.length)
        return;

    const file = result.filePaths[0];
    fs.readFile(file, 'utf-8', (err, data) => {
        if (err) {
            event.reply('save-load-error', err.message);
            console.log(err);
            return;
        }
        event.reply('save-loaded', data);
    });
});

ipcMain.on('save', async (event, arg) => {
    const result = await dialog.showSaveDialog({
        properties: [],
        filters: [{
            name: 'Floor generator saves',
            extensions: ['yml']
        }]
    });

    if (!result.filePath)
        return;

    const file = result.filePath;
    fs.writeFile(file, arg, (err) => {
        if (err) {
            event.reply('save-error', err.message);
            console.log(err);
            return;
        }
        event.reply('saved');
    });
});