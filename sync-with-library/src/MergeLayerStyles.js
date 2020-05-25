import BrowserWindow from 'sketch-module-web-view'
import { getWebview } from 'sketch-module-web-view/remote'
const Helpers = require("./Helpers");

const webviewMDLSIdentifier = 'merge-duplicatelayerstyles.webview'

var checkingAlsoLibraries = false;
var currentSelectedStyles = [];


function getLayerPredicate(style) {
  var predicate;
  if (style.originalStyle != null)
    predicate = NSPredicate.predicateWithFormat("(sharedStyle.objectID == %@) OR (sharedStyle.objectID == %@)", style.originalStyle.localShareID(), style.originalStyle.remoteShareID());
  else
    predicate = NSPredicate.predicateWithFormat("sharedStyle.objectID == %@", style.layerStyle.objectID());

  return predicate;
}

function MergeLayerStyles(context, styleToKeep) {
  var layersChangedCounter = 0;
  var overridesChangedCounter = 0;


  Helpers.clog("Merging styles. Keep '" + currentSelectedStyles[styleToKeep].name + "'");

  var layers = Helpers.getAllLayers(context);
  var layersWithOtherStyles = NSMutableArray.array();

  currentSelectedStyles.forEach(function (style) {
    if (style.layerStyle != currentSelectedStyles[styleToKeep].layerStyle) {
      var predicate = getLayerPredicate(style),
        layersWithSameStyle = layers.filteredArrayUsingPredicate(predicate),
        instanceLoop = layersWithSameStyle.objectEnumerator(),
        instance;

      while (instance = instanceLoop.nextObject()) {
        layersWithOtherStyles.addObject(instance);
      }

      if (style.correlativeStyles != null) {
        var countercorrelative = 0;
        for (var i = 0; i < style.correlativeStyles.length; i++) {
          var predicateCorrelative = NSPredicate.predicateWithFormat("sharedStyle.objectID == %@", style.correlativeStyles[i].localObject().objectID()),
            layersWithSameStyleCorrelative = layers.filteredArrayUsingPredicate(predicateCorrelative),
            instanceLoopCorrelative = layersWithSameStyle.objectEnumerator(),
            instanceCorrelative;

          while (instanceCorrelative = instanceLoopCorrelative.nextObject()) {
            layersWithOtherStyles.addObject(instanceCorrelative);
            countercorrelative++;
          }
        }
      }
    }
  });

  var foreignStyleReference, foreignStyle;
  if (currentSelectedStyles[styleToKeep].foreign && currentSelectedStyles[styleToKeep].library != null) {
    foreignStyleReference = MSShareableObjectReference.referenceForShareableObject_inLibrary(currentSelectedStyles[styleToKeep].layerStyle, currentSelectedStyles[styleToKeep].library);
    foreignStyle = AppController.sharedInstance().librariesController().importShareableObjectReference_intoDocument(foreignStyleReference, context.document.documentData());
  }

  layersWithOtherStyles.forEach(function (layer) {
    if (currentSelectedStyles[styleToKeep].foreign && currentSelectedStyles[styleToKeep].library != null) {
      layer.setSharedStyle(foreignStyle.localSharedStyle());
    }
    else {
      layer.setSharedStyle(currentSelectedStyles[styleToKeep].layerStyle);
    }

    layersChangedCounter++;
  });

  overridesChangedCounter += UpdateLayerOverrides(currentSelectedStyles, styleToKeep, context, foreignStyle);

  currentSelectedStyles.forEach(function (style) {
    if (style.layerStyle != currentSelectedStyles[styleToKeep].layerStyle) {

      if (style.foreign && (style.library == null)) {
        if (context.document.documentData().foreignLayerStyles().indexOf(style.originalStyle) > -1) {
          context.document.documentData().foreignLayerStyles().removeObject(style.originalStyle);
        }

        if (style.correlativeStyles != null) {
          for (var i = 0; i < style.correlativeStyles.length; i++) {
            if (context.document.documentData().foreignLayerStyles().indexOf(style.correlativeStyles[i]) > -1) {
              context.document.documentData().foreignLayerStyles().removeObject(style.correlativeStyles[i]);
            }
          }
        }
      }
      else {
        context.document.documentData().layerStyles().removeSharedStyle(style.layerStyle);
      }
    }
  });

  return [layersChangedCounter, overridesChangedCounter];
}

