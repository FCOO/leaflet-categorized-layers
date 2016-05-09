/****************************************************************************
	leaflet-categorized-layers.js, 

	https://github.com/FCOO/leaflet-categorized-layers
	https://github.com/FCOO

****************************************************************************/
;(function ($, L, window, document, undefined) {
	"use strict";

L.Control.CategorizedLayers = L.Control.Layers.extend({
  options: {
		VERSION: "0.1.0",
    collapsed: true,
    groupsCollapsed: true,
    collapseActiveGroups: false,
    position: 'topright',
    mobileMode: false,
    autoZIndex: true
  },
  
  initialize: function (baseLayers, overlays, options) {
    L.setOptions(this, options);

    var className = 'leaflet-control-layers';
    this._container = L.DomUtil.create('div', className);

    this._layers = {};
    this._overlays = {};
    this._groups = {
      "baseLayer": {},
      "overlay": {}
    };
    this._lastZIndex = 0;
    this._handlingClick = false;
    for (var layerCategory in baseLayers) {
      this._layers[layerCategory] = {};
      for (var baseLayer in baseLayers[layerCategory]) {
        baseLayers[layerCategory][baseLayer]._category = layerCategory;
        baseLayers[layerCategory][baseLayer]._name = baseLayer;
        baseLayers[layerCategory][baseLayer]._overlay = false;
        baseLayers[layerCategory][baseLayer]._categoryType = "baseLayer";
        this._addLayer(baseLayers[layerCategory][baseLayer], layerCategory, false);
      }
    }

    for (var overlayCategory in overlays) {
      this._overlays[overlayCategory] = {};
      for (var overlay in overlays[overlayCategory]) {
        overlays[overlayCategory][overlay]._category = overlayCategory;
        overlays[overlayCategory][overlay]._name = overlay;
        overlays[overlayCategory][overlay]._overlay = true;
        overlays[overlayCategory][overlay]._categoryType = "overlay";
        this._addLayer(overlays[overlayCategory][overlay], overlayCategory, true);
      }
    }
  },
  _onLayerChange: function (e) {
    var category = e.layer._overlay ? this._overlays[e.layer._category] : this._layers[e.layer._category];

    if (!category) { return; }
    
    var obj = category[L.stamp(e.layer)];
    
    if (!obj) { return; }

    if (!this._handlingClick) {
      this._update();
    }

    var type = obj._overlay ?
      (e.type === 'layeradd' ? 'overlayadd' : 'overlayremove') :
      (e.type === 'layeradd' ? 'baselayerchange' : null);

    if (type) {
      this._map.fire(type, e);
    }
  },
  addBaseLayer: function (layer, category, name) {
    layer._category = category;
    layer._name = name;
    layer._overlay = false;
    layer._categoryType = "baseLayer";
    this._addLayer(layer, category);
    this._update();
    return this;
  },
  addOverlay: function (layer, category, name) {
    layer._category = category;
    layer._name = name;
    layer._overlay = true;
    layer._categoryType = "overlay";
    this._addLayer(layer, category);
    this._update();
    return this;
  },
  removeLayer: function (layer) {
    var id = L.stamp(layer);
    delete this._layers[id];
    this._update();
    return this;
  },
  _addLayer: function (obj, category, overlay) {
    var id = L.stamp(obj);
    if(obj._overlay || overlay) {
      if(!this._overlays[obj._category]) this._overlays[obj._category] = {};
      this._overlays[obj._category][id] = obj;
    } else {
      if(!this._layers[obj._category]) this._layers[obj._category] = {};
      this._layers[obj._category][id] = obj;
    }
    
    if (this.options.autoZIndex && obj.setZIndex) {
      this._lastZIndex++;
      obj.setZIndex(this._lastZIndex);
    }
  },
  _update: function () {
    if (!this._container) {
      return;
    }

    this._baseLayersList.innerHTML = '';
    this._overlaysList.innerHTML = '';
    this._groups = {
      "baseLayer": {},
      "overlay": {}
    };

    var baseLayersPresent = false,
        overlaysPresent = false,
        obj;

    // Initialize select
    if (this.options.mobileMode) {
      var className = 'leaflet-control-layers';
      this._baseLayersSelect =  $(L.DomUtil.create('select', className + '-group', this._baseLayersList));
      this._overlaysSelect = $(L.DomUtil.create('select', className + '-group', this._overlaysList));
      this._baseLayersSelect.on('change', this, this._onSelectChange);
      this._overlaysSelect.on('change', this, this._onSelectChange);
      this._overlaysSelect.attr('multiple', 'multiple');
    }

    for (var baseLayerCategory in this._layers) {
      for (var baseLayer in this._layers[baseLayerCategory]) {
        obj = this._layers[baseLayerCategory][baseLayer];
        this._addItem(obj);
        overlaysPresent = overlaysPresent || obj._overlay;
        baseLayersPresent = baseLayersPresent || !obj._overlay;
      }
    }

    for (var overlayCategory in this._overlays) {
      for (var overlay in this._overlays[overlayCategory]) {
        obj = this._overlays[overlayCategory][overlay];
        this._addItem(obj);
        overlaysPresent = overlaysPresent || obj._overlay;
        baseLayersPresent = baseLayersPresent || !obj._overlay;
      }
    }

    this._separator.style.display = overlaysPresent && baseLayersPresent ? '' : 'none';
  },
  _addItem: function (obj) {
    var className = 'leaflet-control-layers',
				input, appendTo, selected, layer, container;

    if(!this._groups[obj._categoryType][obj._category]) {
      if (this.options.mobileMode) {
          var headerOption = $('<option></option>').val(obj._category).html(obj._category);
          var select = obj._overlay ? this._overlaysSelect : this._baseLayersSelect;
          this._groups[obj._categoryType][obj._category] = select;
          select.append(headerOption);
          headerOption.attr('disabled','disabled');
          headerOption.prop('layerId', L.stamp(obj));
          headerOption.prop('category', obj._category);
          headerOption.prop('overlay', obj._overlay);
      } else {
          var group = L.DomUtil.create('div', className + '-group');
          var groupHeader = document.createElement('span');
          var collapsed = this.options.groupsCollapsed ? groupHeader.innerHTML = ' &#9658; ' : groupHeader.innerHTML = ' &#9660; ';
          groupHeader.innerHTML += obj._category;
          groupHeader.className = 'groupHeader';
          groupHeader.category = obj._category;
          groupHeader.collapsed = collapsed;
          L.DomEvent.on(groupHeader, 'click', this._onLabelClick);
          group.appendChild(groupHeader);
          var layers = document.createElement('span');
          layers.className = 'groupLayers';
          if(collapsed) {
            layers.style.height = '0';
            layers.style.display = 'none';
          }
          group.appendChild(layers);
          this._groups[obj._categoryType][obj._category] = layers;
          container = obj._overlay ? this._overlaysList : this._baseLayersList;
          container.appendChild(group);
      }
    }

    appendTo = this._groups[obj._categoryType][obj._category];
    selected = this._map.hasLayer(obj);

    if (this.options.mobileMode) {
        var option = $('<option></option>').val(obj._name).html(obj._name);
        $(appendTo).append(option);
        option.prop('layerId', L.stamp(obj));
        option.prop('category', obj._category);
        option.prop('overlay', obj._overlay);
        option.prop('layer', obj);
        option.prop('selected', selected);
    } else {
        layer = document.createElement('label');
        if((selected) && (!this.options.collapseActiveGroups)) {
          appendTo.previousSibling.innerHTML = ' &#9660; '+appendTo.previousSibling.category;
          appendTo.previousSibling.collapsed = false;
          appendTo.style.height = '100%';
          appendTo.style.display = 'block';
        }
    
        if (obj._overlay) {
          input = document.createElement('input');
          input.type = 'checkbox';
          input.className = 'leaflet-control-layers-selector';
          input.defaultChecked = selected;
        } else {
          input = this._createRadioElement('leaflet-base-layers', selected);
        }
    
        input.layerId = L.stamp(obj);
        input.category = obj._category;
        input.overlay = obj._overlay;

        layer.appendChild(input);
 
        // Convert check boxes to radio buttons for layers with primadonna option
        var objA = input.overlay ? this._overlays[input.category][input.layerId] : this._layers[input.category][input.layerId];
        $(input).createRadioCheckbox(objA.options.primadonna ? 'input-radio' : null);
        $(input).parent().css({
          display:'inline-block',
          top: '1px',
          'margin-top': '2px',
          'margin-right': '2px'
        });

        var name = document.createElement('span');
        name.innerHTML = ' ' + obj._name;
        layer.appendChild(name);
        L.DomEvent.on(layer, 'click', this._onInputClick, this);
        appendTo.appendChild(layer);
        return layer;
    }
  },
  _onLabelClick: function () {
    if(!this.collapsed) {
      this.collapsed = true;
      this.innerHTML = ' &#9658; ' + this.category;
      $(this).next().css({
          height: '0',
          display: 'none'
      });
    } else {
      this.collapsed = false;
      this.innerHTML = ' &#9660; ' + this.category;
      $(this).next().css({
          height: '100%',
          display: 'block'
      });
    }
  },
  _onSelectChange: function (evt) {
    var i, j, input,
        data = evt.data,
        selects = evt.data._form.getElementsByTagName('select'),
	      selectsLen = selects.length,
				selectedOption = evt.originalEvent.explicitOriginalTarget,
				jAdded = null,
				iAdded = null,
				obj,
				inputs,
				inputsLen;

    this._handlingClick = true;
		
		for (j = 0; j < selectsLen; j++) {
      inputs = selects[j].options;
      inputsLen = inputs.length;
      for (i = 0; i < inputsLen; i++) {
        input = inputs[i];
        if ($(input).attr('disabled') !== 'disabled') {
          obj = input.overlay ? data._overlays[input.category][input.layerId] : data._layers[input.category][input.layerId];
          if (input.selected && !data._map.hasLayer(obj)) {
            data._map.addLayer(obj);
            jAdded = j;
            iAdded = i;
            data._map.fire('overlayadd');
          } else if (!input.selected && data._map.hasLayer(obj)) {
            data._map.removeLayer(obj);
            data._map.fire('overlayremove');
          }
        }
      }
    }
    // Make sure that only one layer with the primadonna option is on stage
    // at the same time
    if (iAdded !== null) {
      var objA = selectedOption.layer;
      if (objA.options.primadonna) {
        for (i = 0; i < inputsLen; i++) {
          input = inputs[i];
          obj = input.overlay ? data._overlays[input.category][input.layerId] : data._layers[input.category][input.layerId];
          if (obj !== objA && input.selected && data._map.hasLayer(obj) && obj.options.primadonna) {
            // Manually toggle other primadonnas
            $(selects[jAdded].options[input.index]).prop("selected", false);
            // Manually call select handler to remove layer
            data._onSelectChange(evt);
          }
        }
      }
    }

    data._handlingClick = false;
  },  
  _onInputClick: function () {
    var i, input,
        inputs = this._form.getElementsByTagName('input'),
        inputsLen = inputs.length;

    this._handlingClick = true;

    var iAdded = null;
    var obj;
    for (i = 0; i < inputsLen; i++) {
      input = inputs[i];
      obj = input.overlay ? this._overlays[input.category][input.layerId] : this._layers[input.category][input.layerId];
      if (input.checked && !this._map.hasLayer(obj)) {
        this._map.addLayer(obj);
        iAdded = i;
        this._map.fire('overlayadd');
      } else if (!input.checked && this._map.hasLayer(obj)) {
        this._map.removeLayer(obj);
        this._map.fire('overlayremove');
      }
    }
    // Make sure that only one layer with the primadonna option is on stage
    // at the same time
    if (iAdded !== null) {
      input = inputs[iAdded];
      var objA = input.overlay ? this._overlays[input.category][input.layerId] : this._layers[input.category][input.layerId];
      if (objA.options.primadonna) {
        for (i = 0; i < inputsLen; i++) {
          input = inputs[i];
          obj = input.overlay ? this._overlays[input.category][input.layerId] : this._layers[input.category][input.layerId];
          if (obj !== objA && input.checked && this._map.hasLayer(obj) && obj.options.primadonna) {
            input.checked = false; // Manually toggle checkbox
            this._onInputClick(); // Manually call click handler
          }
        }
      }
    }

    this._handlingClick = false;
  },  
  _initLayout: function () {
    var className = 'leaflet-control-layers',
        container = this._container;

    //Makes this work on IE10 Touch devices by stopping it from firing a mouseout event when the touch is released
    //container.setAttribute('aria-haspopup', true);

    if (!L.Browser.touch) {
      L.DomEvent
        .disableClickPropagation(container)
        .disableScrollPropagation(container);
    } else {
      L.DomEvent.on(container, 'click', L.DomEvent.stopPropagation);
    }

    var form = this._form = L.DomUtil.create('form', className + '-list');

    if (this.options.collapsed) {
      var link = this._layersLink = L.DomUtil.create('a', className + '-toggle', container);
      link.href = '#';
      link.title = 'Layers';

      if (L.Browser.touch) {
        L.DomEvent
            .on(link, 'click', L.DomEvent.stop)
            .on(link, 'click', this._expand, this);
        L.DomEvent
          .disableClickPropagation(container)
          .disableScrollPropagation(container);
      }
      else {
        L.DomEvent.on(link, 'focus', this._expand, this);
      }
      //Work around for Firefox android issue https://github.com/Leaflet/Leaflet/issues/2033
      L.DomEvent.on(form, 'click', function () {
        setTimeout(L.bind(this._onInputClick, this), 0);
      }, this);

      this._map.on('click', this._collapse, this);
      //this._map.on('move', this._collapse, this);
      // TODO keyboard accessibility
    } else {
      this._expand();
    }

    this._baseLayersList = L.DomUtil.create('div', className + '-base', form);
    this._separator = L.DomUtil.create('div', className + '-sub-separator', form);
    this._overlaysList = L.DomUtil.create('div', className + '-overlays', form);
    container.appendChild(form);
  },
  _expand: function () {
    L.DomUtil.addClass(this._container, 'leaflet-control-layers-expanded');
  },
  _collapse: function () {
    this._container.className = this._container.className.replace(' leaflet-control-layers-expanded', '');
  },
  _checkDisabledLayers: function () {
    // Overridden with empty method. This means that we do not disable
    // layers outside allowed zoom range
  }
});

}(jQuery, L, this, document));



