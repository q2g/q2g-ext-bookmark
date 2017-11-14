//#region imports
import { utils, logging, directives } from "../node_modules/davinci.js/dist/daVinci";
import * as template from "text!./q2g-ext-bookmarkDirective.html";
//#endregion

//#region interfaces
export interface IShortcutProperties {
    shortcutFocusBookmarkList: string;
    shortcutFocusSearchField: string;
    shortcutRemoveBookmark: string;
    shortcutAddBookmark: string;
    shortcutUseDefaults: string;
}
//#endregion

enum eStateName {
    addBookmark,
    searchBookmark
}

class BookmarkController implements ng.IController {

    $onInit(): void {
        this.logger.debug("initialisation from BookmarkController");
    }

    //#region Variables
    actionDelay: number = 0;
    bookmarkList: utils.IQ2gListAdapter;
    editMode: boolean = false;
    element: JQuery;
    inputBarType: string = "search";
    menuList: Array<utils.IMenuElement>;
    properties: IShortcutProperties = {
        shortcutFocusBookmarkList: " ",
        shortcutFocusSearchField: " ",
        shortcutRemoveBookmark: " ",
        shortcutAddBookmark: " ",
        shortcutUseDefaults: " "
    };
    showButtons: boolean = false;
    showFocused: boolean = true;
    showSearchField: boolean = false;
    timeout: ng.ITimeoutService;
    titleDimension: string = "Bookmarks";
    selectBookmarkToggle: boolean = true;
    inputStates = new utils.StateMachineInput<eStateName>();
    inputBarFocus: boolean = false;
    //#endregion

    //#region elementHeight
    private _elementHeight: number = 0;
    get elementHeight(): number {
        return this._elementHeight;
    }
    set elementHeight(value: number) {
        if (this.elementHeight !== value) {
            try {
                this._elementHeight = value;
                if (this.bookmarkList && this.bookmarkList.obj) {
                    this.bookmarkList.obj.emit("changed", utils.calcNumbreOfVisRows(this.elementHeight));
                }
            } catch (err) {
                this.logger.error("error in setter of elementHeight", err);
            }
        }
    }
    //#endregion

    //#region model
    private _model: EngineAPI.IGenericObject;
    get model(): EngineAPI.IGenericObject {
        return this._model;
    }
    set model(value: EngineAPI.IGenericObject) {
        if (value !== this._model) {
            try {
                this._model = value;
                let bmp = {
                    "qInfo": { "qType": "BookmarkList" },
                    "qBookmarkListDef": { "qType": "bookmark" }
                };
                this.registrateSelectionObject();
                let that = this;
                value.on("changed", function() {
                    value.getProperties()
                    .then((res) => {
                        that.setProperties(res.properties);
                    })
                    .catch((error) => {
                        this.logger.error("ERROR in setter of model", error);
                    });
                });

                this.model.app.createSessionObject(bmp)
                .then((bookmarkObject: EngineAPI.IGenericObject) => {
                    let that = this;
                    bookmarkObject.on("changed", function () {

                        this.getLayout()
                        .then((bookmarkLayout: EngineAPI.IGenericBookmarkListLayout) => {

                            let bookmarkObject = new utils.Q2gIndObject(
                                new utils.AssistHyperCubeBookmarks(bookmarkLayout));

                            that.bookmarkList = new utils.Q2gListAdapter(bookmarkObject, utils.calcNumbreOfVisRows(that.elementHeight),
                                bookmarkLayout.qBookmarkList.qItems.length, "bookmark");
                        })
                        .catch((error) => {
                            this.logger.error("Error in on change of bookmark object", error);
                        });
                    });
                    bookmarkObject.emit("changed");
                })
                .catch((error) => {
                    this.logger.error("Error in setter of model", error);
                });
                this.model.emit("changed");
            } catch (e) {
                this.logger.error("error", e);
            }
        }
    }
    //#endregion

    //#region theme
    private _theme: string;
    get theme(): string {
        if (this._theme) {
            return this._theme;
        }
        return "default";
    }
    set theme(value: string) {
        if (value !== this._theme) {
            this._theme = value;
        }
    }
    //#endregion

