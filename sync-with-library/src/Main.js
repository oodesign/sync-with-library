const MergeSymbols = require("./MergeDuplicateSymbols");
const MergeLayerStyles = require("./MergeLayerStyles");
const MergeTextStyles = require("./MergeTextStyles");
const Settings = require("./EditSettings");

const Helpers = require("./Helpers");
import BrowserWindow from 'sketch-module-web-view';
import { getWebview } from 'sketch-module-web-view/remote';
import UI from 'sketch/ui'
const webviewRegIdentifier = 'sync-with-library.webviewReg';

var globalRemainingDays = 0;
var globalIsInTrial = false;
var globalIsExpired = false;
var globalIsOver = false;

var globalCommand;


export function MergeDuplicateSymbols(context) {
  globalCommand = Helpers.commands.mergeduplicatesymbols;
  onValidate(context);
};

export function MergeDuplicateTextStyles(context) {
  globalCommand = Helpers.commands.mergeduplicatetextstyles;
  onValidate(context);
};

export function MergeDuplicateLayerStyles(context) {
  globalCommand = Helpers.commands.mergeduplicatelayerstyles;
  onValidate(context);
};

export function EditSettings(context) {
  globalCommand = Helpers.commands.editsettings;
  onValidate(context);
};



//d9-01
var _0x1647 = ["\x61\x70\x70", "\x76\x61\x6C\x53\x74\x61\x74\x75\x73", "\x6E\x6F\x43\x6F\x6E", "\x6F\x76\x65\x72", "\x6E\x6F\x77", "\x61\x62\x73", "\x66\x6C\x6F\x6F\x72"]; function onValidate(_0x8a0ax2) { var _0x8a0ax3 = Helpers.ExiGuthrie(); if ((_0x8a0ax3 == Helpers[_0x1647[1]][_0x1647[0]]) || (_0x8a0ax3 == Helpers[_0x1647[1]][_0x1647[2]])) { triggerMethod(_0x8a0ax2) } else { if (_0x8a0ax3 == Helpers[_0x1647[1]][_0x1647[3]]) { globalIsOver = true; showRegistration(_0x8a0ax2) } else { var _0x8a0ax4 = Helpers.IsInTrial(); var _0x8a0ax5 = new Date(parseInt(_0x8a0ax4)); if (_0x8a0ax4 != null) { var _0x8a0ax6 = _0x8a0ax5 - Date[_0x1647[4]](); var _0x8a0ax7 = Math[_0x1647[6]](Math[_0x1647[5]](_0x8a0ax6 / (1000 * 3600 * 24))); globalRemainingDays = 7 - _0x8a0ax7; if (globalRemainingDays > 0) { globalIsInTrial = true } else { globalIsExpired = true }; showRegistration(_0x8a0ax2) } else { showRegistration(_0x8a0ax2) } } } }
//d9-01

export function triggerMethod(context) {

  Helpers.LoadSettings();

  switch (globalCommand) {
    case Helpers.commands.mergeduplicatesymbols:
      MergeSymbols.MergeDuplicateSymbols(context);
      break;
    case Helpers.commands.mergeduplicatetextstyles:
      MergeTextStyles.MergeDuplicateTextStyles(context);
      break;
    case Helpers.commands.mergeduplicatelayerstyles:
      MergeLayerStyles.MergeDuplicateLayerStyles(context);
      break;
    case Helpers.commands.editsettings:
      Settings.EditSettings(context);
      break;
  }
}



