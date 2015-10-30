(function() {

L.Control.CategorizedLayers = L.Control.Layers.extend({
  options: {
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
        i, obj;

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
      label, input, checked, appendTo;
    var container;

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
          var collapsed = this.options.groupsCollapsed ? groupHeader.innerHTML = ' &#9658; ' : groupHeader.innerHTML = ' &#9660; '
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

        L.DomEvent.on(input, 'click', this._onInputClick, this);
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
        appendTo.appendChild(layer);
        return layer;
    }
  },
  _onLabelClick: function () {
    if(!this.collapsed) {
      this.collapsed = true;
      this.innerHTML = ' &#9658; ' + this.category;
      this.nextElementSibling.style.height = '0';
      this.nextElementSibling.style.display = 'none';
    } else {
      this.collapsed = false;
      this.innerHTML = ' &#9660; ' + this.category;
      this.nextElementSibling.style.height = '100%';
      this.nextElementSibling.style.display = 'block';
    }
  },
  _onSelectChange: function (evt) {
    var i, input,
        data = evt.data,
        selects = evt.data._form.getElementsByTagName('select'),
        selectsLen = selects.length;

    this._handlingClick = true;

    var selectedOption = evt.originalEvent.explicitOriginalTarget;

    var jAdded = null;
    var iAdded = null;
    var obj;
    for (j = 0; j < selectsLen; j++) {
      var inputs = selects[j].options;
      var inputsLen = inputs.length;
      for (i = 0; i < inputsLen; i++) {
        input = inputs[i];
        if ($(input).attr('disabled') !== 'disabled') {
          obj = input.overlay ? data._overlays[input.category][input.layerId] : data._layers[input.category][input.layerId]
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
      objA = selectedOption.layer;
      if (objA.options.primadonna) {
        for (i = 0; i < inputsLen; i++) {
          input = inputs[i];
          obj = input.overlay ? data._overlays[input.category][input.layerId] : data._layers[input.category][input.layerId]
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
      obj = input.overlay ? this._overlays[input.category][input.layerId] : this._layers[input.category][input.layerId]
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
      objA = input.overlay ? this._overlays[input.category][input.layerId] : this._layers[input.category][input.layerId]
      if (objA.options.primadonna) {
        for (i = 0; i < inputsLen; i++) {
          input = inputs[i];
          obj = input.overlay ? this._overlays[input.category][input.layerId] : this._layers[input.category][input.layerId]
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
    container.setAttribute('aria-haspopup', true);

    if (!L.Browser.touch) {
      L.DomEvent
        .disableClickPropagation(container)
        .disableScrollPropagation(container);
    } else {
      L.DomEvent.on(container, 'click', L.DomEvent.stopPropagation);
    }

    var form = this._form = L.DomUtil.create('form', className + '-list');

    if (this.options.collapsed) {
      if (!L.Browser.android) {
        L.DomEvent
            .on(container, 'mouseover', this._expand, this)
            .on(container, 'mouseout', this._collapse, this);
      }
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
  }
});


}).call(this);
