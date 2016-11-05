/* exported patch */

const Lang = imports.lang;

const Clutter = imports.gi.Clutter;
const Gio = imports.gi.Gio;
const St = imports.gi.St;

const AppDisplay = imports.ui.appDisplay;

const Me = imports.misc.extensionUtils.getCurrentExtension();
const Settings = Me.imports.settings;
const Extension = Me.imports.extension;

const ORIG_init = AppDisplay.AppIcon.prototype._init;
const ORIG_onClicked = AppDisplay.AppIcon.prototype._onClicked;
const ORIG_onButtonPress = AppDisplay.AppIcon.prototype._onButtonPress;
const ORIG_createIcon = AppDisplay.AppIcon.prototype._createIcon; // eslint-disable-line
const ORIG_redisplay = AppDisplay.AppIconMenu.prototype._redisplay; // eslint-disable-line

function patch() {
    AppDisplay.AppIcon.prototype._init = MOD_init;
    AppDisplay.AppIcon.prototype._onClicked = MOD_onClicked;
    AppDisplay.AppIcon.prototype._onButtonPress = MOD_onButtonPress;
    AppDisplay.AppIcon.prototype._createIcon = MOD_createIcon;
    AppDisplay.AppIconMenu.prototype._redisplay = MOD_redisplay;
}

function MOD_init() {
    ORIG_init.apply(this, arguments);
    if (Settings.is_customized(this.app.id) && Settings.has_custom_name(this.app.id)) {
        this.actor.label_actor.text = Settings.get_custom_name(this.app.id);
    }
}

function MOD_redisplay() {
    ORIG_redisplay.apply(this, arguments);
    let item = this._appendMenuItem('Edit AppIcon');
    item.connect('activate', Lang.bind(this, function () {
        Extension.edit_app(this._source, this._source.id);
    }));
}

function MOD_createIcon(iconSize) {
    if (Settings.is_customized(this.app.get_id()) && Settings.has_custom_icon(this.app.get_id())) {
        let gicon = Gio.icon_new_for_string(Settings.get_icon_path(this.app.get_id()));
        return new St.Icon({ gicon: gicon, icon_size: iconSize });
    }
    return this.app.create_icon_texture(iconSize);
}

function MOD_onButtonPress() {
    if (!AppDisplay._fc_creating_new_folder || global.settings.get_uint('app-picker-view') !== imports.ui.appDisplay.Views.ALL) {
        return ORIG_onButtonPress.apply(this, arguments);
    }

    if (this._fc_selectable) {
        return Clutter.EVENT_PROPOGATE;
    }

    return ORIG_onButtonPress.apply(this, arguments);
}

function MOD_onClicked(actor, button) {
    if (!AppDisplay._fc_creating_new_folder || global.settings.get_uint('app-picker-view') !== imports.ui.appDisplay.Views.ALL) {
        return ORIG_onClicked.apply(this, arguments);
    }

    if (this._fc_selectable) {
        if (!this._fc_selected) {
            actor.add_style_class_name('selected-app-icon');
            this._fc_selected = true;
        } else {
            this._fc_selected = false;
            actor.remove_style_class_name('selected-app-icon');
        }
        return Clutter.EVENT_STOP;
    }

    return ORIG_onClicked.apply(this, arguments);
}