function UpdateLayerOverrides(currentSelectedStyles, styleToKeep, context, foreignStyle) {

  var overridesChangedCounter = 0;
  var allSymbolInstances = NSMutableArray.array();
  context.document.documentData().allSymbols().forEach(function (symbolMaster) {
    var instances = Helpers.getSymbolInstances(context, symbolMaster),
      instanceLoop = instances.objectEnumerator(),
      instance;

    while (instance = instanceLoop.nextObject()) {
      allSymbolInstances.addObject(instance);
    }
  });

  allSymbolInstances.forEach(function (symbolInstance) {
    var overridePointsToReplace = [];
    var overrides = symbolInstance.overrides();

    symbolInstance.availableOverrides().forEach(function (availableOverride) {

      var allOverridesThatWeShouldReplace = [];

      getAllLayerOverridesThatWeShouldReplace(availableOverride, currentSelectedStyles, styleToKeep, allOverridesThatWeShouldReplace, symbolInstance, 0, context);

      for (var i = 0; i < allOverridesThatWeShouldReplace.length; i++) {
        if (currentSelectedStyles[styleToKeep].foreign && currentSelectedStyles[styleToKeep].library != null) {
          symbolInstance.setValue_forOverridePoint_(foreignStyle.localSharedStyle().objectID(), allOverridesThatWeShouldReplace[i].overridePoint());
        }
        else {
          symbolInstance.setValue_forOverridePoint_(currentSelectedStyles[styleToKeep].layerStyle.objectID(), allOverridesThatWeShouldReplace[i].overridePoint());
        }

        overridesChangedCounter++;
      }
    });
  });

  return overridesChangedCounter;
}

function getAllLayerOverridesThatWeShouldReplace(availableOverride, currentSelectedStyles, styleToKeep, allOverridesThatWeShouldReplace, symbolInstance, level, context) {
  var verbose = false;

  if (verbose) console.log(symbolInstance.name() + "(" + level + ")" + ": ---   Name:" + availableOverride.overridePoint().layerName() + "    -    CV:" + availableOverride.currentValue() + "   -   DV:" + availableOverride.defaultValue());

  if (availableOverride.children() == null) {
    currentSelectedStyles.forEach(function (style) {
      if (style.layerStyle != currentSelectedStyles[styleToKeep].layerStyle) {
        if (Helpers.isString(availableOverride.currentValue())) {
          if ((availableOverride.currentValue().toString().indexOf(style.layerStyle.objectID()) > -1)
            || (style.originalStyle != null && (availableOverride.currentValue().toString().indexOf(style.originalStyle.localShareID()) > -1))
            || (style.originalStyle != null && (availableOverride.currentValue().toString().indexOf(style.originalStyle.remoteShareID()) > -1))
          ) {
            if (verbose) console.log("Adding it");
            allOverridesThatWeShouldReplace.push(availableOverride);
          }

          if (style.correlativeStyles != null) {

            if (verbose) console.log("Checking overrides: " + style.name + " has " + style.correlativeStyles.length + " correlative styles.")
            for (var i = 0; i < style.correlativeStyles.length; i++) {
              if ((availableOverride.currentValue().toString().indexOf(style.correlativeStyles[i].localObject().objectID()) > -1)
                || (style.originalStyle != null && (availableOverride.currentValue().toString().indexOf(style.correlativeStyles[i].localShareID()) > -1))
                || (style.originalStyle != null && (availableOverride.currentValue().toString().indexOf(style.correlativeStyles[i].remoteShareID()) > -1))
              ) {
                if (verbose) console.log("Adding it - correlative");
                allOverridesThatWeShouldReplace.push(availableOverride);
              }
            }
          }
        }
      }
    });
  }
  else {
    if (verbose) console.log("Digging deeper because it has " + availableOverride.children().length + " children");
    availableOverride.children().forEach(function (child) {
      getAllLayerOverridesThatWeShouldReplace(child, currentSelectedStyles, styleToKeep, allOverridesThatWeShouldReplace, symbolInstance, level + 1, context)
    });
  }
}

function getDuplicateLayerStyles(context, allStyles) {

  var layerStylesNames = [];
  var layerDuplicatedStylesNames = [];

  for (var i = 0; i < allStyles.length; i++) {
    var style = allStyles[i];

    if (Helpers.getIndexOf(style.name, layerStylesNames) > -1) {
      if (Helpers.getIndexOf(style.name, layerDuplicatedStylesNames) < 0) {
        layerDuplicatedStylesNames.push(style.name);
      }
    }

    layerStylesNames.push(style.name);
  }

  return layerDuplicatedStylesNames;

}


