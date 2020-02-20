/**
 * Control for live coordinate
 */

export function mapControlLiveCoord() {}
mapControlLiveCoord.prototype.onAdd = function(map) {
  const helper = mx.helpers;
  var coord = document.createElement('div');
  map.on('mousemove', function(e) {
    var pos = e.lngLat;
    var lat = helper.formatZeros(pos.lat, 3);
    var lng = helper.formatZeros(pos.lng, 3);
    coord.innerText = ' Lat: ' + lat + ' - Lng: ' + lng;
  });
  this._map = map;
  this._container = document.createElement('div');
  this._container.className = 'mapboxgl-ctrl mapboxgl-ctrl-attrib';
  this._container.appendChild(coord);
  return this._container;
};

mapControlLiveCoord.prototype.onRemove = function() {
  this._container.parentNode.removeChild(this._container);
  this._map = undefined;
};

export function mapxLogo() {}
mapxLogo.prototype.onAdd = function() {
  var logo = document.createElement('a');
  logo.classList.add('mx-logo');

  logo.style.backgroundImage =
    'url(' + require('../svg/map-x-logo-full.svg') + ')';
  this._container = document.createElement('div');
  this._container.className = 'mapboxgl-ctrl';
  this._container.style.display = 'inline-block';
  this._container.style.float = 'none';
  this._container.appendChild(logo);
  return this._container;
};

mapxLogo.prototype.onRemove = function() {
  this._container.parentNode.removeChild(this._container);
  this._map = undefined;
};

export function showSelectProject() {
  var val = {
    time: new Date(),
    value: 'showProject'
  };
  Shiny.onInputChange('btn_control', val);
}

export function showSelectLanguage() {
  var val = {
    time: new Date(),
    value: 'showLanguage'
  };
  Shiny.onInputChange('btn_control', val);
}

export function createControlBtns(btns) {
  const h = mx.helpers;

  let keys = Object.keys(btns);
  let items = Object.values(btns);

  const elControls = h.el(
    'ul',
    {
      class: ['mx-controls-ul']
    },
    items.map((btn, i) => {
      if (!btn.remove) {
        btn.elBtn = h.el(
          'li',
          {
            id: keys[i],
            on: {click: btn.action},
            class: [
              'btn',
              'btn-circle',
              'btn-circle-medium',
              'hint--bottom-right',
              'shadow'
            ].concat(btn.liClasses),
            dataset: Object.assign(
              {},
              {lang_key: btn.key, lang_type: 'tooltip'},
              btn.liData
            )
          },
          h.el('div', {
            class: btn.classes
          })
        );
        return btn.elBtn;
      }
    })
  );

  mx.helpers.updateLanguageElements({selector: elControls});
  return elControls;
}

/**
 * Create the prototype containing additional control / button.
 * Some of the actions are related to shiny framework
 */
