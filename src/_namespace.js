/****************************************************************************
namespace.js 

Creates the fcoo-namespace and create the function window.fcoo.namespace( namespaceString ) that checks and creates namespace
All namespaces are under window.fcoo
*****************************************************************************/

;( function(window, document, undefined){ //Uses $ as alias for jQuery and window as local variable.
//******************************************
  "use strict";

	window.fcoo = window.fcoo || {};

	window.fcoo.namespace = function namespace( namespaceString ) {
    var parts = namespaceString.split('.'),
        parent = window,
        currentPart = '', i;    
		//Force first namespace-level to be 'fcoo'
		if (parts[0] != 'fcoo'){
		  parts.splice(0, 0, "fcoo");
		}
    for(i=0; i<parts.length; i++) {
			currentPart = parts[i];
			parent[currentPart] = parent[currentPart] || {};
			parent = parent[currentPart];
    }
    return parent;
	};
})(this, document);