export function MergeDuplicateLayerStyles(context) {

  Helpers.clog("----- Merge duplicate layer styles -----");

  const options = {
    identifier: webviewMDLSIdentifier,
    width: 1200,
    height: 700,
    show: false,
    remembersWindowFrame: true,
    titleBarStyle: 'hidden'
  }
  const browserWindow = new BrowserWindow(options);
  const webContents = browserWindow.webContents;

  var onlyDuplicatedLayerStyles;
  var mergeSession = [];
  CalculateDuplicates(Helpers.getLibrariesEnabled());

  if (onlyDuplicatedLayerStyles.length > 0) {
    browserWindow.loadURL(require('../resources/mergeduplicatelayerstyles.html'));
  }
  else {
    context.document.showMessage("Looks like there are no layer styles with the same name.");
    onShutdown(webviewMDLSIdentifier);
  }

  function CalculateDuplicates(includeLibraries) {
    Helpers.clog("Finding duplicate layer styles. Including libraries:" + includeLibraries);
    onlyDuplicatedLayerStyles = Helpers.getDuplicateLayerStyles(context, includeLibraries);
    if (onlyDuplicatedLayerStyles.length > 0) {
      Helpers.GetSpecificLayerStyleData(context, onlyDuplicatedLayerStyles, 0);
      mergeSession = [];
      for (var i = 0; i < onlyDuplicatedLayerStyles.length; i++) {
        mergeSession.push({
          "layerStyleWithDuplicates": onlyDuplicatedLayerStyles[i],
          "selectedIndex": -1,
          "isUnchecked": false,
          "isProcessed": (i == 0) ? true : false
        });
      }
    }
  }

  browserWindow.once('ready-to-show', () => {
    browserWindow.show()
  })

  webContents.on('did-finish-load', () => {
    Helpers.clog("Webview loaded");
    webContents.executeJavaScript(`DrawStylesList(${JSON.stringify(mergeSession)}, ${Helpers.getLibrariesEnabled()})`).catch(console.error);
  })

  webContents.on('nativeLog', s => {
    Helpers.clog(s);
  });

  webContents.on('Cancel', () => {
    onShutdown(webviewMDLSIdentifier);
  });

  webContents.on('RecalculateDuplicates', (includeLibraries) => {
    Helpers.clog("Recalculating duplicates");
    CalculateDuplicates(includeLibraries);
    webContents.executeJavaScript(`DrawStylesList(${JSON.stringify(mergeSession)})`).catch(console.error);
  });

  webContents.on('GetSelectedStyleData', (index) => {
    Helpers.GetSpecificLayerStyleData(context, onlyDuplicatedLayerStyles, index);
    webContents.executeJavaScript(`ReDrawAfterGettingData(${JSON.stringify(mergeSession[index].layerStyleWithDuplicates)},${index})`).catch(console.error);
  });

  webContents.on('ExecuteMerge', (editedMergeSession) => {
    Helpers.clog("Executing Merge");

    var duplicatesSolved = 0;
    var mergedStyles = 0;
    var affectedLayers = [0, 0];

    for (var i = 0; i < editedMergeSession.length; i++) {
      Helpers.clog("-- Merging " + mergeSession[i].layerStyleWithDuplicates.name);
      if (!editedMergeSession[i].isUnchecked && editedMergeSession[i].selectedIndex >= 0) {
        mergeSession[i].selectedIndex = editedMergeSession[i].selectedIndex;
        currentSelectedStyles = [];
        for (var j = 0; j < mergeSession[i].layerStyleWithDuplicates.duplicates.length; j++) {
          currentSelectedStyles.push(mergeSession[i].layerStyleWithDuplicates.duplicates[j]);
          mergedStyles++;
        }

        var results = MergeLayerStyles(context, editedMergeSession[i].selectedIndex);
        affectedLayers[0] += results[0];
        affectedLayers[1] += results[1];

        duplicatesSolved++;
      }
    }

    onShutdown(webviewMDLSIdentifier);
    if (duplicatesSolved <= 0) {
      Helpers.clog("No styles were merged");
      context.document.showMessage("No styles were merged");
    }
    else {
      Helpers.clog("Wpdated " + affectedLayers[0] + " text layers and " + affectedLayers[1] + " overrides.");
      context.document.showMessage("Yo ho! We updated " + affectedLayers[0] + " layers and " + affectedLayers[1] + " overrides.");
    }

  });
};

