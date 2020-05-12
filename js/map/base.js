import { map } from 'leaflet';
import 'leaflet-sidebar';
//import 'leaflet-contextmenu';
import 'leaflet-control-geocoder';

import './geoip.js';
import twitter from './twitter.js';

import layers from './layers/sets.js'
import markers from './select.js';
import url from './url.js';

let initialState = {
    zoom: 3,
    center: {
        lat: 22, // 48.2082,
        lng: 0, // 16.3738,
    },
    layers: [
        'light',
        'power-plants',
        'no2_2020_03'
    ],
}
/*var infScroll = null;
sidebar.on('shown', function () {
    infScroll = new InfiniteScroll(document.getElementById('sidebar'), {
        history: false,
        path: '.nextTweet'
        //function() {
        //    return "https://decarbnow.space/api/render/1169366632000438272";layers
        //} //'.nextTweet'
    });
});*/

let base = {
    map: null,
    sidebar: null,
    layers: {},
    pushingState: false,
    afterNextMove: null,

    init: function() {
        // init leaflet map
        base.map = map('map', {
            zoomControl: false,
            tap: true,
            maxZoom: 19,
            // contextmenu: true,
            // contextmenuWidth: 140,
            // contextmenuItems: [{
            //     text: 'Tweet ...',
            //     callback: function(e) {
            //         base.sidebar.hide();
            //         base.map.flyTo(e.latlng);
            //         twitter.showTweetBox(e.latlng)
            //     }
            // }, {
            //     text: 'Copy View Link',
            //     callback: function(e) {
            //         base.map.flyTo(e.latlng);
            //         base.afterNextMove = function() {
            //             url.pushState();
            //
            //             var dummy = document.createElement('input'),
            //                 text = window.location.href;
            //
            //             document.body.appendChild(dummy);
            //             dummy.value = text;
            //             dummy.select();
            //             document.execCommand('copy');
            //             document.body.removeChild(dummy);
            //
            //             base.afterNextMove = null;
            //         }
            //     }
            // }]
        });

        // init leaflet sidebar
        base.sidebar = L.control.sidebar('sidebar', {
            closeButton: true,
            position: 'left'
        });
        base.map.addControl(base.sidebar);

        //base.addLayers()
        base.addEventHandlers()

        base.map.setView(initialState.center, initialState.zoom);

        base.layers = layers

        base.setState(url.getState())
        base.pushingState = true;
    },

    getState: function() {
        let layers = [];
        Object.keys(base.layers).forEach((k) => {
            layers.push(...base.layers[k].getActiveLayers())
        });

        return {
            center: base.map.getCenter(),
            zoom: base.map.getZoom(),
            layers: layers,
        }
    },

    setState: function(state) {
        let s = {...initialState, ...state};

        s.layers.forEach((n) => {
            base.activateLayer(n, ['tiles']);
        });

        let p = state.center || L.GeoIP.getPosition();
        // let p = state.center || s.center;
        let z = state.zoom || 10;

        base.map.flyTo(p, z);


        base.afterNextMove = function() {
            s.layers.forEach((n) => {
                base.activateLayer(n);
            });

            if (base.layers.pollutions.getActiveLayers().length == 0)
                base.map.addLayer(base.layers.pollutions.layers['empty'])

            base.addControls();
            base.addLayers();

            base.afterNextMove = null;
        }
    },

    activateLayer: function(id, layerSets = Object.keys(base.layers)) {
        layerSets.forEach(k => {
            let ls = base.layers[k];
            if (id in ls.layers)
                base.map.addLayer(ls.layers[id])
        });
    },

    addControls: function() {
        // L.control.markers({ position: 'topleft' }).addTo(base.map);
        L.control.zoom({ position: 'topleft' }).addTo(base.map);

        L.Control.geocoder({
            position: 'topleft',
            // defaultMarkGeocode: false,
        }).addTo(base.map);

        L.control.layers(layers.tiles.getNameObject(), null, {
            collapsed: false
        }).addTo(base.map);

        L.control.layers(layers.pollutions.getNameObject(), layers.points.getNameObject(), {
            collapsed: false
        }).addTo(base.map);
    },

    addLayers: function() {
        base.map.addLayer(markers.clusters);
        markers.init()
    },

    addEventHandlers: function() {
        base.map.on("moveend", function () {
            if (base.pushingState) {
                if (base.afterNextMove)
                    base.afterNextMove();
                url.pushState()
            }
        });

        base.map.on("contextmenu", function (e) {
            base.map.flyTo(e.latlng);
            twitter.showTweetSidebar(e.latlng)
        });

        base.map.on('baselayerchange overlayadd overlayremove', function (e) {
            if (base.pushingState)
                url.pushState();
            return true;
        });
    }
}

export default base
