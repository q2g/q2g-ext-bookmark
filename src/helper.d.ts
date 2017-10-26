declare module "text!*" {
    var e: string; export = e;
}


declare namespace EngineAPI {
    interface IImplementOn {
        emit(event: "changed" | "closed"):void;
    }

}

interface IQVAngular {

    $injector: angular.auto.IInjectorService;

}

