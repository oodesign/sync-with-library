function report_issue() {
  NSWorkspace.sharedWorkspace().openURL(NSURL.URLWithString("https://github.com/oodesign/sync-with-library/issues"));
}

module.exports = { report_issue };

