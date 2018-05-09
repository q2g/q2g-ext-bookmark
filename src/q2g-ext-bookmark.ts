//#region Imports
import * as qvangular from "qvangular";
import * as qlik from "qlik";
import * as template from "text!./q2g-ext-bookmark.html";
import { utils, logging, services, version } from "./node_modules/davinci.js/dist/umd/daVinci";
import { BookmarkDirectiveFactory, IShortcutProperties } from "./q2g-ext-bookmarkDirective";
//#endregion

//#region registrate services
qvangular.service<services.IRegistrationProvider>("$registrationProvider", services.RegistrationProvider)
.implementObject(qvangular);
//#endregion

//#region interfaces
interface IDataProperties {
    properties: IShortcutProperties;
}
//#endregion

//#region Logger
logging.LogConfig.SetLogLevel("*", logging.LogLevel.warn);
let logger = new logging.Logger("Main");
//#endregion

//#region Directives
var $injector = qvangular.$injector;
utils.checkDirectiveIsRegistrated($injector, qvangular, "", BookmarkDirectiveFactory("Bookmarkextension"),
    "BookmarkExtension");
//#endregion

//#region extension properties
let parameter = {
    type: "items",
    component: "accordion",
    items: {
        settings: {
            uses: "settings",
            items: {
                accessibility: {
                    type: "items",
                    label: "accessibility",
                    grouped: true,
                    items: {
                        ShortcutLable: {
                            label: "In the following, you can change the used shortcuts",
                            component: "text"
                        },
                        shortcutUseDefaults: {
                            ref: "properties.shortcutUseDefaults",
                            label: "use default shortcuts",
                            component: "switch",
                            type: "boolean",
                            options: [{
                                value: true,
                                label: "use"
                            }, {
                                value: false,
                                label: "not use"
                            }],
                            defaultValue: true
                        },
                        shortcutFocusBookmarkList: {
                            ref: "properties.shortcutFocusBookmarkList",
                            label: "focus dimension list",
                            type: "string",
                            defaultValue: "strg + alt + 66",
                            show: function (data: IDataProperties) {
                                console.log(data);
                                if (data.properties.shortcutUseDefaults) {
                                    data.properties.shortcutFocusBookmarkList = "strg + alt + 66";
                                }
                                return !data.properties.shortcutUseDefaults;
                            }
                        },
                        shortcutRemoveBookmark: {
                            ref: "properties.shortcutRemoveBookmark",
                            label: "remove Bookmark",
                            type: "string",
                            defaultValue: "strg + alt + 82",
                            show: function (data: IDataProperties) {
                                if (data.properties.shortcutUseDefaults) {
                                    data.properties.shortcutRemoveBookmark = "strg + alt + 82";
                                }
                                return !data.properties.shortcutUseDefaults;
                            }
                        },
                        shortcutAddBookmark: {
                            ref: "properties.shortcutAddBookmark",
                            label: "add Bookmark",
                            type: "string",
                            defaultValue: "strg + alt + 65",
                            show: function (data: IDataProperties) {
                                if (data.properties.shortcutUseDefaults) {
                                    data.properties.shortcutAddBookmark = "strg + alt + 65";
                                }
                                return !data.properties.shortcutUseDefaults;
                            }
                        },
                        shortcutFocusSearchField: {
                            ref: "properties.shortcutFocusSearchField",
                            label: "focus search field",
                            type: "string",
                            defaultValue: "strg + alt + 83",
                            show: function (data: IDataProperties) {
                                if (data.properties.shortcutUseDefaults) {
                                    data.properties.shortcutFocusSearchField = "strg + alt + 83";
                                }
                                return !data.properties.shortcutUseDefaults;
                            }
                        }
                    }
                },
                configuration: {
                    type: "items",
                    label: "Configuration",
                    grouped: true,
                    items: {
                        bookmarkType: {
                            ref: "properties.bookmarkType",
                            label: "bookmark Type",
                            type: "string",
                            defaultValue: "bookmark"
                        },
                        useSheet: {
                            ref: "properties.useSheet",
                            label: "useSheet",
                            component: "switch",
                            type: "boolean",
                            options: [{
                                value: true,
                                label: "use"
                            }, {
                                value: false,
                                label: "not use"
                            }],
                            defaultValue: true
                        }
                    }
                }
            }
        }
    }
};
//#endregion

class BookmarkExtension {

    model: EngineAPI.IGenericObject;

    constructor(model: EngineAPI.IGenericObject) {
        this.model = model;
    }

    public isEditMode() {
        if (qlik.navigation.getMode() === "analysis") {
            return false;
        } else {
            return true;
        }
    }
}

export = {
    definition: parameter,
    initialProperties: { },
    template: template,
    support: {
        snapshot: false,
        export: false,
        exportData: false
    },
    paint: () => {
        //
    },
    resize: () => {
        //
    },
    mounted: () => {
        //
    },
    updateData: () => {
        //
    },
    beforeDestroy: () => {
        //
    },
    controller: ["$scope", function (scope: utils.IVMScope<BookmarkExtension>) {
        scope.vm = new BookmarkExtension(utils.getEnigma(scope));
    }]
};


