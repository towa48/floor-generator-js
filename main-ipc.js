const fs = require('fs');
const { ipcMain } = require('electron');

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

