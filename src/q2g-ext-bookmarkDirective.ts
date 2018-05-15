//#region imports
import { utils,
         logging,
         directives }           from "./node_modules/davinci.js/dist/umd/daVinci";
import * as template            from "text!./q2g-ext-bookmarkDirective.html";
//#endregion

//#region interfaces
export interface IShortcutProperties {
    shortcutFocusBookmarkList: string;
    shortcutFocusSearchField: string;
    shortcutRemoveBookmark: string;
    shortcutAddBookmark: string;
    shortcutUseDefaults: string;
    bookmarkType: string;
    useSheet: boolean;
}

interface IBookmarkPrivliges {
    bookmarkId: string;
    publish: boolean;
    delete: boolean;
    isPublic: boolean;
}
//#endregion

//#region enums
enum eStateName {
    addBookmark,
    searchBookmark
}
//#endregion

class BookmarkController implements ng.IController {

    //#region Variables
    actionDelay: number = 0;
    appIsPublic: boolean = false;
    bookmarkList: utils.IQ2gListAdapter;
    editMode: boolean = false;
    element: JQuery;
    inputBarFocus: boolean = false;
    inputBarType: string = "search";
    inputStates = new utils.StateMachineInput<eStateName>();
    menuList: Array<utils.IMenuElement>;
    privBookmarks: IBookmarkPrivliges[] = [];
    properties: IShortcutProperties = {
        shortcutFocusBookmarkList: " ",
        shortcutFocusSearchField: " ",
        shortcutRemoveBookmark: " ",
        shortcutAddBookmark: " ",
        shortcutUseDefaults: " ",
        bookmarkType: " ",
        useSheet: true
    };
    selectBookmarkToggle: boolean = true;
    sheetId: string;
    showButtons: boolean = false;
    showFocused: boolean = true;
    showSearchField: boolean = false;
    timeout: ng.ITimeoutService;
    titleDimension: string = "Bookmarks";
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