    //#region headerInput
    private _headerInput: string = "";
    public get headerInput(): string {
        return this._headerInput;
    }
    public set headerInput(v : string) {
        if (v !== this._headerInput) {
            try {
                this._headerInput = v;
                if (!(this.inputStates.relStateName === eStateName.addBookmark)) {
                    this.bookmarkList.obj.searchFor(!v? "": v)
                    .then(() => {
                        this.bookmarkList.obj.emit("changed", utils.calcNumbreOfVisRows(this.elementHeight));
                        this.bookmarkList.itemsCounter = (this.bookmarkList.obj as any).model.calcCube.length;
                        this.timeout();
                    })
                    .catch((error) => {
                        this.logger.error("error", error);
                    });
                } else {
                    if(this.menuList[0].isEnabled) {
                        this.menuList[0].isEnabled = false;
                        this.menuList = JSON.parse(JSON.stringify(this.menuList));
                    }
                }
            } catch (error) {
                this.logger.error("ERROR", error);
            }
        }
    }
    //#endregion

    //#region focusedPosition
    private _focusedPosition: number;
    public get focusedPosition(): number {
        return this._focusedPosition;
    }
    public set focusedPosition(v : number) {
        this.logger.info("v", v);
        if (!v || v !== this._focusedPosition) {
            this._focusedPosition = v;
            if (v < 0) {
                this.logger.info("in if");
                this.menuList[0].isEnabled = true;
                this.menuList[2].isEnabled = true;
            } else {
                this.logger.info("in else");
                this.menuList[0].isEnabled = false;
                this.menuList[2].isEnabled = false;

            }

            this.menuList = JSON.parse(JSON.stringify(this.menuList));
        }
    }
    //#endregion

    //#region logger
    private _logger: logging.Logger;
    private get logger(): logging.Logger {
        if (!this._logger) {
            try {
                this._logger = new logging.Logger("BookmarkController");
            } catch (e) {
                this.logger.error("ERROR in create logger instance", e);
            }
        }
        return this._logger;
    }
    //#endregion

    static $inject = ["$timeout", "$element", "$scope"];

    /**
     * init of the controller for the Directive
     * @param timeout
     * @param element
     */
    constructor(timeout: ng.ITimeoutService, element: JQuery, scope: ng.IScope) {
        this.element = element;
        this.timeout = timeout;

        this.initMenuElements();
        this.initInputStates();

        $(document).on("click", (e: JQueryEventObject) => {
            try {
                if (element.find(e.target).length === 0) {
                    this.showFocused = false;
                    this.showButtons = false;
                    this.showSearchField = false;
                    this.headerInput= null;
                    this.timeout();
                }
            } catch (e) {
                this.logger.error("Error in Constructor with click event", e);
            }
        });

        scope.$watch(() => {
            return this.element.width();
        }, () => {
            this.elementHeight = this.element.height();
        });
    }

    /**
     * checks if the extension is used in Edit mode
     */
    isEditMode(): boolean {
        if (this.editMode) {
            return true;
        } else {
            return false;
        }
    }

    /**
     * callback when selection a value of the list
     * @param pos position from the selected value
     */
    selectObjectCallback(pos: number): void {
        setTimeout(() => {
            this.selectBookmarkToggle = true;
            this.showFocused = true;
            this.showButtons = true;

            this.model.app.applyBookmark(this.bookmarkList.collection[pos].id[0] as string)
            .then(() => {
                this.focusedPosition = pos + this.bookmarkList.itemsPagingTop;
                for (let x of this.bookmarkList.collection) {
                    x.status = "A";
                }
                this.bookmarkList.collection[pos].status = "S";
            })
            .catch((error) => {
                this.logger.error("ERROR in selectListObjectCallback", error);
            });
        }, this.actionDelay);
    }

