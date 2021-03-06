/****************************************************************************
    leaflet-categorized-layers.js,

    https://github.com/FCOO/leaflet-categorized-layers
    https://github.com/FCOO

****************************************************************************/
(function ($, L/*, window, document, undefined*/) {
    "use strict";

    L.Control.CategorizedLayers = L.Control.Layers.extend({
        options: {
            VERSION             : "{VERSION}",
            minimized           : false,
            groupsCollapsed     : true,
            collapseActiveGroups: false,

            position     : 'topleft',
            iconClassName: 'fa-bars',
            header       : '',
            height       : 0.8,
            width        : 200,

            autoZIndex: true,

            //AddText = function to add test to element. Can be overwriten with user-defined function
            addText: function ( elem, text ){ elem.innerHTML += text; }
        },

        onAdd: function( map ){

            //Use the control-box as container
            var result = this.controlBox.onAdd( map );

            this._contentContainer = this.controlBox.contentContainer;

            L.Control.Layers.prototype.onAdd.call(this, map);

            return result;

        },

        initialize: function (baseLayers, overlays, options) {
            L.setOptions(this, options);

            //From L.Control.Layers.prototype.initialize:
            L.Control.Layers.prototype.initialize.call(this, null, null, options);
/*
            this._layerControlInputs = [];
            this._layers = [];
            this._lastZIndex = 0;
            this._handlingClick = false;
*/

            this.controlBox = new L.Control.Box(this.options);

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
                if ( !this._overlays[obj._category] )
                    this._overlays[obj._category] = {};
                this._overlays[obj._category][id] = obj;
            }
            else {
                if ( !this._layers[obj._category] )
                    this._layers[obj._category] = {};
                this._layers[obj._category][id] = obj;
            }

            if (this.options.autoZIndex && obj.setZIndex) {
                this._lastZIndex++;
                obj.setZIndex(this._lastZIndex);
            }
        },

        _update: function () {
            if (!this._contentContainer) {
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

            if ( !this._groups[obj._categoryType][obj._category]) {
                var group = L.DomUtil.create('div', className + '-group');
                var groupHeader = document.createElement('span');
                var collapsed = this.options.groupsCollapsed ? groupHeader.innerHTML = ' &#9658; ' : groupHeader.innerHTML = ' &#9660; ';

                this.options.addText( groupHeader, obj._category);

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

            appendTo = this._groups[obj._categoryType][obj._category];
            selected = this._map.hasLayer(obj);

            layer = document.createElement('label');
            if((selected) && (!this.options.collapseActiveGroups)) {

                appendTo.previousSibling.innerHTML = ' &#9660;';
                this.options.addText( appendTo.previousSibling, appendTo.previousSibling.category );

                appendTo.previousSibling.collapsed = false;
                appendTo.style.height = '100%';
                appendTo.style.display = 'block';
            }

            if (obj._overlay) {
                input = document.createElement('input');
                input.type = 'checkbox';
                input.className = 'leaflet-control-layers-selector';
                input.defaultChecked = selected;
            }
            else {
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
            this.options.addText( name, obj._name );

            layer.appendChild(name);
            L.DomEvent.on(layer, 'click', this._onInputClick, this);
            appendTo.appendChild(layer);
            return layer;
        },

        _onLabelClick: function () {
            if(!this.collapsed) {
                this.collapsed = true;
                this.innerHTML = ' &#9658; ' + this.category;
                $(this).next().css({
                    height: '0',
                    display: 'none'
                });
            }
            else {
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
                        }
                        else
                            if (!input.selected && data._map.hasLayer(obj)) {
                                data._map.removeLayer(obj);
                                data._map.fire('overlayremove');
                            }
                    }
                }
            }

            // Make sure that only one layer with the primadonna option is on stage at the same time
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
                }
                else
                    if (!input.checked && this._map.hasLayer(obj)) {
                        this._map.removeLayer(obj);
                        this._map.fire('overlayremove');
                    }
            }

            // Make sure that only one layer with the primadonna option is on stage at the same time
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
                container = this._contentContainer;

            if (!L.Browser.touch) {
                L.DomEvent
                    .disableClickPropagation(container)
                    .disableScrollPropagation(container);
            }
            else {
                L.DomEvent.on(container, 'click', L.DomEvent.stopPropagation);
            }

            var form = this._form = L.DomUtil.create('form', className + '-list');
            this._baseLayersList = L.DomUtil.create('div', className + '-base', form);
            this._separator = L.DomUtil.create('div', className + '-sub-separator', form);
            this._overlaysList = L.DomUtil.create('div', className + '-overlays', form);
            container.appendChild(form);
        }
    });

}(jQuery, L, this, document));



