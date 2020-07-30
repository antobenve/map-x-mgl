/*jshint esversion: 6, node: true  */
import * as helpers from './mx_helpers.js';
import {version} from './../../package.json';
import localforage from 'localforage';
import mapboxgl from 'mapbox-gl';
import {settings} from './mx_settings_default.js';
import {ListenerStore, EventStore} from './listener_store/index.js';

const templates = {
  viewListLegend: require('../dot/view_list_legend.dot'),
  viewListOptions: require('../dot/view_list_options.dot')
};

const maps = {};
const data = {
  geojson: localforage.createInstance({
    name: 'geojson'
  }),
  images: localforage.createInstance({
    name: 'images'
  }),
  stories: localforage.createInstance({
    name: 'stories'
  }),
  views: localforage.createInstance({
    name: 'views'
  }),
  config: localforage.createInstance({
    name: 'config'
  }),
  draft: localforage.createInstance({
    name: 'draft'
  }),
  draw: localforage.createInstance({
    name: 'draw'
  }),
  cache: localforage.createInstance({
    name: 'cache'
  })
};
const initQueryParams = {}; // set in init_common.js
const listeners = new ListenerStore();
const events = new EventStore();
const selectize = {};
const editors = {};
const extend = {
  position: {},
  texteditor: {}
};
const info = {};
export {
  /// globally available library
  mapboxgl,
  localforage,
  // mapx helpers
  helpers,
  // listener manager / store
  listeners,
  events,
  // mapx storage
  initQueryParams,
  templates,
  maps,
  data,
  info,
  selectize,
  version,
  settings,
  editors,
  extend
};

console.log('INIT MX');
