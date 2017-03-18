# leaflet-categorized-layers
>

## Description
Leaflet Control Layers extended for group of base and overlay layers
Forked from [robbiet480/leaflet-categorized-layers](https://github.com/robbiet480/leaflet-categorized-layers) by [Robbie Trencheny](http://robbie.io/)   
 



## Installation
### bower
`bower install https://github.com/FCOO/leaflet-categorized-layers.git --save`

## Demo
http://FCOO.github.io/leaflet-categorized-layers/demo/ 

## Usage

	var baseLayers = {
  		"Esri": {
    		"WorldStreetMap": L.tileLayer.provider('Esri.WorldStreetMap'),
    		"DeLorme": L.tileLayer.provider('Esri.DeLorme'),
  		}
	};
	var overlayLayers = {
	  	"Weather": {
    		"OpenWeatherMap Clouds": L.tileLayer.provider('OpenWeatherMap.Clouds'),
		    "OpenWeatherMap Precipitation": L.tileLayer.provider('OpenWeatherMap.Precipitation'),
    		"OpenWeatherMap Rain": L.tileLayer.provider('OpenWeatherMap.Rain'),
    		"OpenWeatherMap Pressure": L.tileLayer.provider('OpenWeatherMap.Pressure'),
		    "OpenWeatherMap Wind": L.tileLayer.provider('OpenWeatherMap.Wind')
  		}
	};

	map.addControl( new L.Control.CategorizedLayers(baseLayers, overLayers, {collapsed: false}) );





### options

| Id | Type | Default | Description |
| :--: | :--: | :-----: | --- |
| options1 | boolean | true | If <code>true</code> the ... |
| options2 | string | null | Contain the ... |

### Methods


## Copyright and License
This plugin is licensed under the [MIT license](https://github.com/FCOO/leaflet-categorized-layers/LICENSE).

Copyright 
(C) 2014 [Robbie Trencheny](http://robbie.io/)
(c) 2015 [FCOO](https://github.com/FCOO)

## Contact information

Jesper Larsen jla@fcoo.dk


