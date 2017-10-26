/// <reference path="lib/daVinci.js/src/utils/utils.ts" />

//#region Imports
import * as qvangular from "qvangular";
import * as qlik from "qlik";
import * as template from "text!./q2g-ext-bookmark.html";

import { Logging } from "./lib/daVinci.js/src/utils/logger";
import { BookmarkDirectiveFactory } from "./q2g-ext-bookmarkDirective";
import { getEnigma, checkDirectiveIsRegistrated } from "./lib/daVinci.js/src/utils/utils";
import { RegistrationProvider, IRegistrationProvider } from "./lib/daVinci.js/src/services/registration";
//#endregion

qvangular.service<IRegistrationProvider>("$registrationProvider", RegistrationProvider)
.implementObject(qvangular);

//#region Logger
Logging.LogConfig.SetLogLevel("*", Logging.LogLevel.info);
let logger = new Logging.Logger("Main");
//#endregion

//#region Directives
var $injector = qvangular.$injector;
checkDirectiveIsRegistrated($injector, qvangular, "", BookmarkDirectiveFactory("Bookmarkextension"),
    "BookmarkExtension");
//#endregion

//#region assist
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
                            show: function (data: any) {
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
                            show: function (data: any) {
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
                            show: function (data: any) {
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
                            show: function (data: any) {
                                if (data.properties.shortcutUseDefaults) {
                                    data.properties.shortcutFocusSearchField = "strg + alt + 83";
                                }
                                return !data.properties.shortcutUseDefaults;
                            }
                        }
                    }
                }
            }
        }
    }
};
//#endregion

class BookmarkExtension {
    constructor(model: EngineAPI.IGenericObject) {
        logger.debug("Constructor of Selection Extension", "");

        this.model = model;
    }

    model: EngineAPI.IGenericObject;

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
    support : {
        export: true
    },
    controller: ["$scope", function (
        scope: IVMScope<BookmarkExtension>) {
        logger.debug("Initialice Extension", scope);
        scope.vm = new BookmarkExtension(getEnigma(scope));
    }]
};