    /**
     * function which gets called, when the buttons of the menu list gets hit
     * @param item name of the button which got activated
     */
    menuListActionCallback(item: string): void {
        this.logger.info("callback", item);
        switch (item) {
            case "Remove Bookmark":
                this.removeBookmark(this.bookmarkList.collection[this.focusedPosition].id[0] as string);
                break;

            case "Add Bookmark":
                this.controllingInputBarOptions(eStateName.addBookmark);
                break;

            case "Confirm Selection":
                this.applyButtonAction();
        }
    }

    /**
     * shortcuthandler, called when shortcut is hit
     * @param shortcutObject object wich gives you the shortcut name and the element, from which the shortcut come from
     */
    shortcutHandler(shortcutObject: directives.IShortcutObject, domcontainer: utils.IDomContainer): boolean {
        this.logger.info("",shortcutObject);
        switch (shortcutObject.name) {

            //#region focusList
            case "focusList":
            try {
                this.showFocused = true;
                this.timeout();
                if (this.focusedPosition < 0 || this.focusedPosition >= this.bookmarkList.collection.length) {
                    this.focusedPosition = 0;
                    domcontainer.element.children().children().children()[0].focus();
                    this.timeout();
                    return true;
                }

                if (this.focusedPosition < this.bookmarkList.itemsPagingTop) {
                    this.bookmarkList.itemsPagingTop = this.focusedPosition;
                } else if (this.focusedPosition >
                    this.bookmarkList.itemsPagingTop + utils.calcNumbreOfVisRows(this.elementHeight)) {
                    this.bookmarkList.itemsPagingTop
                        = this.focusedPosition - (utils.calcNumbreOfVisRows(this.elementHeight) + 1);
                }

                    domcontainer.element.children().children().children().children()[
                    this.focusedPosition - this.bookmarkList.itemsPagingTop
                ].focus();
                return true;
            } catch (e) {
                this.logger.error("Error in shortcut Handler", e);
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
                } catch (e) {
                    this.logger.error("Error in shortcutHandlerExtensionHeader", e);
                    return false;
                }
            //#endregion

            //#region removeBookmark
            case "removeBookmark":
                this.removeBookmark(this.bookmarkList.collection[this.focusedPosition].id[0] as string);
                break;
            //#endregion

            //#region addBookmark
            case "addBookmark":
                this.controllingInputBarOptions(eStateName.addBookmark);
                break;
            //#endregion

            //#region searchBookmark
            case "searchBookmark":
                this.controllingInputBarOptions(eStateName.searchBookmark);
                break;
            //#endregion
        }
        return false;
    }

    /**
     * callback when enter on input field
     */
    extensionHeaderAccept() {
        switch (this.inputStates.relStateName) {
            case eStateName.addBookmark:
            this.addBookmark();
                break;
        }
    }

    /**
     * saves the Properties from the getLayout call from qlik enine in own Object
     * @param properties Properties from getLayout call
     */
    private setProperties(properties: IShortcutProperties): Promise<boolean> {
        return new Promise((resolve, reject) => {
            this.properties.shortcutFocusBookmarkList = properties.shortcutFocusBookmarkList;
            this.properties.shortcutFocusSearchField = properties.shortcutFocusSearchField;
            this.properties.shortcutRemoveBookmark = properties.shortcutRemoveBookmark;
            this.properties.shortcutAddBookmark = properties.shortcutAddBookmark;
            // if (properties.useAccessibility) {
            //     this.timeAriaIntervall = parseInt(properties.aria.timeAria, 10);
            //     this.actionDelay = parseInt(properties.aria.actionDelay, 10);
            // }
            // this.useReadebility = properties.aria.useAccessibility;
        });
    }

    /**
     * removes the bookmark from the app
     * @param id the id of the bookmark
     */
    private removeBookmark(id: string) {
        this.model.app.destroyBookmark(id);
    }

    /**
     * controlling the options set to create a bookmark in the header input
     */
    private controllingInputBarOptions(type:eStateName): void {

        switch (type) {
            case eStateName.addBookmark:
                this.inputStates.relStateName = eStateName.addBookmark;
                break;

            case eStateName.searchBookmark:
                this.inputStates.relStateName = eStateName.searchBookmark;
                break;
        }

        this.inputBarFocus = true;
        this.headerInput = "";
        this.showButtons = true;
        this.showSearchField = true;
        this.timeout();
    }