export function mapControlApp() {}
mapControlApp.prototype.onAdd = function(map) {
  //var idMap = map._container.id;
  const h = mx.helpers;
  const modeStatic = mx.settings.mode.static === true;
  /**
   * Toggle controls (btnToggleBtns)
   */
  h.toggleControls = function(o) {
    o = o || {};
    var hide = o.hide || !btns.btnToggleBtns.hidden; // state saved in buttons list
    var action = hide ? 'add' : 'remove';
    var selectorToggle = [
      '.mx-panel-right',
      '.mx-panel-views',
      '.mapboxgl-ctrl-bottom-left',
      '.mapboxgl-ctrl-bottom-right',
      '.mapboxgl-ctrl-top-right',
      '.mx-panel-tools',
      '.mx-panel-settings'
    ];
    var idSkip = o.skip || [
      'btnStoryUnlockMap',
      'btnStoryClose',
      'btnStoryLegends',
      'btnToggleBtns'
    ];
    var btnToggle = btns.btnToggleBtns;

    btnToggle.hidden = hide;

    if (hide) {
      btnToggle.elBtn.classList.add(btnToggle.classActive);
    } else {
      btnToggle.elBtn.classList.remove(btnToggle.classActive);
    }

    if (this instanceof Node) {
      if (hide) {
        this.classList.add('active');
      } else {
        this.classList.remove('active');
      }
    }

    for (var key in btns) {
      if (idSkip.indexOf(key) === -1) {
        selectorToggle.push('#' + key);
      }
    }

    h.classAction({
      selector: selectorToggle,
      action: action,
      class: 'mx-hide-bis'
    });
  };

  /**
   * Build buttons list
   */
  var btns = {
    btnToggleBtns: {
      classes: ['fa', 'fa-desktop'],
      classeActive: 'active',
      key: 'btn_toggle_all',
      hidden: false,
      position: 'top-left',
      action: h.toggleControls
    },
    btnShowLogin: {
      classes: ['fa', 'fa-user'],
      remove: modeStatic,
      key: 'btn_login',
      action: function() {
        var val = {
          time: new Date(),
          value: 'showLogin'
        };
        Shiny.onInputChange('btn_control', val);
      }
    },
    btnTabView: {
      classes: ['fa', 'fa-list-ul'],
      key: 'btn_tab_views',
      remove: modeStatic,
      action: () => {
        h.panelLeftSwitch({
          id: 'panel-views',
          toggle: true
        });
      }
    },
    btnTabTools: {
      classes: ['fa', 'fa-cogs'],
      remove: modeStatic,
      key: 'btn_tab_tools',
      action: () => {
        h.panelLeftSwitch({
          id: 'panel-tools',
          toggle: true
        });
      }
    },
    btnPrint: {
      classes: ['fa', 'fa-map-o'],
      key: 'btn_map_composer',
      action: function() {
        h.mapComposerModalAuto();
      }
    },
    btnStoryClose: {
      classes: ['fa', 'fa-arrow-left'],
      liClasses: 'mx-display-none',
      key: 'btn_story_close'
    },
    btnFullScreen: {
      classes: ['fa', 'fa-expand'],
      key: 'btn_fullscreen',
      action: function() {
        h.toggleFullScreen('btnFullScreen');
      }
    },
    btnStoryUnlockMap: {
      classes: ['fa', 'fa-lock'],
      liClasses: 'mx-display-none',
      key: 'btn_story_unlock_map',
      action: h.storyControlMapPan
    },
    btnShowAbout: {
      classes: ['fa', 'fa-info'],
      key: 'btn_about',
      remove: modeStatic,
      action: function() {
        var val = {
          time: new Date(),
          value: 'showAbout'
        };
        Shiny.onInputChange('btn_control', val);
      }
    },
    btnGeolocateUser: {
      classes: ['fa', 'fa-map-marker'],
      key: 'btn_geolocate_user',
      hidden: false,
      action: h.geolocateUser
    },
    btnThemeAerial: {
      classes: ['fa', 'fa-plane'],
      key: 'btn_theme_sat',
      action: function() {
        h.btnToggleLayer({
          id: 'map_main',
          idLayer: 'here_aerial',
          idSwitch: 'btnThemeAerial',
          action: 'toggle'
        });
      }
    },
    btnThemeSwitch: {
      classes: ['fa', 'fa-adjust', 'fa-transition-generic'],
      key: 'btn_theme_switch',
      action: function() {
        const elIcon = this.querySelector('.fa');
        elIcon.classList.toggle('fa-rotate-180');
        mx.theme.setColorsByThemeNext();
      }
    },
    btnOverlapSpotlight: {
      classes: ['fa', 'fa-bullseye'],
      key: 'btn_overlap_spotlight',
      //remove: modeStatic,
      action: function(e) {
        var el = e.target;
        var cl = 'active';
        el.classList.toggle(cl);
        var enable = el.classList.contains(cl);
        h.activateSpotlight(enable, el);
      }
    },
    btnDrawMode: {
      classes: 'mx-edit-vector',
      remove: modeStatic,
      key: 'btn_draw_mode',
      action: function(e) {
        h.drawModeToggle(e);
      }
    },
    btnZoomIn: {
      classes: ['fa', 'fa-plus'],
      key: 'btn_zoom_in',
      action: function() {
        map.zoomIn();
      }
    },
    btnZoomOut: {
      classes: ['fa', 'fa-minus'],
      key: 'btn_zoom_out',
      action: function() {
        map.zoomOut();
      }
    },
    btnSetNorth: {
      classes: ['mx-north-arrow'],
      key: 'btn_north_arrow',
      action: function() {
        var map = h.getMap();
        if (map) {
          map.easeTo({bearing: 0, pitch: 0});
        }
      }
    }
  };

  var btnList = createControlBtns(btns);

  this._map = map;
  this._container = document.createElement('div');
  this._container.className = 'mapboxgl-ctrl mx-controls-top';
  this._container.appendChild(btnList);
  return this._container;
};