export function showRegistration(context) {

  var options = {
    identifier: webviewRegIdentifier,
    width: 1200,
    height: 700,
    show: false,
    titleBarStyle: 'hidden'
  }

  var regWindow = new BrowserWindow(options)

  const webContentsReg = regWindow.webContents;

  //d9-02
  var _0xff74 = ["\x72\x65\x61\x64\x79\x2D\x74\x6F\x2D\x73\x68\x6F\x77", "\x65\x72\x72\x6F\x72", "\x63\x61\x74\x63\x68", "\x53\x65\x74\x54\x72\x69\x61\x6C\x4D\x6F\x64\x65\x28", "\x73\x74\x72\x69\x6E\x67\x69\x66\x79", "\x29", "\x65\x78\x65\x63\x75\x74\x65\x4A\x61\x76\x61\x53\x63\x72\x69\x70\x74", "\x53\x65\x74\x45\x78\x70\x69\x72\x65\x64\x4D\x6F\x64\x65\x28\x29", "\x53\x65\x74\x4F\x76\x65\x72\x4D\x6F\x64\x65\x28\x29", "\x73\x68\x6F\x77", "\x6F\x6E\x63\x65", "\x64\x69\x64\x2D\x66\x69\x6E\x69\x73\x68\x2D\x6C\x6F\x61\x64", "\x6F\x6E", "\x52\x65\x67\x69\x73\x74\x65\x72\x4B\x65\x79", "\x61\x70\x70", "\x76\x61\x6C\x53\x74\x61\x74\x75\x73", "", "\x70\x61\x74\x68", "\x6D\x61\x69\x6E\x50\x6C\x75\x67\x69\x6E\x73\x46\x6F\x6C\x64\x65\x72\x55\x52\x4C", "\x2F\x73\x79\x6E\x63\x77\x69\x74\x68\x6C\x69\x62\x72\x61\x72\x79\x2E\x6A\x73\x6F\x6E", "\x77\x72\x69\x74\x65\x54\x65\x78\x74\x54\x6F\x46\x69\x6C\x65", "\x53\x68\x6F\x77\x52\x65\x67\x69\x73\x74\x72\x61\x74\x69\x6F\x6E\x43\x6F\x6D\x70\x6C\x65\x74\x65\x28\x29", "\x6F\x76\x65\x72", "\x53\x65\x74\x4F\x76\x65\x72\x4D\x6F\x64\x65\x49\x6E\x52\x65\x67\x28\x29", "\x53\x68\x6F\x77\x52\x65\x67\x69\x73\x74\x72\x61\x74\x69\x6F\x6E\x46\x61\x69\x6C\x28\x29", "\x53\x74\x61\x72\x74\x54\x72\x69\x61\x6C", "\x6E\x6F\x77", "\x53\x68\x6F\x77\x54\x72\x69\x61\x6C\x53\x74\x61\x72\x74\x65\x64\x28\x29", "\x43\x6F\x6E\x74\x69\x6E\x75\x65\x54\x72\x69\x61\x6C", "\x4C\x65\x74\x73\x53\x74\x61\x72\x74\x54\x72\x69\x61\x6C", "\x4C\x65\x74\x73\x53\x74\x61\x72\x74"]; regWindow[_0xff74[10]](_0xff74[0], () => { if (globalIsInTrial) { webContentsReg[_0xff74[6]](`${_0xff74[3]}${JSON[_0xff74[4]](globalRemainingDays)}${_0xff74[5]}`)[_0xff74[2]](console[_0xff74[1]]) }; if (globalIsExpired) { webContentsReg[_0xff74[6]](`${_0xff74[7]}`)[_0xff74[2]](console[_0xff74[1]]) }; if (globalIsOver) { webContentsReg[_0xff74[6]](`${_0xff74[8]}`)[_0xff74[2]](console[_0xff74[1]]) }; regWindow[_0xff74[9]]() }); webContentsReg[_0xff74[12]](_0xff74[11], () => { if (globalIsInTrial) { webContentsReg[_0xff74[6]](`${_0xff74[3]}${JSON[_0xff74[4]](globalRemainingDays)}${_0xff74[5]}`)[_0xff74[2]](console[_0xff74[1]]) }; if (globalIsExpired) { webContentsReg[_0xff74[6]](`${_0xff74[7]}`)[_0xff74[2]](console[_0xff74[1]]) }; if (globalIsOver) { webContentsReg[_0xff74[6]](`${_0xff74[8]}`)[_0xff74[2]](console[_0xff74[1]]) } }); webContentsReg[_0xff74[12]](_0xff74[13], (_0x5234x1) => { var _0x5234x2 = Helpers.Guthrie(_0x5234x1, true); if (_0x5234x2 == Helpers[_0xff74[15]][_0xff74[14]]) { var _0x5234x3 = { "\x6C\x69\x63\x65\x6E\x73\x65\x4B\x65\x79": _0xff74[16] + _0x5234x1 }; Helpers[_0xff74[20]](_0x5234x3, MSPluginManager[_0xff74[18]]()[_0xff74[17]]() + _0xff74[19]); webContentsReg[_0xff74[6]](`${_0xff74[21]}`)[_0xff74[2]](console[_0xff74[1]]) } else { if (_0x5234x2 == Helpers[_0xff74[15]][_0xff74[22]]) { webContentsReg[_0xff74[6]](`${_0xff74[8]}`)[_0xff74[2]](console[_0xff74[1]]); webContentsReg[_0xff74[6]](`${_0xff74[23]}`)[_0xff74[2]](console[_0xff74[1]]) } else { webContentsReg[_0xff74[6]](`${_0xff74[24]}`)[_0xff74[2]](console[_0xff74[1]]) } } }); webContentsReg[_0xff74[12]](_0xff74[25], (_0x5234x1) => { var _0x5234x4 = { "\x73\x74\x61\x72\x74\x54\x69\x6D\x65": _0xff74[16] + Date[_0xff74[26]]() }; Helpers[_0xff74[20]](_0x5234x4, MSPluginManager[_0xff74[18]]()[_0xff74[17]]() + _0xff74[19]); webContentsReg[_0xff74[6]](`${_0xff74[27]}`)[_0xff74[2]](console[_0xff74[1]]) }); webContentsReg[_0xff74[12]](_0xff74[28], () => { onShutdown(webviewRegIdentifier); triggerMethod(context) }); webContentsReg[_0xff74[12]](_0xff74[29], () => { globalIsInTrial = true; globalRemainingDays = 7; onShutdown(webviewRegIdentifier); triggerMethod(context) }); webContentsReg[_0xff74[12]](_0xff74[30], () => { globalIsInTrial = false; onShutdown(webviewRegIdentifier); triggerMethod(context) })
  //d9-02

  webContentsReg.on('nativeLog', s => {
    Helpers.cog(s);
  })

  webContentsReg.on('OpenPluginWeb', s => {
    NSWorkspace.sharedWorkspace().openURL(NSURL.URLWithString("http://gum.co/syncwithlibrary"));
  })

  webContentsReg.on('Cancel', () => {
    onShutdown(webviewRegIdentifier);
  });

  regWindow.loadURL(require('../resources/register.html'));
}


export function onShutdown(webviewID) {
  const existingWebview = getWebview(webviewID)
  if (existingWebview) {
    existingWebview.close()
  }
}