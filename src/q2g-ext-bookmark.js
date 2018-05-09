(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports", "qvangular", "qlik", "text!./q2g-ext-bookmark.html", "./node_modules/davinci.js/dist/umd/daVinci", "./q2g-ext-bookmarkDirective"], factory);
    }
})(function (require, exports) {
    "use strict";
    //#region Imports
    var qvangular = require("qvangular");
    var qlik = require("qlik");
    var template = require("text!./q2g-ext-bookmark.html");
    var daVinci_1 = require("./node_modules/davinci.js/dist/umd/daVinci");
    var q2g_ext_bookmarkDirective_1 = require("./q2g-ext-bookmarkDirective");
    //#endregion
    //#region registrate services
    qvangular.service("$registrationProvider", daVinci_1.services.RegistrationProvider)
        .implementObject(qvangular);
    //#endregion
    //#region Logger
    daVinci_1.logging.LogConfig.SetLogLevel("*", daVinci_1.logging.LogLevel.info);
    var logger = new daVinci_1.logging.Logger("Main");
    //#endregion
    //#region Directives
    var $injector = qvangular.$injector;
    daVinci_1.utils.checkDirectiveIsRegistrated($injector, qvangular, "", q2g_ext_bookmarkDirective_1.BookmarkDirectiveFactory("Bookmarkextension"), "BookmarkExtension");
    //#endregion
    //#region extension properties
    var parameter = {
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
                                show: function (data) {
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
                                show: function (data) {
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
                                show: function (data) {
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
                                show: function (data) {
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
    var BookmarkExtension = /** @class */ (function () {
        function BookmarkExtension(model) {
            this.model = model;
        }
        BookmarkExtension.prototype.isEditMode = function () {
            if (qlik.navigation.getMode() === "analysis") {
                return false;
            }
            else {
                return true;
            }
        };
        return BookmarkExtension;
    }());
    return {
        definition: parameter,
        initialProperties: {},
        template: template,
        support: {
            snapshot: false,
            export: false,
            exportData: false
        },
        paint: function () {
            //
        },
        resize: function () {
            //
        },
        controller: ["$scope", function (scope) {
                scope.vm = new BookmarkExtension(daVinci_1.utils.getEnigma(scope));
            }]
    };
});
//# sourceMappingURL=q2g-ext-bookmark.js.map