mapControlApp.prototype.onRemove = function() {
  this._container.parentNode.removeChild(this._container);
  this._map = undefined;
};

/**
 * Create the prototype containing additional control / button.
 * Some of the actions are related to shiny framework
 */
export function mapControlNav() {}
mapControlNav.prototype.onAdd = function(map) {
  //var idMap = map._container.id;
  const h = mx.helpers;

  /**
   * Build buttons list
   */
  var btns = {
    btnGeolocateUser: {
      classes: ['fa', 'fa-map-marker'],
      key: 'btn_geolocate_user',
      hidden: false,
      action: h.geolocateUser
    },
    btnThemeAerial: {
      classes: ['fa', 'fa-plane'],
      key: 'btn_theme_sat',
      action: function() {
        h.btnToggleLayer({
          id: 'map_main',
          idLayer: 'here_aerial',
          idSwitch: 'btnThemeAerial',
          action: 'toggle'
        });
      }
    },
    btnZoomIn: {
      classes: ['fa', 'fa-plus'],
      key: 'btn_zoom_in',
      action: function() {
        map.zoomIn();
      }
    },
    btnZoomOut: {
      classes: ['fa', 'fa-minus'],
      key: 'btn_zoom_out',
      action: function() {
        map.zoomOut();
      }
    },
    btnSetNorth: {
      classes: ['mx-north-arrow'],
      key: 'btn_north_arrow',
      action: function() {
        var map = h.path(mx, 'maps.map_main.map');
        if (map) {
          map.easeTo({bearing: 0, pitch: 0});
        }
      }
    }
  };

  var btnList = createControlBtns(btns);

  this._map = map;
  this._container = document.createElement('div');
  this._container.className = 'mapboxgl-ctrl mx-controls-top';
  this._container.appendChild(btnList);
  return this._container;
};
mapControlNav.prototype.onRemove = function() {
  this._container.parentNode.removeChild(this._container);
  this._map = undefined;
};

/**
 * Create a nested scale indicator : text,box and container. Not possible by the original method.
 * This is a hack based on mapbox-gl-js/src/ui/control/scale_control.js
 */
export function mapControlScale() {}

mapControlScale.prototype.onAdd = function(map) {
  var container = document.createElement('div');
  var text = document.createElement('div');
  var scale = document.createElement('div');
  container.className = 'mapboxgl-ctrl mapboxgl-ctrl-attrib';
  text.className = 'mx-scale-text';
  scale.className = 'mx-scale-box';
  scale.appendChild(text);
  container.appendChild(scale);

  map.on('mousemove', function(e) {
    const y = e.point.y;
    render(100, y);
  });

  map.once('moveend', function() {
    render(100, 0);
  });

  function render(x, y) {
    let unit = 'm';
    const maxWidth = 100;
    //const y = map._container.clientHeight / 2;
    const maxMeters = getDistance(
      map.unproject([0, y]),
      map.unproject([maxWidth, y])
    );
    let distance = getRoundNum(maxMeters);
    const ratio = distance / maxMeters;
    if (distance >= 1000) {
      distance = distance / 1000;
      unit = 'km';
    }

    scale.style.width = maxWidth * ratio + 'px';
    text.innerHTML = distance + unit;
  }

  this._container = container;

  return this._container;
};

mapControlScale.prototype.onRemove = function() {
  this._container.parentNode.removeChild(this._container);
  this._map = undefined;
};

function getDistance(latlng1, latlng2) {
  // Uses spherical law of cosines approximation.
  const R = 6371000;

  const rad = Math.PI / 180,
    lat1 = latlng1.lat * rad,
    lat2 = latlng2.lat * rad,
    a =
      Math.sin(lat1) * Math.sin(lat2) +
      Math.cos(lat1) *
        Math.cos(lat2) *
        Math.cos((latlng2.lng - latlng1.lng) * rad);

  const maxMeters = R * Math.acos(Math.min(a, 1));
  return maxMeters;
}

function getRoundNum(num) {
  const pow10 = Math.pow(10, `${Math.floor(num)}`.length - 1);
  let d = num / pow10;

  d = d >= 10 ? 10 : d >= 5 ? 5 : d >= 3 ? 3 : d >= 2 ? 2 : 1;

  return pow10 * d;
}
