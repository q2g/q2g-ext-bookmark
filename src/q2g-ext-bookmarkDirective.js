define(["require", "exports", "./lib/daVinci.js/src/utils/logger", "./lib/daVinci.js/src/directives/listview", "./lib/daVinci.js/src/directives/identifier", "./lib/daVinci.js/src/utils/object", "./lib/daVinci.js/src/directives/scrollBar", "./lib/daVinci.js/src/directives/shortcut", "./lib/daVinci.js/src/directives/extensionHeader", "./lib/daVinci.js/src/utils/utils", "text!./q2g-ext-bookmarkDirective.html"], function (require, exports, logger_1, listview_1, identifier_1, object_1, scrollBar_1, shortcut_1, extensionHeader_1, utils_1, template) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    //#endregion
    var logger = new logger_1.Logging.Logger("q2g-ext-selectorDrective");
    var BookmarkController = (function () {
        /**
         * init of the controller for the Directive
         * @param timeout
         * @param element
         */
        function BookmarkController(timeout, element, scope) {
            var _this = this;
            //#region Variables
            this.actionDelay = 0;
            this.editMode = false;
            this.focusedPosition = 1;
            this.inputBarType = "search";
            this.properties = {
                shortcutFocusBookmarkList: " ",
                shortcutFocusSearchField: " ",
                shortcutRemoveBookmark: " ",
                shortcutAddBookmark: " "
            };
            this.showButtons = false;
            this.showFocused = true;
            this.showSearchField = false;
            this.titleDimension = "Bookmarks";
            this.selectBookmarkToggle = true;
            this.inputStates = new utils_1.StateMachineInput();
            this.inputBarFocus = false;
            //#endregion
            //#region elementHeight
            this._elementHeight = 0;
            //#endregion
            //#region headerInput
            this._headerInput = "";
            this.element = element;
            this.timeout = timeout;
            this.initMenuElements();
            this.initInputStates();
            $(document).on("click", function (e) {
                try {
                    if (element.find(e.target).length === 0) {
                        _this.showFocused = false;
                        _this.showButtons = false;
                        _this.showSearchField = false;
                        _this.headerInput = null;
                        _this.timeout();
                    }
                }
                catch (e) {
                    logger.error("Error in Constructor with click event", e);
                }
            });
            scope.$watch(function () {
                return _this.element.width();
            }, function () {
                _this.elementHeight = _this.element.height();
            });
        }
        BookmarkController.prototype.$onInit = function () {
            logger.debug("initialisation from BookmarkController");
        };
        Object.defineProperty(BookmarkController.prototype, "elementHeight", {
            get: function () {
                return this._elementHeight;
            },
            set: function (value) {
                var _this = this;
                if (this.elementHeight !== value) {
                    try {
                        this._elementHeight = value;
                        if (this.bookmarkList) {
                            this.bookmarkList.obj.emit("changed", utils_1.calcNumbreOfVisRows(this.elementHeight));
                        }
                        else {
                            this.timeout(function () {
                                _this.bookmarkList.obj.emit("changed", utils_1.calcNumbreOfVisRows(_this.elementHeight));
                            }, 200);
                        }
                    }
                    catch (err) {
                        logger.error("error in setter of elementHeight", err);
                    }
                }
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(BookmarkController.prototype, "model", {
            get: function () {
                return this._model;
            },
            set: function (value) {
                var _this = this;
                if (value !== this._model) {
                    try {
                        this._model = value;
                        var bmp = {
                            "qInfo": { "qType": "BookmarkList" },
                            "qBookmarkListDef": { "qType": "bookmark" }
                        };
                        this.registrateSelectionObject();
                        var that_1 = this;
                        value.on("changed", function () {
                            value.getProperties()
                                .then(function (res) {
                                that_1.setProperties(res.properties);
                            })
                                .catch(function (error) {
                                logger.error("ERROR in setter of model", error);
                            });
                        });
                        this.model.app.createSessionObject(bmp)
                            .then(function (bookmarkObject) {
                            var that = _this;
                            bookmarkObject.on("changed", function () {
                                this.getLayout()
                                    .then(function (bookmarkLayout) {
                                    var bookmarkObject = new object_1.Q2gIndObject(new utils_1.AssistHyperCubeBookmarks(bookmarkLayout));
                                    that.bookmarkList = new object_1.Q2gListAdapter(bookmarkObject, utils_1.calcNumbreOfVisRows(that.elementHeight), bookmarkLayout.qBookmarkList.qItems.length, "bookmark");
                                })
                                    .catch(function (error) {
                                    logger.error("Error in on change of bookmark object", error);
                                });
                            });
                            bookmarkObject.emit("changed");
                        })
                            .catch(function (error) {
                            logger.error("Error in setter of model", error);
                        });
                        this.model.emit("changed");
                    }
                    catch (e) {
                        logger.error("error", e);
                    }
                }
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(BookmarkController.prototype, "theme", {
            get: function () {
                if (this._theme) {
                    return this._theme;
                }
                return "default";
            },
            set: function (value) {
                if (value !== this._theme) {
                    this._theme = value;
                }
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(BookmarkController.prototype, "headerInput", {
            get: function () {
                return this._headerInput;
            },
            set: function (v) {
                var _this = this;
                if (v !== this._headerInput) {
                    try {
                        this._headerInput = v;
                        if (!(this.inputStates.relStateName === "addBookmark")) {
                            if (!v) {
                                this.bookmarkList.obj.searchFor("")
                                    .then(function () {
                                    _this.bookmarkList.obj.emit("changed", utils_1.calcNumbreOfVisRows(_this.elementHeight));
                                    _this.bookmarkList.itemsCounter = _this.bookmarkList.obj.model.calcCube.length;
                                    _this.timeout();
                                })
                                    .catch(function (error) {
                                    logger.error("error", error);
                                });
                                return;
                            }
                            this.bookmarkList.obj.searchFor(v)
                                .then(function () {
                                _this.bookmarkList.obj.emit("changed", utils_1.calcNumbreOfVisRows(_this.elementHeight));
                                _this.bookmarkList.itemsCounter = _this.bookmarkList.obj.model.calcCube.length;
                                _this.timeout();
                            })
                                .catch(function (error) {
                                logger.error("error", error);
                            });
                        }
                    }
                    catch (error) {
                        logger.error("ERROR", error);
                    }
                }
            },
            enumerable: true,
            configurable: true
        });
        /**
         * checks if the extension is used in Edit mode
         */
        BookmarkController.prototype.isEditMode = function () {
            if (this.editMode) {
                return true;
            }
            else {
                return false;
            }
        };
        /**
         * callback when selection a value of the list
         * @param pos position from the selected value
         */
        BookmarkController.prototype.selectObjectCallback = function (pos) {
            var _this = this;
            setTimeout(function () {
                _this.selectBookmarkToggle = true;
                _this.showFocused = true;
                _this.showButtons = true;
                _this.model.app.applyBookmark(_this.bookmarkList.collection[pos].id[0])
                    .then(function () {
                    _this.focusedPosition = pos + _this.bookmarkList.itemsPagingTop;
                    for (var _i = 0, _a = _this.bookmarkList.collection; _i < _a.length; _i++) {
                        var x = _a[_i];
                        x.status = "A";
                    }
                    _this.bookmarkList.collection[pos].status = "S";
                })
                    .catch(function (error) {
                    logger.error("ERROR in selectListObjectCallback", error);
                });
            }, this.actionDelay);
        };
        /**
         * function which gets called, when the buttons of the menu list gets hit
         * @param item name of the button which got activated
         */
        BookmarkController.prototype.menuListActionCallback = function (item) {
            switch (item) {
                case "Remove Bookmark":
                    this.removeBookmark(this.bookmarkList.collection[this.focusedPosition].id[0]);
                    break;
                case "Add Bookmark":
                    this.controllingInputBarOptions("addBookmark");
                    break;
            }
        };
        /**
         * shortcuthandler, called when shortcut is hit
         * @param objectShortcut object wich gives you the shortcut name and the element, from which the shortcut come from
         */
        BookmarkController.prototype.shortcutHandler = function (objectShortcut) {
            switch (objectShortcut.objectShortcut.name) {
                //#region focusList
                case "focusList":
                    try {
                        this.showFocused = true;
                        this.timeout();
                        if (this.focusedPosition < 0) {
                            this.focusedPosition = 0;
                            objectShortcut.element.children().children().children()[0].focus();
                            this.timeout();
                            return true;
                        }
                        if (this.focusedPosition >= this.bookmarkList.collection.length) {
                            this.focusedPosition = 0;
                            objectShortcut.element.children().children().children()[0].focus();
                            this.timeout();
                            return true;
                        }
                        if (this.focusedPosition < this.bookmarkList.itemsPagingTop) {
                            this.bookmarkList.itemsPagingTop = this.focusedPosition;
                        }
                        else if (this.focusedPosition >
                            this.bookmarkList.itemsPagingTop + utils_1.calcNumbreOfVisRows(this.elementHeight)) {
                            this.bookmarkList.itemsPagingTop
                                = this.focusedPosition - (utils_1.calcNumbreOfVisRows(this.elementHeight) + 1);
                        }
                        objectShortcut.element.children().children().children().children()[this.focusedPosition - this.bookmarkList.itemsPagingTop].focus();
                        return true;
                    }
                    catch (e) {
                        logger.error("Error in shortcut Handler", e);
                        return false;
                    }
                //#endregion
                //#region escList
                case "escList":
                    try {
                        if (this.headerInput === "") {
                            this.showSearchField = false;
                        }
                        return true;
                    }
                    catch (e) {
                        logger.error("Error in shortcutHandlerExtensionHeader", e);
                        return false;
                    }
                //#endregion
                //#region removeBookmark
                case "removeBookmark":
                    this.removeBookmark(this.bookmarkList.collection[this.focusedPosition].id[0]);
                    break;
                //#endregion
                //#region addBookmark
                case "addBookmark":
                    this.controllingInputBarOptions("addBookmark");
                    break;
                //#endregion
                //#region searchBookmark
                case "searchBookmark":
                    this.controllingInputBarOptions("searchBookmark");
                    break;
            }
            return false;
        };
        /**
         * return the logo which is used in the input bar
         * @param type type of the logo
         */
        BookmarkController.prototype.getInputBarLogo = function (type) {
            switch (type) {
                case "add":
                    return "lui-icon--bookmark";
                default:
                    return "lui-icon--search";
            }
        };
        /**
         * callback when enter on input field
         */
        BookmarkController.prototype.extensionHeaderAccept = function () {
            switch (this.inputStates.relStateName) {
                case "addBookmark":
                    this.addBookmark();
                    break;
            }
        };
        /**
         * saves the Properties from the getLayout call from qlik enine in own Object
         * @param properties Properties from getLayout call
         */
        BookmarkController.prototype.setProperties = function (properties) {
            var _this = this;
            return new Promise(function (resolve, reject) {
                _this.properties.shortcutFocusBookmarkList = properties.shortcutFocusBookmarkList;
                _this.properties.shortcutFocusSearchField = properties.shortcutFocusSearchField;
                _this.properties.shortcutRemoveBookmark = properties.shortcutRemoveBookmark;
                _this.properties.shortcutAddBookmark = properties.shortcutAddBookmark;
                // if (properties.useAccessibility) {
                //     this.timeAriaIntervall = parseInt(properties.aria.timeAria, 10);
                //     this.actionDelay = parseInt(properties.aria.actionDelay, 10);
                // }
                // this.useReadebility = properties.aria.useAccessibility;
            });
        };
        /**
         * removes the bookmark from the app
         * @param id the id of the bookmark
         */
        BookmarkController.prototype.removeBookmark = function (id) {
            this.model.app.destroyBookmark(id);
        };
        /**
         * controlling the options set to create a bookmark in the header input
         */
        BookmarkController.prototype.controllingInputBarOptions = function (type) {
            switch (type) {
                case "addBookmark":
                    this.inputStates.relStateName = "addBookmark";
                    break;
                case "searchBookmark":
                    this.inputStates.relStateName = "searchBookmark";
                    break;
                default:
                    break;
            }
            this.inputBarFocus = true;
            this.headerInput = "";
            this.showButtons = true;
            this.showSearchField = true;
            this.timeout();
        };
        /**
         * fills the Menu with Elements
         */
        BookmarkController.prototype.initMenuElements = function () {
            this.menuList = [];
            this.menuList.push({
                buttonType: "success",
                isVisible: true,
                isEnabled: true,
                icon: "tick",
                name: "Confirm Selection",
                hasSeparator: true,
                type: "menu"
            });
            this.menuList.push({
                buttonType: "",
                isVisible: true,
                isEnabled: false,
                icon: "plus",
                name: "Add Bookmark",
                hasSeparator: false,
                type: "menu"
            });
            this.menuList.push({
                buttonType: "",
                isVisible: true,
                isEnabled: false,
                icon: "minus",
                name: "Remove Bookmark",
                hasSeparator: false,
                type: "menu"
            });
        };
        /**
         * registrate the selection object to handle change on selections
         */
        BookmarkController.prototype.registrateSelectionObject = function () {
            var _this = this;
            return new Promise(function (resolve, reject) {
                var params = {
                    "qInfo": {
                        "qId": "",
                        "qType": "SessionLists"
                    },
                    "qSelectionObjectDef": {}
                };
                _this.model.app.createSessionObject(params)
                    .then(function (object) {
                    var that = _this;
                    object.on("changed", function () {
                        this.getLayout()
                            .then(function () {
                            if (!that.selectBookmarkToggle) {
                                for (var _i = 0, _a = that.bookmarkList.collection; _i < _a.length; _i++) {
                                    var element = _a[_i];
                                    element.status = "O";
                                }
                            }
                            that.selectBookmarkToggle = false;
                        })
                            .catch(function (error) {
                            logger.error("ERROR in on change of selection objcet", error);
                        });
                    });
                    object.emit("changed");
                })
                    .catch(function (error) {
                    logger.error("ERROR in checkIfSelectionChanged", error);
                });
                resolve(true);
            });
        };
        /**
         * initialisation of the stats from the input Bar
         */
        BookmarkController.prototype.initInputStates = function () {
            var addBookmarkState = {
                name: "addBookmark",
                icon: "lui-icon--bookmark",
                placeholder: "enter Bookmark Name",
                acceptFunction: this.addBookmark
            };
            this.inputStates.addState(addBookmarkState);
            this.inputStates.relStateName = "";
        };
        /**
         * creates a new bookmark
         */
        BookmarkController.prototype.addBookmark = function () {
            try {
                var bookmarkProperties = {
                    "qMetaDef": {
                        "title": this.headerInput
                    },
                    "creationDate": (new Date()).toISOString(),
                    "qInfo": {
                        "qType": "bookmark"
                    }
                };
                this.model.app.createBookmark(bookmarkProperties)
                    .catch(function (error) {
                    logger.error("error during creation of Bookmark", error);
                });
                this.showSearchField = false;
            }
            catch (error) {
                logger.error("Error in setter of input Accept", error);
            }
        };
        //#endregion
        BookmarkController.$inject = ["$timeout", "$element", "$scope"];
        return BookmarkController;
    }());
    function BookmarkDirectiveFactory(rootNameSpace) {
        "use strict";
        return function ($document, $injector, $registrationProvider) {
            return {
                restrict: "E",
                replace: true,
                template: utils_1.templateReplacer(template, rootNameSpace),
                controller: BookmarkController,
                controllerAs: "vm",
                scope: {},
                bindToController: {
                    model: "<",
                    theme: "<?",
                    editMode: "<?"
                },
                compile: function () {
                    utils_1.checkDirectiveIsRegistrated($injector, $registrationProvider, rootNameSpace, listview_1.ListViewDirectiveFactory(rootNameSpace), "Listview");
                    utils_1.checkDirectiveIsRegistrated($injector, $registrationProvider, rootNameSpace, identifier_1.IdentifierDirectiveFactory(rootNameSpace), "AkquinetIdentifier");
                    utils_1.checkDirectiveIsRegistrated($injector, $registrationProvider, rootNameSpace, shortcut_1.ShortCutDirectiveFactory(rootNameSpace), "Shortcut");
                    utils_1.checkDirectiveIsRegistrated($injector, $registrationProvider, rootNameSpace, scrollBar_1.ScrollBarDirectiveFactory(rootNameSpace), "ScrollBar");
                    utils_1.checkDirectiveIsRegistrated($injector, $registrationProvider, rootNameSpace, extensionHeader_1.ExtensionHeaderDirectiveFactory(rootNameSpace), "ExtensionHeader");
                }
            };
        };
    }
    exports.BookmarkDirectiveFactory = BookmarkDirectiveFactory;
});
//# sourceMappingURL=q2g-ext-bookmarkDirective.js.map