                this.registrateSelectionObject();
                let that = this;
                value.on("changed", function() {
                    that.logger.info("CHANGE from model called");
                    value.getProperties()
                    .then((res) => {
                        return that.setProperties(res.properties);
                    })
                    .then(() => {
                        that.createBookmarkListSessionObject();
                    })
                    .catch((error) => {
                        this.logger.error("ERROR in setter of model", error);
                    });
                });
                value.emit("changed");

            } catch (error) {
                this.logger.error("ERROR in setter of model", error);
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
                        this.bookmarkList.obj.emit("changed", this.bookmarkList.itemsPagingHeight);
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
        this._focusedPosition = v;
        if (v < 0) {
            this.menuList[0].isEnabled = true;
            this.showSearchField = false;
        } else {

            let bookPriv: IBookmarkPrivliges = this.privBookmarks[v];

            if(!this.appIsPublic) {
                this.menuList[2].isEnabled = false;
                this.menuList = JSON.parse(JSON.stringify(this.menuList));
                return;
            }

            this.menuList[2].isEnabled = true;
            this.menuList[3].isEnabled = true;
            this.menuList[4].isEnabled = true;

            if (bookPriv.delete) {
                this.menuList[2].isEnabled = false;
            }

            if (!bookPriv.isPublic && bookPriv.publish) {
                this.menuList[3].isEnabled = false;
            }

            if (bookPriv.isPublic && bookPriv.publish) {
                this.menuList[4].isEnabled = false;
            }
            this.menuList[0].isEnabled = false;
        }
        this.menuList = JSON.parse(JSON.stringify(this.menuList));
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

    $onInit(): void {
        this.logger.debug("initialisation from BookmarkController");
    }

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

        this.checkIfAppIsPublicOrDesktop()
        .then((result) => {
            this.appIsPublic = result;
        })
        .catch((error) => {
            this.logger.error("Error in checkIfAppIsPublicOrDesktop", error);
        });

        this.getSheetId()
        .then((sheetId) => {
            this.sheetId = sheetId;
        })
        .catch((error) => {
            this.sheetId = null;
            this.logger.error("ERROR in ", error);
        });

        $(document).on("click", (e: JQueryEventObject) => {
            try {
                if (element.find(e.target).length === 0) {
                    this.clearHeader();
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

    //#region public functions
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
        this.logger.info("fcn called: selectObjectCallback");

        setTimeout(() => {

            this.selectBookmarkToggle = true;
            this.showFocused = true;
            this.showButtons = true;

            this.model.app.applyBookmark(this.bookmarkList.collection[pos].id[0] as string)
            .then(() => {
                this.focusedPosition = pos + this.bookmarkList.itemsPagingTop;
                let statSave = this.bookmarkList.collection[pos].status;
                for (let x of this.bookmarkList.collection) {
                    if(x.status.indexOf("P")!==-1) {
                        x.status = "AP";
                    } else {
                        x.status = "A";
                    }
                }
                if (statSave.indexOf("P")!==-1) {
                    this.bookmarkList.collection[pos].status = "SP";
                } else {
                    this.bookmarkList.collection[pos].status = "S";
                }
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
        switch (item) {
            case "Remove Bookmark":
                this.removeBookmark(this.bookmarkList.collection[this.focusedPosition].id[0] as string);
                break;

            case "Add Bookmark":
                this.controllingInputBarOptions(eStateName.addBookmark);
                break;

            case "Confirm Selection":
                this.applyButtonAction();
                break;

            case "publish Bookmark":
                this.publishBookmark(this.bookmarkList.collection[this.focusedPosition].id[0] as string);
                break;

            case "unpublish Bookmark":
                this.unpublishBookmark(this.bookmarkList.collection[this.focusedPosition].id[0] as string);
                break;
        }
        this.showButtons = false;
        this.toggleActivOfMenuItems(false);
    }

    /**
     * shortcuthandler, called when shortcut is hit
     * @param shortcutObject object wich gives you the shortcut name and the element, from which the shortcut come from
     */
    shortcutHandler(shortcutObject: directives.IShortcutObject, domcontainer: utils.IDomContainer): boolean {
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
                        this.showSearchField = false;
                        this.inputStates.relStateName = eStateName.searchBookmark;
                        return true;
                    }

                    if (this.focusedPosition < this.bookmarkList.itemsPagingTop) {
                        this.bookmarkList.itemsPagingTop = this.focusedPosition;
                    } else if (this.focusedPosition >
                        this.bookmarkList.itemsPagingTop + this.bookmarkList.itemsPagingHeight) {
                        this.bookmarkList.itemsPagingTop
                            = this.focusedPosition - (this.bookmarkList.itemsPagingHeight + 1);
                    }
                    domcontainer.element.children().children().children().children()[
                        this.focusedPosition - this.bookmarkList.itemsPagingTop
                    ].focus();
                    this.showSearchField = false;
                    this.inputStates.relStateName = eStateName.searchBookmark;
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
    //#endregion

    //#region private functions

    /**
     * clearHeader: reset all necessary properties
     */
    private clearHeader() {
        this.toggleActivOfMenuItems(false);
        this.inputStates.relStateName = eStateName.searchBookmark;
        this.showFocused = false;
        this.showButtons = false;
        this.showSearchField = false;
        this.headerInput= "";
        this.timeout();
    }

    /**
     * setProperties: sets the properies from the model object
     * @param properties properties from the propertie panel from the model object
     */
    private setProperties(properties: IShortcutProperties): Promise<void> {
        this.logger.info("fcn called: setProperties", properties);

        return new Promise((resolve, reject) => {
            try {
                this.properties.shortcutFocusBookmarkList = properties.shortcutFocusBookmarkList;
                this.properties.shortcutFocusSearchField = properties.shortcutFocusSearchField;
                this.properties.shortcutRemoveBookmark = properties.shortcutRemoveBookmark;
                this.properties.shortcutAddBookmark = properties.shortcutAddBookmark;
                this.properties.shortcutAddBookmark = properties.shortcutAddBookmark;
                this.properties.shortcutAddBookmark = properties.shortcutAddBookmark;
                this.properties.bookmarkType = properties.bookmarkType?properties.bookmarkType:"bookmark";
                this.properties.useSheet = properties.useSheet;
                resolve();
            } catch (error) {
                reject(error);
            }
        });
    }

    /**
     * toggleActivOfMenuItems: set the menu items to active or deactive
     * @param toggle set the menu items to active or deactive
     */
    private toggleActivOfMenuItems(toggle: boolean): void {
        this.logger.info("fcn called: toggleActivOfMenuItems");
        this.menuList[2].isEnabled = !toggle;
        if (this.appIsPublic) {
            this.menuList[3].isEnabled = !toggle;
            this.menuList[4].isEnabled = !toggle;
        }
    }

    private removeBookmark(id: string) {
        this.model.app.destroyBookmark(id);
    }

    /**
     * getSheetId: returns the sheet ID of the current sheet
     * @returns: Promise with the sheet ID in the resolve
     */
    private getSheetId(): Promise<string> {
        this.logger.info("fcn called: getSheetId");

        return new Promise((resolve, reject) => {

            this.model.app.getAllInfos()
            .then((allInfo) => {
                let sheets: EngineAPI.INxInfo[] = [];
                for (const info of allInfo) {
                    if (info.qType === "sheet") {
                        sheets.push(info);
                    }
                }
                for (const sheet of sheets) {
                    let sheetObject: EngineAPI.IGenericObject;
                    this.model.app.getObject(sheet.qId)
                    .then((res) => {
                        sheetObject = res;
                        return res.getFullPropertyTree();
                    })
                    .then((res) => {
                        let sheetId: string;
                        for (const iterator of res.qChildren) {
                            if (iterator.qProperty.qInfo.qId === this.model.id) {
                                sheetId = sheetObject.id;
                            }
                        }
                        resolve(sheetId);
                    })
                    .catch((error) => {
                        Promise.reject(error);
                    });
                }
            })
            .catch((error) => {
                reject(error);
            });
        });
    }

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
     * initMenuElements: creates the menu elements for the header bar
     */
    private initMenuElements(): void {
        this.logger.info("fcn called: initMenuElements");
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
        this.menuList.push({
            buttonType: "",
            isVisible: true,
            isEnabled: true,
            icon: "triangle-top",
            name: "publish Bookmark",
            hasSeparator: false,
            type: "menu"
        });
        this.menuList.push({
            buttonType: "",
            isVisible: true,
            isEnabled: true,
            icon: "triangle-bottom",
            name: "unpublish Bookmark",
            hasSeparator: false,
            type: "menu"
        });

    }

    private registrateSelectionObject(): Promise<boolean> {
        this.logger.info("fcn call: registrateSelectionObject");

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
     * initInputStates: function to set the several states of the input field
     */
    private initInputStates(): void {
        this.logger.info("fcn called: initInputStates");

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
     * addBookmark: creats a bookmark on the applikation with the inserted name
     */
    private addBookmark(): void {
        try {
            let bookmarkProperties: EngineAPI.IGenericBookmarkProperties;

            bookmarkProperties = {
                "qMetaDef": {
                    "title": this.headerInput
                },
                "creationDate": (new Date()).toISOString(),
                "qInfo": {
                    "qType": this.properties.bookmarkType
                }
            };
            if (this.properties.useSheet && this.sheetId!==null) {
                bookmarkProperties.sheetId =  this.sheetId;
            }

            this.logger.info("bookmark Properties", bookmarkProperties);
            this.model.app.createBookmark(bookmarkProperties)
            .then((object) => {
                this.clearHeader();
                setTimeout(() => {

                    object.getLayout()
                    .then((layout) => {
                        for (let privBookmark of this.privBookmarks) {
                            if (privBookmark.bookmarkId === layout.qInfo.qId) {
                                privBookmark.delete = true;
                                privBookmark.publish = true;
                                privBookmark.isPublic = false;
                            }
                        }
                    })
                    .catch((error) => {
                        this.logger.error("ERROR in addBookmark", error);
                    });
                }, 100);
            })
            .catch((error) => {
                this.logger.error("error during creation of Bookmark", error);
            });
            this.headerInput = "";
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

    private publishBookmark(id: string) {
        this.logger.info("fcn called: ", id);
        this.model.app.getBookmark(id)
        .then((object) => {
            object.publish();
        })
        .catch((error) => {
            this.logger.error("Bookmark could not be unpublished");
        });
    }

    private unpublishBookmark(id: string) {
        this.model.app.getBookmark(id)
        .then((object) => {
            object.unPublish();
        })
        .catch((error) => {
            this.logger.error("Bookmark could not be unpublished");
        });
    }

    private checkIfAppIsPublicOrDesktop(): Promise<boolean> {
        this.logger.info("fcn called: checkIfAppIsPublicOrDesktop");

        return new Promise((resolve, reject) => {
            this.model.app.getAppProperties()
            .then((props) => {
                if (!(props as any).published) {
                    resolve(false);
                }
                resolve(true);
            })
            .catch((error) => {
                reject(error);
            });
        });
    }

    /**
     * createBookmarkListSessionObject: creates the session object for the bookmak list
     */
    private createBookmarkListSessionObject(): void {
        this.logger.info("fcn called: createBookmarkListSessionObject");

        let bmp = {
            "qInfo": {
                qType: "BookmarkList"
            },
            "qBookmarkListDef": {
                qType: this.properties.bookmarkType
            }
        };

        this.logger.info("create session object with: ", bmp);
        this.model.app.createSessionObject(bmp)
        .then((bookmarkObject: EngineAPI.IGenericObject) => {
            let that = this;
            bookmarkObject.on("changed", function () {
                that.logger.info("CHANGED from bookmark list");

                this.getLayout()
                .then((bookmarkLayout: EngineAPI.IGenericBookmarkListLayout) => {
                    let bookmarkObject = new utils.Q2gIndObject(
                        new utils.AssistHyperCubeBookmarks(bookmarkLayout));

                    that.privBookmarks = [];
                    for (const i of bookmarkObject.model.calcCube) {
                        for (const i2 of bookmarkLayout.qBookmarkList.qItems) {
                            if (i.cId === i2.qInfo.qId) {
                                that.privBookmarks.push(that.getPrivliges(i2));
                                if ((i2.qMeta as any).published) {
                                    i.qState = "P";
                                }
                            }
                        }
                    }

                    that.bookmarkList = new utils.Q2gListAdapter(bookmarkObject,
                        bookmarkLayout.qBookmarkList.qItems.length, 0, "bookmark");

                    that.bookmarkList.itemsCounter = bookmarkLayout.qBookmarkList.qItems.length;
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
    }

    private getPrivliges(bookmarkLayout: EngineAPI.IGenericBaseLayout): IBookmarkPrivliges {
        let priv: IBookmarkPrivliges = {
            bookmarkId: bookmarkLayout.qInfo.qId,
            delete: false,
            publish: false,
            isPublic: false,
        };

        if ((bookmarkLayout.qMeta as any).privileges) {
            priv.delete = (bookmarkLayout.qMeta as any).privileges.indexOf("delete")!==-1?true:false;
            priv.publish = (bookmarkLayout.qMeta as any).privileges.indexOf("publish")!==-1?true:false;
            priv.isPublic = (bookmarkLayout.qMeta as any).published;
        }
        return priv;
    }
    //#endregion
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