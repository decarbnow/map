import base from "./base.js";

let initialSate = {
    z: 5,
    lat: 48,
    lng: 15,
    ls: 'light,power-plants,no2_2020_03'
}

let url = {
    prefix: '/map/',
    stateToUrl: function() {
        let center = base.map.getCenter();
        center.lng = parseFloat(center.lng).toFixed(5);
        center.lat = parseFloat(center.lat).toFixed(5);

        let z = base.map.getZoom();

        let ls = [];
        Object.keys(base.layers).forEach((k) => {
            ls.push(...base.layers[k].getActiveLayers())
        });
        ls = ls.filter(e => e !== 'empty')

        var obj = {
            Title: `Lat: ${center.lat}, Lng: ${center.lng}`,
            Url: `${url.prefix}lng@${center.lng}/lat@${center.lat}/z@${z}/ls@${ls.join(',')}`
        };
        history.pushState(obj, obj.Title, obj.Url);
    },
    stateFromUrl: function() {
        let state = {...initialSate};
        let p = window.location.pathname.substring(url.prefix.length).split('/');

        p.forEach((n) => {
            let v = n.split('@');
            state[v[0]] = v[1];
        });

        base.map.flyTo({lat: state.lat, lng: state.lng}, state.z, {
            animate: true,
            duration: 1.5,
        });

        base.activateLayer('empty');
        state.ls.split(',').forEach((n) => {
            base.activateLayer(n);
        });
    }

}

window.url = url;

export default url;
