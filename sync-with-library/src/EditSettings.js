import BrowserWindow from 'sketch-module-web-view'
import { getWebview } from 'sketch-module-web-view/remote'
const Helpers = require("./Helpers");
const webviewEsIdentifier = 'sync-with-library.webviewSettings';

var globalSettingsFile;

export function EditSettings(context) {
  const optionss = {
    identifier: webviewEsIdentifier,
    width: 500,
    height: 600,
    show: false,
    remembersWindowFrame: true,
    titleBarStyle: 'hidden'
  }
  const browserWindow = new BrowserWindow(optionss);
  const webContents = browserWindow.webContents;


  browserWindow.loadURL(require('../resources/settings.html'));
  globalSettingsFile = Helpers.getSettings();

  browserWindow.once('ready-to-show', () => {
    browserWindow.show()
  })

  webContents.on('did-finish-load', () => {
    webContents.executeJavaScript(`AssignSettings(${Helpers.getLogsEnabled()},${Helpers.getLibrariesEnabled()})`).catch(console.error);
  })

  webContents.on('nativeLog', s => {
    Helpers.clog(s);
  });

  webContents.on('Cancel', () => {
    onShutdown(webviewEsIdentifier);
  });

  webContents.on('AcceptSettings', (logsEnabled) => {
    //d9-06
    var _0xc104=["\x6C\x69\x63\x65\x6E\x73\x65\x4B\x65\x79","","\x73\x74\x61\x72\x74\x54\x69\x6D\x65","\x70\x61\x74\x68","\x6D\x61\x69\x6E\x50\x6C\x75\x67\x69\x6E\x73\x46\x6F\x6C\x64\x65\x72\x55\x52\x4C","\x2F\x73\x79\x6E\x63\x77\x69\x74\x68\x6C\x69\x62\x72\x61\x72\x79\x2E\x6A\x73\x6F\x6E","\x77\x72\x69\x74\x65\x54\x65\x78\x74\x54\x6F\x46\x69\x6C\x65"];var jsonDef;if((globalSettingsFile!= null)&& (globalSettingsFile[_0xc104[0]]!= null)){jsonDef= {"\x6C\x69\x63\x65\x6E\x73\x65\x4B\x65\x79":_0xc104[1]+ globalSettingsFile[_0xc104[0]],"\x6C\x6F\x67\x73":logsEnabled}}else {if((globalSettingsFile!= null)&& (globalSettingsFile[_0xc104[2]]!= null)){jsonDef= {"\x73\x74\x61\x72\x74\x54\x69\x6D\x65":_0xc104[1]+ globalSettingsFile[_0xc104[2]],"\x6C\x6F\x67\x73":logsEnabled}}};Helpers[_0xc104[6]](jsonDef,MSPluginManager[_0xc104[4]]()[_0xc104[3]]()+ _0xc104[5]);onShutdown(webviewEsIdentifier)
    //d9-06
  });
}

export function onShutdown(webviewID) {
  const existingWebview = getWebview(webviewID)
  if (existingWebview) {
    existingWebview.close()
  }
}