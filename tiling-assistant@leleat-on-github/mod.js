const {main, panel, windowManager, windowMenu} = imports.ui;
const {Clutter, Gio, GLib, GObject, Meta, St} = imports.gi;

const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();
const MainExtension = Me.imports.extension;

var on_window_created, on_restacked, on_focused;
var on_window_entered_monitor;

function window_created(display, window) {
    if(!window.title || !window.allows_move())
        return;

    log("window_created", window.title)

    // Untiled windows stay on top
    if(MainExtension.settings.get_boolean("make-untiled-above") && !window.isTiled)
        window.make_above();
}

function restacked(display) {
    log("restacked", display)
}

function window_focus(display, window) {
    //main.notify("window_focus", window.title)
}

function window_entered_monitor(display, monitorId, window) {
    if(!window.allows_move())
        return; // TODO: Better way for finding intresting windows

    log("Window entered: " + monitorId + " [" + window.title + "]");
}

function init() {
    on_window_created = global.display.connect('window-created', window_created);
    on_restacked = global.display.connect('restacked', restacked);
    on_focused = global.display.connect('notify::focus-window', window_focus);

    on_window_entered_monitor = global.display.connect("window-entered-monitor", window_entered_monitor);
}

function destroy() {
    global.display.disconnect(on_window_created);
    global.display.disconnect(on_restacked);
    global.display.disconnect(on_focused);
}