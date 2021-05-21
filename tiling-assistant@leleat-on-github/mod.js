const {main, panel, windowManager, windowMenu} = imports.ui;
const {Clutter, Gio, GLib, GObject, Meta, St} = imports.gi;

const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();

const MainExtension = Me.imports.extension;
const Util = Me.imports.tilingUtil;

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
    // Called every time the stack order of windows changes for some reason
    //log("restacked", display)
    window_focus(display);
}

function get_window_surface(meta_window) {
	let window_actor = meta_window.get_compositor_private();
	let childs = window_actor.get_children();
	for (let i = 0; i < childs.length; i++) {
		if (childs[i].constructor.name.indexOf('MetaSurfaceActor') > -1) {
			return childs[i];
		}
	}

	return window_actor;
}

function window_focus(display) {
    const openWindows = Util.getOpenWindows();
    const focusWindow = display.get_focus_window();

    let lowerWindows = [];

    log("window_focus", display.focus_window, focusWindow);

    // Traverse window stack from bottom up
    for (const window of openWindows.reverse()) {
        const surface = get_window_surface(window);

        if (!surface)
            continue; // Nothing we could do with this

        const covering = lowerWindows.some(w => w.get_frame_rect().overlap(window.get_frame_rect()));
        lowerWindows.push(window);

        if (window === focusWindow || !window.is_above()) {
            surface.opacity = 255; // Full opaque, if in focus
            continue;
        }

        if (covering) {
            surface.ease({
                duration: 250,
                mode: Clutter.AnimationMode.EASE_OUT_QUAD,
                opacity: 180,
                //onComplete: complete_func
            });
        }
        else {
            surface.opacity = 255;
        }
    }
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