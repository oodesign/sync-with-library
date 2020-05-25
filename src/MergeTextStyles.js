import BrowserWindow from 'sketch-module-web-view'
import { getWebview } from 'sketch-module-web-view/remote'
const Helpers = require("./Helpers");

const webviewMDTSIdentifier = 'merge-duplicatetextstyles.webview'

var checkingAlsoLibraries = false;
var currentSelectedStyles = [];


function getTextPredicate(style) {
  var predicate;
  if (style.originalStyle != null)
    predicate = NSPredicate.predicateWithFormat("(sharedStyle.objectID == %@) OR (sharedStyle.objectID == %@)", style.originalStyle.localShareID(), style.originalStyle.remoteShareID());
  else
    predicate = NSPredicate.predicateWithFormat("sharedStyle.objectID == %@", style.textStyle.objectID());

  return predicate;
}

function MergeTextStyles(context, styleToKeep) {
  var layersChangedCounter = 0;
  var overridesChangedCounter = 0;

  Helpers.clog("Merging styles. Keep '" + currentSelectedStyles[styleToKeep].name + "'");

  var layers = Helpers.getAllTextLayers(context);
  var layersWithOtherStyles = NSMutableArray.array();
  currentSelectedStyles.forEach(function (style) {
    if (style.textStyle != currentSelectedStyles[styleToKeep].textStyle) {
      var predicate = getTextPredicate(style),
        layersWithSameStyle = layers.filteredArrayUsingPredicate(predicate),
        instanceLoop = layersWithSameStyle.objectEnumerator(),
        instance;

      while (instance = instanceLoop.nextObject()) {
        layersWithOtherStyles.addObject(instance);
      }

      if (style.correlativeStyles != null) {
        //console.log(style.name+" has "+style.correlativeStyles.length+" correlative styles.")
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

        //console.log(countercorrelative+" layers had a correlative style applied");
      }
    }
  });

  var foreignStyleReference, foreignStyle;
  if (currentSelectedStyles[styleToKeep].foreign && currentSelectedStyles[styleToKeep].library != null) {
    foreignStyleReference = MSShareableObjectReference.referenceForShareableObject_inLibrary(currentSelectedStyles[styleToKeep].textStyle, currentSelectedStyles[styleToKeep].library);
    foreignStyle = AppController.sharedInstance().librariesController().importShareableObjectReference_intoDocument(foreignStyleReference, context.document.documentData());
  }

  layersWithOtherStyles.forEach(function (layer) {
    if (currentSelectedStyles[styleToKeep].foreign && currentSelectedStyles[styleToKeep].library != null) {
      layer.setSharedStyle(foreignStyle.localSharedStyle());
    }
    else {
      layer.setSharedStyle(currentSelectedStyles[styleToKeep].textStyle);
    }

    layersChangedCounter++;
  });



  //overridesChangedCounter += LogTextOverrides(currentSelectedStyles, styleToKeep, context);
  overridesChangedCounter += UpdateTextOverrides(currentSelectedStyles, styleToKeep, context, foreignStyle);

  currentSelectedStyles.forEach(function (style) {
    if (style.textStyle != currentSelectedStyles[styleToKeep].textStyle) {

      if (style.foreign && (style.library == null)) {
        //console.log("You're trying to remove a library style");
        if (context.document.documentData().foreignTextStyles().indexOf(style.originalStyle) > -1) {
          context.document.documentData().foreignTextStyles().removeObject(style.originalStyle);
          //console.log("Removed style: "+style.name);
        }

        if (style.correlativeStyles != null) {
          for (var i = 0; i < style.correlativeStyles.length; i++) {
            if (context.document.documentData().foreignTextStyles().indexOf(style.correlativeStyles[i]) > -1) {
              context.document.documentData().foreignTextStyles().removeObject(style.correlativeStyles[i]);
              //console.log("Removed correlative");
            }
          }
        }
      }
      else {
        context.document.documentData().layerTextStyles().removeSharedStyle(style.textStyle);
        //console.log("Removed style: "+style.name);
      }
    }
  });

  return [layersChangedCounter, overridesChangedCounter];
}

function getAllTextOverridesThatWeShouldReplace(availableOverride, currentSelectedStyles, styleToKeep, allOverridesThatWeShouldReplace, symbolInstance, level, context) {

  //console.log(symbolInstance.name()+"("+level+")"+": ---   Name:"+availableOverride.overridePoint().layerName()+"    -    CV:"+availableOverride.currentValue()+"   -   DV:"+availableOverride.defaultValue());

  if (availableOverride.children() == null) {
    currentSelectedStyles.forEach(function (style) {
      if (style.textStyle != currentSelectedStyles[styleToKeep].textStyle) {
        if (Helpers.isString(availableOverride.currentValue())) {
          if ((availableOverride.currentValue().toString().indexOf(style.textStyle.objectID()) > -1)
            || (style.originalStyle != null && (availableOverride.currentValue().toString().indexOf(style.originalStyle.localShareID()) > -1))
            || (style.originalStyle != null && (availableOverride.currentValue().toString().indexOf(style.originalStyle.remoteShareID()) > -1))
          ) {
            //console.log("Adding it");
            allOverridesThatWeShouldReplace.push(availableOverride);
          }

          if (style.correlativeStyles != null) {

            //console.log("Checking overrides: "+style.name+" has "+style.correlativeStyles.length+" correlative styles.")
            for (var i = 0; i < style.correlativeStyles.length; i++) {
              if ((availableOverride.currentValue().toString().indexOf(style.correlativeStyles[i].localObject().objectID()) > -1)
                || (style.originalStyle != null && (availableOverride.currentValue().toString().indexOf(style.correlativeStyles[i].localShareID()) > -1))
                || (style.originalStyle != null && (availableOverride.currentValue().toString().indexOf(style.correlativeStyles[i].remoteShareID()) > -1))
              ) {
                //console.log("Adding it - correlative");
                allOverridesThatWeShouldReplace.push(availableOverride);
              }
            }
          }
        }
      }
    });
  }
  else {
    //console.log("Digging deeper because it has "+availableOverride.children().length+" children");
    availableOverride.children().forEach(function (child) {
      getAllTextOverridesThatWeShouldReplace(child, currentSelectedStyles, styleToKeep, allOverridesThatWeShouldReplace, symbolInstance, level + 1, context)
    });
  }
}

