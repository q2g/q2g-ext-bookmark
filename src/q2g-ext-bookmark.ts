//#region Imports
import "css!./q2g-ext-bookmark.css";
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
        sorting: {
            component: "items",
            label: "Sorting",
            grouped: true,
            items: {
                sortmode: {
                    ref: "properties.sortmode",
                    label: "Sorting",
                    component: "switch",
                    type: "boolean",
                    options: [{
                        value: false,
                        label: "individual"
                    }, {
                        value: true,
                        label: "automatic"
                    }],
                    defaultValue: true
                },
                byAscii: {
                    component: "items",
                    grouped: false,
                    items: {
                        byAscii: {
                            ref: "properties.byAscii",
                            label: "sort by Ascii",
                            type: "boolean",
                            defaultValue: false
                        },
                        byAsciiOrder: {
                            ref: "properties.byAsciiOrder",
                            component: "dropdown",
                            type: "string",
                            options: [{
                                value: "a",
                                label: "ascending"
                            }, {
                                value: "d",
                                label: "descending"
                            }],
                            defaultValue: "a",
                            show: function (data: IDataProperties) {
                                return data.properties.byAscii;
                            }
                        }
                    },
                    show: function (data: IDataProperties) {
                        if (data.properties.sortmode) {
                            data.properties.byAscii = true;
                        }
                        return !data.properties.sortmode;
                    }
                },
                byLoadOrder: {
                    component: "items",
                    grouped: false,
                    items: {
                        byLoadOrder: {
                            ref: "properties.byLoadOrder",
                            label: "sort by Load Order",
                            type: "boolean",
                            defaultValue: true
                        }
                    },
                    show: function (data: IDataProperties) {
                        if (data.properties.sortmode) {
                            data.properties.byLoadOrder = false;
                        }
                        return !data.properties.sortmode;
                    }
                },
            }
        },
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
                        titleDimension: {
                            ref: "properties.titleDimension",
                            label: "Title",
                            type: "string",
                            defaultValue: "Bookmark"
                        },
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
                        },
                        showFocusedElement: {
                            ref: "properties.showFocusedElement",
                            label: "show focused element",
                            component: "switch",
                            type: "boolean",
                            options: [{
                                value: true,
                                label: "show"
                            }, {
                                value: false,
                                label: "dont show"
                            }],
                            defaultValue: true
                        },
                        loglevel: {
                            ref: "properties.loglevel",
                            label: "loglevel",
                            component: "dropdown",
                            options: [{
                                value: 0,
                                label: "trace"
                            }, {
                                value: 1,
                                label: "debug"
                            }, {
                                value: 2,
                                label: "info"
                            }, {
                                value: 3,
                                label: "warn"
                            }, {
                                value: 4,
                                label: "error"
                            }, {
                                value: 5,
                                label: "fatal"
                            }, {
                                value: 6,
                                label: "off"
                            }],
                            defaultValue: 3
                        },
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
    // mounted: () => {
    //     //
    // },
    // updateData: () => {
    //     //
    // },
    // beforeDestroy: () => {
    //     //
    // },
    controller: ["$scope", function (scope: utils.IVMScope<BookmarkExtension>) {
        scope.vm = new BookmarkExtension(utils.getEnigma(scope));

        //#region Logger
        logging.LogConfig.SetLogLevel("*", (scope as any).layout.properties.loglevel);
        let logger = new logging.Logger("Main");
        //#endregion

    }]
};


