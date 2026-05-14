// Web stub for react-native-maps
// This is used by Metro when bundling for web via the resolver in metro.config.js
'use strict';

const React = require('react');
const { View } = require('react-native');

const MapView = React.forwardRef((props, _ref) =>
  React.createElement(View, { style: props.style })
);
MapView.displayName = 'MapView';

const Marker = () => null;
const Polyline = () => null;
const Callout = () => null;
const Circle = () => null;
const Polygon = () => null;
const PROVIDER_GOOGLE = 'google';

module.exports = MapView;
module.exports.default = MapView;
module.exports.Marker = Marker;
module.exports.Polyline = Polyline;
module.exports.Callout = Callout;
module.exports.Circle = Circle;
module.exports.Polygon = Polygon;
module.exports.PROVIDER_GOOGLE = PROVIDER_GOOGLE;