function UpdateTextOverrides(currentSelectedStyles, styleToKeep, context, foreignStyle) {

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

      getAllTextOverridesThatWeShouldReplace(availableOverride, currentSelectedStyles, styleToKeep, allOverridesThatWeShouldReplace, symbolInstance, 0, context);
      //console.log(allOverridesThatWeShouldReplace);

      for (var i = 0; i < allOverridesThatWeShouldReplace.length; i++) {
        if (currentSelectedStyles[styleToKeep].foreign && currentSelectedStyles[styleToKeep].library != null) {
          symbolInstance.setValue_forOverridePoint_(foreignStyle.localSharedStyle().objectID(), allOverridesThatWeShouldReplace[i].overridePoint());
        }
        else {
          symbolInstance.setValue_forOverridePoint_(currentSelectedStyles[styleToKeep].textStyle.objectID(), allOverridesThatWeShouldReplace[i].overridePoint());
        }

        overridesChangedCounter++;
      }
    });
  });

  return overridesChangedCounter;
}

function getDuplicateTextStyles(context, allStyles) {

  var textStylesNames = [];
  var layerDuplicatedStylesNames = [];

  for (var i = 0; i < allStyles.length; i++) {
    var style = allStyles[i];

    if (Helpers.getIndexOf(style.name, textStylesNames) > -1) {
      if (Helpers.getIndexOf(style.name, layerDuplicatedStylesNames) < 0) {
        layerDuplicatedStylesNames.push(style.name);
      }
    }

    textStylesNames.push(style.name);
  }

  return layerDuplicatedStylesNames;

}

export function MergeDuplicateTextStyles(context) {

  Helpers.clog("----- Sync text styles -----");

  const options = {
    identifier: webviewMDTSIdentifier,
    width: 1200,
    height: 700,
    show: false,
    remembersWindowFrame: true,
    titleBarStyle: 'hidden'
  }
  const browserWindow = new BrowserWindow(options);
  const webContents = browserWindow.webContents;

  var onlyDuplicatedTextStyles;
  var mergeSession = [];


  CalculateDuplicates();

  if (onlyDuplicatedTextStyles.length > 0) {
    browserWindow.loadURL(require('../resources/mergeduplicatetextstyles.html'));
  }
  else {
    context.document.showMessage("Looks like there are no text styles to sync.");
    onShutdown(webviewMDTSIdentifier);
  }

  function CalculateDuplicates() {
    Helpers.clog("Finding duplicate text styles.");

    onlyDuplicatedTextStyles = Helpers.getDuplicateTextStyles(context);
    if (onlyDuplicatedTextStyles.length > 0) {

      Helpers.GetSpecificTextStyleData(context, onlyDuplicatedTextStyles, 0);
      mergeSession = [];
      for (var i = 0; i < onlyDuplicatedTextStyles.length; i++) {
        mergeSession.push({
          "textStyleWithDuplicates": onlyDuplicatedTextStyles[i],
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
    onShutdown(webviewMDTSIdentifier);
  });


  webContents.on('GetSelectedStyleData', (index) => {
    Helpers.GetSpecificTextStyleData(context, onlyDuplicatedTextStyles, index);
    webContents.executeJavaScript(`ReDrawAfterGettingData(${JSON.stringify(mergeSession[index].textStyleWithDuplicates)},${index})`).catch(console.error);
  });

  webContents.on('ExecuteMerge', (editedMergeSession) => {
    Helpers.clog("Executing Merge");
    var duplicatesSolved = 0;
    var mergedStyles = 0;
    var affectedLayers = [0, 0];

    for (var i = 0; i < editedMergeSession.length; i++) {
      Helpers.clog("-- Merging " + mergeSession[i].textStyleWithDuplicates.name);
      if (!editedMergeSession[i].isUnchecked && editedMergeSession[i].selectedIndex >= 0) {
        mergeSession[i].selectedIndex = editedMergeSession[i].selectedIndex;
        currentSelectedStyles = [];
        for (var j = 0; j < mergeSession[i].textStyleWithDuplicates.duplicates.length; j++) {
          currentSelectedStyles.push(mergeSession[i].textStyleWithDuplicates.duplicates[j]);
          mergedStyles++;
        }

        var results = MergeTextStyles(context, editedMergeSession[i].selectedIndex);
        affectedLayers[0] += results[0];
        affectedLayers[1] += results[1];

        duplicatesSolved++;
      }
    }

    onShutdown(webviewMDTSIdentifier);
    if (duplicatesSolved <= 0) {
      Helpers.clog("No styles were merged");
      context.document.showMessage("No styles were replaced.");
    }
    else {
      Helpers.clog("Updated " + affectedLayers[0] + " text layers and " + affectedLayers[1] + " overrides.");
      context.document.showMessage("Yo ho! We updated " + affectedLayers[0] + " text layers and " + affectedLayers[1] + " overrides.");
    }

  });
};
