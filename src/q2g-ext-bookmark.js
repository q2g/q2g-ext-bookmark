/// <reference path="lib/daVinci.js/src/utils/utils.ts" />
define(["require", "exports", "qvangular", "qlik", "text!./q2g-ext-bookmark.html", "./lib/daVinci.js/src/utils/logger", "./q2g-ext-bookmarkDirective", "./lib/daVinci.js/src/utils/utils", "./lib/daVinci.js/src/services/registration"], function (require, exports, qvangular, qlik, template, logger_1, q2g_ext_bookmarkDirective_1, utils_1, registration_1) {
    "use strict";
    //#endregion
    qvangular.service("$registrationProvider", registration_1.RegistrationProvider)
        .implementObject(qvangular);
    //#region Logger
    logger_1.Logging.LogConfig.SetLogLevel("*", logger_1.Logging.LogLevel.info);
    var logger = new logger_1.Logging.Logger("Main");
    //#endregion
    //#region Directives
    var $injector = qvangular.$injector;
    utils_1.checkDirectiveIsRegistrated($injector, qvangular, "", q2g_ext_bookmarkDirective_1.BookmarkDirectiveFactory("Bookmarkextension"), "BookmarkExtension");
    //#endregion
    //#region assist
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
    var BookmarkExtension = (function () {
        function BookmarkExtension(model) {
            logger.debug("Constructor of Selection Extension", "");
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
            export: true
        },
        controller: ["$scope", function (scope) {
                logger.debug("Initialice Extension", scope);
                scope.vm = new BookmarkExtension(utils_1.getEnigma(scope));
            }]
    };
});
//# sourceMappingURL=q2g-ext-bookmark.js.map