    /**
     * fills the Menu with Elements
     */
    private initMenuElements(): void {
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
            isEnabled: true,
            icon: "minus",
            name: "Remove Bookmark",
            hasSeparator: false,
            type: "menu"
        });

    }

    /**
     * registrate the selection object to handle change on selections
     */
    private registrateSelectionObject(): Promise<boolean> {
        return new Promise((resolve, reject) => {

            let params: EngineAPI.IGenericObjectProperties = {
                "qInfo": {
                    "qId": "",
                    "qType": "SessionLists"
                },
                "qSelectionObjectDef": {}
            };

            this.model.app.createSessionObject(params)
            .then((object) => {
                let that = this;
                object.on("changed", function () {
                    this.getLayout()
                    .then(() => {
                        if (!that.selectBookmarkToggle) {
                            for (let element of that.bookmarkList.collection) {
                                element.status = "O";
                            }
                        }
                        that.selectBookmarkToggle = false;
                    })
                    .catch((error) => {
                        this.logger.error("ERROR in on change of selection objcet", error);
                    });
                });
                object.emit("changed");
            })
            .catch((error) => {
                this.logger.error("ERROR in checkIfSelectionChanged", error);
            });
            resolve(true);
        });
    }

    /**
     * initialisation of the stats from the input Bar
     */
    private initInputStates(): void {

        let addBookmarkState: utils.IStateMachineState<eStateName> = {
            name: eStateName.addBookmark,
            icon: "lui-icon--bookmark",
            placeholder: "enter Bookmark Name",
            acceptFunction : this.addBookmark
        };

        this.inputStates.addState(addBookmarkState);

        this.inputStates.relStateName = null;
    }

    /**
     * creates a new bookmark
     */
    private addBookmark() {
        try {
            let bookmarkProperties: EngineAPI.IGenericBookmarkProperties = {
                "qMetaDef": {
                    "title": this.headerInput
                },
                "creationDate": (new Date()).toISOString(),
                "qInfo": {
                    "qType": "bookmark"
                }
            };
            this.model.app.createBookmark(bookmarkProperties)
            .catch((error) => {
                this.logger.error("error during creation of Bookmark", error);
            });
            this.headerInput = null;
        } catch (error) {
            this.logger.error("Error in setter of input Accept", error);
        }
    }

    private applyButtonAction() {
        if(this.inputStates.relStateName === eStateName.addBookmark) {
            this.addBookmark();
        } else {
            this.selectObjectCallback(this.focusedPosition);
        }
    }
}

export function BookmarkDirectiveFactory(rootNameSpace: string): ng.IDirectiveFactory {
    "use strict";
    return ($document: ng.IAugmentedJQuery, $injector: ng.auto.IInjectorService, $registrationProvider: any) => {
        return {
            restrict: "E",
            replace: true,
            template: utils.templateReplacer(template, rootNameSpace),
            controller: BookmarkController,
            controllerAs: "vm",
            scope: {},
            bindToController: {
                model: "<",
                theme: "<?",
                editMode: "<?"
            },
            compile: ():void => {
                utils.checkDirectiveIsRegistrated($injector, $registrationProvider, rootNameSpace,
                    directives.ListViewDirectiveFactory(rootNameSpace), "Listview");
                utils.checkDirectiveIsRegistrated($injector, $registrationProvider, rootNameSpace,
                    directives.IdentifierDirectiveFactory(rootNameSpace), "Identifier");
                utils.checkDirectiveIsRegistrated($injector, $registrationProvider, rootNameSpace,
                    directives.ShortCutDirectiveFactory(rootNameSpace), "Shortcut");
                utils.checkDirectiveIsRegistrated($injector, $registrationProvider, rootNameSpace,
                    directives.ExtensionHeaderDirectiveFactory(rootNameSpace), "ExtensionHeader");
            }
        };
    };
}