;/****************************************************************************
RADIOCHECKBOX.JS
Methods to create and modify input elements e.q. <input type="checkbox">
*****************************************************************************/

;( function($, L, window, document, undefined){ //Uses $ as alias for jQuery and window as local variable.
//******************************************
  "use strict";

	/******************************************
	RadioGroup
	Creates a group of radio-buttons.
	onChange = function(id, selected, radioGroup)
	allowZeroSelected: boolean. If true it is allowed to des-select a selected radio-button.
	If allowZeroSelected=true onChange will also be called on the un-selected radio-input
	******************************************/
	//RadioGroup = function( id, onChange, allowZeroSelected ){
	function RadioGroup( id, onChange, allowZeroSelected ){
		this.id = id;
		this.onChange	= onChange;
		this.allowZeroSelected = allowZeroSelected;
		this.selectedIndex = -1;
		this.children = [];
	
		/******************************************
		addChild
		Adds a input:radio to the group
		The $inputRadio is beeing altered using $.fn.createRadioCheckbox if it hasn't allready happened
		******************************************/
		this.addChild = function addChild( $inputRadio ){
			//If the radio-button isn't created => create it!
			if (!$inputRadio.parent().hasClass('input-radio') )
				$inputRadio.createRadioCheckbox();
		
			//If allowZeroSelected=true the radiobox is changed to a checkbox looking like a radio-button
			if (this.allowZeroSelected)
				$inputRadio.attr('type' ,'checkbox');	  
		
			var $this = this;
			$inputRadio.data('radio-group-index', this.children.length);
		
			$inputRadio.change( function(){ $this._onChange( $(this).data('radio-group-index') ); });
			this.children.push( $inputRadio );
		};
	
		this._onChange = function _onChange( index ){ 
			if (this.allowZeroSelected && (this.selectedIndex > -1)){
			  //Unselect the current selected radio-button
				this.onChange( this.children[this.selectedIndex].attr('id'), false, this);
				this.children[this.selectedIndex].prop('checked', false);
			}
	
			//If it was a unselection of a radio-button => no selected
			this.selectedIndex = this.selectedIndex == index ? -1 : index;
	
			if (this.selectedIndex > -1)
				this.onChange( this.children[this.selectedIndex].attr('id'), true, this);
		};
	}
	
	window.RadioGroup = RadioGroup;
	
	/******************************************
	Create checkbox and radio-input
	<div class="input-radio|input-checkbox">	
		<input type="radio|checkbox" value="None" id="..." name=".."/>
		<label for="slideTwo"></label>
	</div>
	*******************************************/
	var nextCheckboxId = 0;
	$.fn.createRadioCheckbox = function( forceType ) {	
		//className = the class for the div-element around
		var className = '';
		
		if (forceType) {
			className = forceType;
            if (forceType == 'input-radio') {
                this.addClass('display-as-radio');
            }
        } else {
		  if (this.hasClass('display-as-checkbox')) {
			className = 'input-checkbox';
          } else {
			if (this.hasClass('display-as-radio'))
			    className = 'input-radio';				  
			else
				className = (this.attr('type') == 'checkbox') ? 'input-checkbox' : 'input-radio';
          }
        }

		//Check if the input-element already is 'created'
		if (this.parent().hasClass( className ))
			return this;  
		
		var id = this.attr('id');
		if (!id){
			//Create default id
			id = '_defaultCheckbox_' + nextCheckboxId++;
			this.attr('id', id);
		}
		//Add a <div> with class=className around the input-element
		this.before('<div></div>').prev().addClass(className).append(this);
	
		//Adding <label> after
		$('<label></label>').insertAfter(this).attr('for', id);
	
		return this;
	};
	//*******************************************
	
	
	
	/************************************************************************************
	checkboxGroup
	The input acts as checkbox for a group of checkbokes. The state of the input is updated
	when any of the child-input is changed and all the child can be changed by clicking the input
	************************************************************************************/
	$.fn.checkboxGroup = function() {
		this.data('is-checkbox-group', true );
		this.data('checkbox-children', []);
	
		/************************************************************************
		When click on group input the checked-state of all children chamges
		************************************************************************/
		this.click ( function (){
			var uncheckAllChild = $(this).prop('checked');
			//Set all child to opposite state and trigger click
			$.each( $(this).data('checkbox-children'), function( indexInArray, $child ){
				$child
					.prop('checked', !uncheckAllChild)
					.trigger('click'); 
			});
		});
	
		/************************************************************************
		trigger('clickchild') is called when any of the child input are clicked
		************************************************************************/
		this.on('clickchild', function () { 
			//Count the number of checked and unchecked children
			var childChecked = 0;
			var childUnchecked = 0;
			$.each( $(this).data('checkbox-children'), function( indexInArray, $child ){
				if ($child.prop('checked'))
					childChecked++;
				else
					childUnchecked++;
			});
			//Update the group-input
			$(this).toggleClass('semi-selected', childChecked*childUnchecked !== 0);
			$(this).prop('checked', childChecked ? true : false);
		});
		return this;
	}; //$.fn.checkboxGroup = function() {..
	
	/**************************************
	checkboxGroupAddChild
	**************************************/
	$.fn.checkboxGroupAddChild = function( child ){
		var $this = this;
		child.data('checkbox-parent', this);
		var list = this.data('checkbox-children');
		list.push(child);
		this.data('checkbox-children', list);
		//Call the trigger for 'childclick' for the group-input
		child.click( function () { $this.trigger('clickchild'); });
		this.trigger('clickchild'); 
	};
	
	/**************************************
	checkboxGroupRemoveChild
	Remove child from the checkboxGroup
	**************************************/
	$.fn.checkboxGroupRemoveChild = function( child ){ 
		child.data('checkbox-parent', this);
		var list = this.data('checkbox-children');
		for (var i=0; i<list.length; i++ )
			if (list[i].get(0) == child.get(0)){ 
			  list.splice(i, 1);
				break;
			}
		this.data('checkbox-children', list);
		this.trigger('clickchild'); 
	};
	
	/**************************************
	removeFromCheckboxGroup
	Remove this from the checkboxGroup
	**************************************/
	$.fn.removeFromCheckboxGroup = function(){
		var checkboxGroup = this.data('checkbox-parent'); 
		if (checkboxGroup)
			checkboxGroup.checkboxGroupRemoveChild( this );
	};
	
	
	/**************************************
	checkbox_updateCheckboxGroup
	Update the checkboxGroup of this
	**************************************/
	$.fn.checkbox_updateCheckboxGroup = function(){
		var checkboxGroup = this.data('checkbox-parent'); 
		if (checkboxGroup)
			checkboxGroup.trigger('clickchild'); 
	};
	
	
	
	
	/******************************************
	Initialize checkbox and radio-input
	*******************************************/
	$(function() {	
		$('input:radio, input:checkbox').each ( function () { $(this).createRadioCheckbox(); });
	});
	
	
	
	
	
	
//*******************************************
})(jQuery, L, this, document);
