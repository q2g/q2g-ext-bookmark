define( [
    "jquery"
],
function ( $ ) {
    "use strict";

    return {

        //Paint resp.Rendering logic
        paint( $element, layout ) {

            $element.empty();
            var $placeholder = $("<div>");
            $placeholder.html( `<h1>Hi, thanks for downloading this extension.</h1><br/>
                Unfortunately the extension was not build correct. 
                Please retry the build process, or download the Extension from 
                <a href="https://m.sense2go.net/extension-package" target="blank">here</a><br/><br/>
                <h2>Best Regards q2g</h2>`);
            $element.append( $placeholder );

        }
    };
} );