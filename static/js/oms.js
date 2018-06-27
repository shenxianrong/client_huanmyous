// Generated by CoffeeScript 1.12.2

/** @preserve OverlappingMarkerSpiderfier
https://github.com/jawj/OverlappingMarkerSpiderfier
Copyright (c) 2011 - 2017 George MacKerron
Released under the MIT licence: http://opensource.org/licenses/mit-license
Note: The Google Maps API v3 must be included *before* this code
 */

(function() {
  var callbackName, callbackRegEx, ref, ref1, scriptTag, tag,
    hasProp = {}.hasOwnProperty,
    slice = [].slice;

  this['OverlappingMarkerSpiderfier'] = (function() {
    var ge, gm, j, len, mt, p, ref, twoPi, x;

    p = _Class.prototype;

    ref = [_Class, p];
    for (j = 0, len = ref.length; j < len; j++) {
      x = ref[j];
      x['VERSION'] = '1.0.3';
    }

    twoPi = Math.PI * 2;

    gm = ge = mt = null;

    _Class['markerStatus'] = {
      'SPIDERFIED': 'SPIDERFIED',
      'SPIDERFIABLE': 'SPIDERFIABLE',
      'UNSPIDERFIABLE': 'UNSPIDERFIABLE',
      'UNSPIDERFIED': 'UNSPIDERFIED'
    };

    function _Class(map1, opts) {
      var k, lcH, lcU, v;
      this.map = map1;
      if (opts == null) {
        opts = {};
      }
      if (this.constructor.hasInitialized == null) {
        this.constructor.hasInitialized = true;
        gm = google.maps;
        ge = gm.event;
        mt = gm.MapTypeId;
        p['keepSpiderfied'] = false;
        p['ignoreMapClick'] = false;
        p['markersWontHide'] = false;
        p['markersWontMove'] = false;
        p['basicFormatEvents'] = false;
        p['nearbyDistance'] = 20;
        p['circleSpiralSwitchover'] = 9;
        p['circleFootSeparation'] = 23;
        p['circleStartAngle'] = twoPi / 12;
        p['spiralFootSeparation'] = 26;
        p['spiralLengthStart'] = 11;
        p['spiralLengthFactor'] = 4;
        p['spiderfiedZIndex'] = gm.Marker.MAX_ZINDEX + 20000;
        p['highlightedLegZIndex'] = gm.Marker.MAX_ZINDEX + 10000;
        p['usualLegZIndex'] = gm.Marker.MAX_ZINDEX + 1;
        p['legWeight'] = 1.5;
        p['legColors'] = {
          'usual': {},
          'highlighted': {}
        };
        lcU = p['legColors']['usual'];
        lcH = p['legColors']['highlighted'];
        lcU[mt.HYBRID] = lcU[mt.SATELLITE] = '#fff';
        lcH[mt.HYBRID] = lcH[mt.SATELLITE] = '#f00';
        lcU[mt.TERRAIN] = lcU[mt.ROADMAP] = '#444';
        lcH[mt.TERRAIN] = lcH[mt.ROADMAP] = '#f00';
        this.constructor.ProjHelper = function(map) {
          return this.setMap(map);
        };
        this.constructor.ProjHelper.prototype = new gm.OverlayView();
        this.constructor.ProjHelper.prototype['draw'] = function() {};
      }
      for (k in opts) {
        if (!hasProp.call(opts, k)) continue;
        v = opts[k];
        this[k] = v;
      }
      this.projHelper = new this.constructor.ProjHelper(this.map);
      this.initMarkerArrays();
      this.listeners = {};
      this.formatIdleListener = this.formatTimeoutId = null;
      this.addListener('click', function(marker, e) {
        return ge.trigger(marker, 'spider_click', e);
      });
      this.addListener('format', function(marker, status) {
        return ge.trigger(marker, 'spider_format', status);
      });
      if (!this['ignoreMapClick']) {
        ge.addListener(this.map, 'click', (function(_this) {
          return function() {
            return _this['unspiderfy']();
          };
        })(this));
      }
      ge.addListener(this.map, 'maptypeid_changed', (function(_this) {
        return function() {
          return _this['unspiderfy']();
        };
      })(this));
      ge.addListener(this.map, 'zoom_changed', (function(_this) {
        return function() {
          _this['unspiderfy']();
          if (!_this['basicFormatEvents']) {
            return _this.formatMarkers();
          }
        };
      })(this));
    }

    p.initMarkerArrays = function() {
      this.markers = [];
      return this.markerListenerRefs = [];
    };

    p['addMarker'] = function(marker, spiderClickHandler) {
      // marker.setMap(this.map);//防止和点集合插件冲突，造成地图卡死内存爆炸
      return this['trackMarker'](marker, spiderClickHandler);
    };

    p['trackMarker'] = function(marker, spiderClickHandler) {
      var listenerRefs;
      if (marker['_oms'] != null) {
        return this;
      }
      marker['_oms'] = true;
      listenerRefs = [
        ge.addListener(marker, 'click', (function(_this) {
          return function(e) {
            return _this.spiderListener(marker, e);
          };
        })(this))
      ];
      if (!this['markersWontHide']) {
        listenerRefs.push(ge.addListener(marker, 'visible_changed', (function(_this) {
          return function() {
            return _this.markerChangeListener(marker, false);
          };
        })(this)));
      }
      if (!this['markersWontMove']) {
        listenerRefs.push(ge.addListener(marker, 'position_changed', (function(_this) {
          return function() {
            return _this.markerChangeListener(marker, true);
          };
        })(this)));
      }
      if (spiderClickHandler != null) {
        listenerRefs.push(ge.addListener(marker, 'spider_click', spiderClickHandler));
      }
      this.markerListenerRefs.push(listenerRefs);
      this.markers.push(marker);
      if (this['basicFormatEvents']) {
        this.trigger('format', marker, this.constructor['markerStatus']['UNSPIDERFIED']);
      } else {
        this.trigger('format', marker, this.constructor['markerStatus']['UNSPIDERFIABLE']);
        this.formatMarkers();
      }
      return this;
    };

    p.markerChangeListener = function(marker, positionChanged) {
      if (this.spiderfying || this.unspiderfying) {
        return;
      }
      if ((marker['_omsData'] != null) && (positionChanged || !marker.getVisible())) {
        this['unspiderfy'](positionChanged ? marker : null);
      }
      return this.formatMarkers();
    };

    p['getMarkers'] = function() {
      return this.markers.slice(0);
    };

    p['removeMarker'] = function(marker) {
      this['forgetMarker'](marker);
      return marker.setMap(null);
    };

    p['forgetMarker'] = function(marker) {
      var i, l, len1, listenerRef, listenerRefs;
      if (marker['_omsData'] != null) {
        this['unspiderfy']();
      }
      i = this.arrIndexOf(this.markers, marker);
      if (i < 0) {
        return this;
      }
      listenerRefs = this.markerListenerRefs.splice(i, 1)[0];
      for (l = 0, len1 = listenerRefs.length; l < len1; l++) {
        listenerRef = listenerRefs[l];
        ge.removeListener(listenerRef);
      }
      delete marker['_oms'];
      this.markers.splice(i, 1);
      this.formatMarkers();
      return this;
    };

    p['removeAllMarkers'] = p['clearMarkers'] = function() {
      var l, len1, marker, markers;
      markers = this['getMarkers']();
      this['forgetAllMarkers']();
      for (l = 0, len1 = markers.length; l < len1; l++) {
        marker = markers[l];
        marker.setMap(null);
      }
      return this;
    };

    p['forgetAllMarkers'] = function() {
      var i, l, len1, len2, listenerRef, listenerRefs, marker, n, ref1;
      this['unspiderfy']();
      ref1 = this.markers;
      for (i = l = 0, len1 = ref1.length; l < len1; i = ++l) {
        marker = ref1[i];
        listenerRefs = this.markerListenerRefs[i];
        for (n = 0, len2 = listenerRefs.length; n < len2; n++) {
          listenerRef = listenerRefs[n];
          ge.removeListener(listenerRef);
        }
        delete marker['_oms'];
      }
      this.initMarkerArrays();
      return this;
    };

    p['addListener'] = function(eventName, func) {
      var base;
      ((base = this.listeners)[eventName] != null ? base[eventName] : base[eventName] = []).push(func);
      return this;
    };

    p['removeListener'] = function(eventName, func) {
      var i;
      i = this.arrIndexOf(this.listeners[eventName], func);
      if (!(i < 0)) {
        this.listeners[eventName].splice(i, 1);
      }
      return this;
    };

    p['clearListeners'] = function(eventName) {
      this.listeners[eventName] = [];
      return this;
    };

    p.trigger = function() {
      var args, eventName, func, l, len1, ref1, ref2, results;
      eventName = arguments[0], args = 2 <= arguments.length ? slice.call(arguments, 1) : [];
      ref2 = (ref1 = this.listeners[eventName]) != null ? ref1 : [];
      results = [];
      for (l = 0, len1 = ref2.length; l < len1; l++) {
        func = ref2[l];
        results.push(func.apply(null, args));
      }
      return results;
    };

    p.generatePtsCircle = function(count, centerPt) {
      var angle, angleStep, circumference, i, l, legLength, ref1, results;
      circumference = this['circleFootSeparation'] * (2 + count);
      legLength = circumference / twoPi;
      angleStep = twoPi / count;
      results = [];
      for (i = l = 0, ref1 = count; 0 <= ref1 ? l < ref1 : l > ref1; i = 0 <= ref1 ? ++l : --l) {
        angle = this['circleStartAngle'] + i * angleStep;
        results.push(new gm.Point(centerPt.x + legLength * Math.cos(angle), centerPt.y + legLength * Math.sin(angle)));
      }
      return results;
    };

    p.generatePtsSpiral = function(count, centerPt) {
      var angle, i, l, legLength, pt, ref1, results;
      legLength = this['spiralLengthStart'];
      angle = 0;
      results = [];
      for (i = l = 0, ref1 = count; 0 <= ref1 ? l < ref1 : l > ref1; i = 0 <= ref1 ? ++l : --l) {
        angle += this['spiralFootSeparation'] / legLength + i * 0.0005;
        pt = new gm.Point(centerPt.x + legLength * Math.cos(angle), centerPt.y + legLength * Math.sin(angle));
        legLength += twoPi * this['spiralLengthFactor'] / angle;
        results.push(pt);
      }
      return results;
    };

    p.spiderListener = function(marker, e) {
      var l, len1, m, mPt, markerPt, markerSpiderfied, nDist, nearbyMarkerData, nonNearbyMarkers, pxSq, ref1;
      markerSpiderfied = marker['_omsData'] != null;
      if (!(markerSpiderfied && this['keepSpiderfied'])) {
        this['unspiderfy']();
      }
      if (markerSpiderfied || this.map.getStreetView().getVisible() || this.map.getMapTypeId() === 'GoogleEarthAPI') {
        return this.trigger('click', marker, e);
      } else {
        nearbyMarkerData = [];
        nonNearbyMarkers = [];
        nDist = this['nearbyDistance'];
        pxSq = nDist * nDist;
        markerPt = this.llToPt(marker.position);
        ref1 = this.markers;
        for (l = 0, len1 = ref1.length; l < len1; l++) {
          m = ref1[l];
          if (!((m.map != null) && m.getVisible())) {
            continue;
          }
          mPt = this.llToPt(m.position);
          if (this.ptDistanceSq(mPt, markerPt) < pxSq) {
            nearbyMarkerData.push({
              marker: m,
              markerPt: mPt
            });
          } else {
            nonNearbyMarkers.push(m);
          }
        }
        if (nearbyMarkerData.length === 1) {
          return this.trigger('click', marker, e);
        } else {
          return this.spiderfy(nearbyMarkerData, nonNearbyMarkers);
        }
      }
    };

    p['markersNearMarker'] = function(marker, firstOnly) {
      var l, len1, m, mPt, markerPt, markers, nDist, pxSq, ref1, ref2, ref3;
      if (firstOnly == null) {
        firstOnly = false;
      }
      if (this.projHelper.getProjection() == null) {
        throw "Must wait for 'idle' event on map before calling markersNearMarker";
      }
      nDist = this['nearbyDistance'];
      pxSq = nDist * nDist;
      markerPt = this.llToPt(marker.position);
      markers = [];
      ref1 = this.markers;
      for (l = 0, len1 = ref1.length; l < len1; l++) {
        m = ref1[l];
        if (m === marker || (m.map == null) || !m.getVisible()) {
          continue;
        }
        mPt = this.llToPt((ref2 = (ref3 = m['_omsData']) != null ? ref3.usualPosition : void 0) != null ? ref2 : m.position);
        if (this.ptDistanceSq(mPt, markerPt) < pxSq) {
          markers.push(m);
          if (firstOnly) {
            break;
          }
        }
      }
      return markers;
    };

    p.markerProximityData = function() {
      var i1, i2, l, len1, len2, m, m1, m1Data, m2, m2Data, mData, n, nDist, pxSq, ref1, ref2;
      if (this.projHelper.getProjection() == null) {
        throw "Must wait for 'idle' event on map before calling markersNearAnyOtherMarker";
      }
      nDist = this['nearbyDistance'];
      pxSq = nDist * nDist;
      mData = (function() {
        var l, len1, ref1, ref2, ref3, results;
        ref1 = this.markers;
        results = [];
        for (l = 0, len1 = ref1.length; l < len1; l++) {
          m = ref1[l];
          results.push({
            pt: this.llToPt((ref2 = (ref3 = m['_omsData']) != null ? ref3.usualPosition : void 0) != null ? ref2 : m.position),
            willSpiderfy: false
          });
        }
        return results;
      }).call(this);
      ref1 = this.markers;
      for (i1 = l = 0, len1 = ref1.length; l < len1; i1 = ++l) {
        m1 = ref1[i1];
        if (!((m1.getMap() != null) && m1.getVisible())) {
          continue;
        }
        m1Data = mData[i1];
        if (m1Data.willSpiderfy) {
          continue;
        }
        ref2 = this.markers;
        for (i2 = n = 0, len2 = ref2.length; n < len2; i2 = ++n) {
          m2 = ref2[i2];
          if (i2 === i1) {
            continue;
          }
          if (!((m2.getMap() != null) && m2.getVisible())) {
            continue;
          }
          m2Data = mData[i2];
          if (i2 < i1 && !m2Data.willSpiderfy) {
            continue;
          }
          if (this.ptDistanceSq(m1Data.pt, m2Data.pt) < pxSq) {
            m1Data.willSpiderfy = m2Data.willSpiderfy = true;
            break;
          }
        }
      }
      return mData;
    };

    p['markersNearAnyOtherMarker'] = function() {
      var i, l, len1, m, mData, ref1, results;
      mData = this.markerProximityData();
      ref1 = this.markers;
      results = [];
      for (i = l = 0, len1 = ref1.length; l < len1; i = ++l) {
        m = ref1[i];
        if (mData[i].willSpiderfy) {
          results.push(m);
        }
      }
      return results;
    };

    p.setImmediate = function(func) {
      return window.setTimeout(func, 0);
    };

    p.formatMarkers = function() {
      if (this['basicFormatEvents']) {
        return;
      }
      if (this.formatTimeoutId != null) {
        return;
      }
      return this.formatTimeoutId = this.setImmediate((function(_this) {
        return function() {
          _this.formatTimeoutId = null;
          if (_this.projHelper.getProjection() != null) {
            return _this._formatMarkers();
          } else {
            if (_this.formatIdleListener != null) {
              return;
            }
            return _this.formatIdleListener = ge.addListenerOnce(_this.map, 'idle', function() {
              return _this._formatMarkers();
            });
          }
        };
      })(this));
    };

    p._formatMarkers = function() {
      var i, l, len1, len2, marker, n, proximities, ref1, results, results1, status;
      if (this['basicFormatEvents']) {
        results = [];
        for (l = 0, len1 = markers.length; l < len1; l++) {
          marker = markers[l];
          status = marker['_omsData'] != null ? 'SPIDERFIED' : 'UNSPIDERFIED';
          results.push(this.trigger('format', marker, this.constructor['markerStatus'][status]));
        }
        return results;
      } else {
        proximities = this.markerProximityData();
        ref1 = this.markers;
        results1 = [];
        for (i = n = 0, len2 = ref1.length; n < len2; i = ++n) {
          marker = ref1[i];
          status = marker['_omsData'] != null ? 'SPIDERFIED' : proximities[i].willSpiderfy ? 'SPIDERFIABLE' : 'UNSPIDERFIABLE';
          results1.push(this.trigger('format', marker, this.constructor['markerStatus'][status]));
        }
        return results1;
      }
    };

    p.makeHighlightListenerFuncs = function(marker) {
      return {
        highlight: (function(_this) {
          return function() {
            return marker['_omsData'].leg.setOptions({
              strokeColor: _this['legColors']['highlighted'][_this.map.mapTypeId],
              zIndex: _this['highlightedLegZIndex']
            });
          };
        })(this),
        unhighlight: (function(_this) {
          return function() {
            return marker['_omsData'].leg.setOptions({
              strokeColor: _this['legColors']['usual'][_this.map.mapTypeId],
              zIndex: _this['usualLegZIndex']
            });
          };
        })(this)
      };
    };

    p.spiderfy = function(markerData, nonNearbyMarkers) {
      var bodyPt, footLl, footPt, footPts, highlightListenerFuncs, leg, marker, md, nearestMarkerDatum, numFeet, spiderfiedMarkers;
      this.spiderfying = true;
      numFeet = markerData.length;
      bodyPt = this.ptAverage((function() {
        var l, len1, results;
        results = [];
        for (l = 0, len1 = markerData.length; l < len1; l++) {
          md = markerData[l];
          results.push(md.markerPt);
        }
        return results;
      })());
      footPts = numFeet >= this['circleSpiralSwitchover'] ? this.generatePtsSpiral(numFeet, bodyPt).reverse() : this.generatePtsCircle(numFeet, bodyPt);
      spiderfiedMarkers = (function() {
        var l, len1, results;
        results = [];
        for (l = 0, len1 = footPts.length; l < len1; l++) {
          footPt = footPts[l];
          footLl = this.ptToLl(footPt);
          nearestMarkerDatum = this.minExtract(markerData, (function(_this) {
            return function(md) {
              return _this.ptDistanceSq(md.markerPt, footPt);
            };
          })(this));
          marker = nearestMarkerDatum.marker;
          leg = new gm.Polyline({
            map: this.map,
            path: [marker.position, footLl],
            strokeColor: this['legColors']['usual'][this.map.mapTypeId],
            strokeWeight: this['legWeight'],
            zIndex: this['usualLegZIndex']
          });
          marker['_omsData'] = {
            usualPosition: marker.getPosition(),
            usualZIndex: marker.getZIndex(),
            leg: leg
          };
          if (this['legColors']['highlighted'][this.map.mapTypeId] !== this['legColors']['usual'][this.map.mapTypeId]) {
            highlightListenerFuncs = this.makeHighlightListenerFuncs(marker);
            marker['_omsData'].hightlightListeners = {
              highlight: ge.addListener(marker, 'mouseover', highlightListenerFuncs.highlight),
              unhighlight: ge.addListener(marker, 'mouseout', highlightListenerFuncs.unhighlight)
            };
          }
          this.trigger('format', marker, this.constructor['markerStatus']['SPIDERFIED']);
          marker.setPosition(footLl);
          marker.setZIndex(Math.round(this['spiderfiedZIndex'] + footPt.y));
          results.push(marker);
        }
        return results;
      }).call(this);
      delete this.spiderfying;
      this.spiderfied = true;
      return this.trigger('spiderfy', spiderfiedMarkers, nonNearbyMarkers);
    };

    p['unspiderfy'] = function(markerNotToMove) {
      var l, len1, listeners, marker, nonNearbyMarkers, ref1, status, unspiderfiedMarkers;
      if (markerNotToMove == null) {
        markerNotToMove = null;
      }
      if (this.spiderfied == null) {
        return this;
      }
      this.unspiderfying = true;
      unspiderfiedMarkers = [];
      nonNearbyMarkers = [];
      ref1 = this.markers;
      for (l = 0, len1 = ref1.length; l < len1; l++) {
        marker = ref1[l];
        if (marker['_omsData'] != null) {
          marker['_omsData'].leg.setMap(null);
          if (marker !== markerNotToMove) {
            marker.setPosition(marker['_omsData'].usualPosition);
          }
          marker.setZIndex(marker['_omsData'].usualZIndex);
          listeners = marker['_omsData'].hightlightListeners;
          if (listeners != null) {
            ge.removeListener(listeners.highlight);
            ge.removeListener(listeners.unhighlight);
          }
          delete marker['_omsData'];
          if (marker !== markerNotToMove) {
            status = this['basicFormatEvents'] ? 'UNSPIDERFIED' : 'SPIDERFIABLE';
            this.trigger('format', marker, this.constructor['markerStatus'][status]);
          }
          unspiderfiedMarkers.push(marker);
        } else {
          nonNearbyMarkers.push(marker);
        }
      }
      delete this.unspiderfying;
      delete this.spiderfied;
      this.trigger('unspiderfy', unspiderfiedMarkers, nonNearbyMarkers);
      return this;
    };

    p.ptDistanceSq = function(pt1, pt2) {
      var dx, dy;
      dx = pt1.x - pt2.x;
      dy = pt1.y - pt2.y;
      return dx * dx + dy * dy;
    };

    p.ptAverage = function(pts) {
      var l, len1, numPts, pt, sumX, sumY;
      sumX = sumY = 0;
      for (l = 0, len1 = pts.length; l < len1; l++) {
        pt = pts[l];
        sumX += pt.x;
        sumY += pt.y;
      }
      numPts = pts.length;
      return new gm.Point(sumX / numPts, sumY / numPts);
    };

    p.llToPt = function(ll) {
      return this.projHelper.getProjection().fromLatLngToDivPixel(ll);
    };

    p.ptToLl = function(pt) {
      return this.projHelper.getProjection().fromDivPixelToLatLng(pt);
    };

    p.minExtract = function(set, func) {
      var bestIndex, bestVal, index, item, l, len1, val;
      for (index = l = 0, len1 = set.length; l < len1; index = ++l) {
        item = set[index];
        val = func(item);
        if ((typeof bestIndex === "undefined" || bestIndex === null) || val < bestVal) {
          bestVal = val;
          bestIndex = index;
        }
      }
      return set.splice(bestIndex, 1)[0];
    };

    p.arrIndexOf = function(arr, obj) {
      var i, l, len1, o;
      if (arr.indexOf != null) {
        return arr.indexOf(obj);
      }
      for (i = l = 0, len1 = arr.length; l < len1; i = ++l) {
        o = arr[i];
        if (o === obj) {
          return i;
        }
      }
      return -1;
    };

    return _Class;

  })();

  callbackRegEx = /(\?.*(&|&amp;)|\?)spiderfier_callback=(\w+)/;

  scriptTag = document.currentScript;

  if (scriptTag == null) {
    scriptTag = ((function() {
      var j, len, ref, ref1, results;
      ref = document.getElementsByTagName('script');
      results = [];
      for (j = 0, len = ref.length; j < len; j++) {
        tag = ref[j];
        if ((ref1 = tag.getAttribute('src')) != null ? ref1.match(callbackRegEx) : void 0) {
          results.push(tag);
        }
      }
      return results;
    })())[0];
  }

  if (scriptTag != null) {
    callbackName = (ref = scriptTag.getAttribute('src')) != null ? (ref1 = ref.match(callbackRegEx)) != null ? ref1[3] : void 0 : void 0;
    if (callbackName) {
      if (typeof window[callbackName] === "function") {
        window[callbackName]();
      }
    }
  }

  if (typeof window['spiderfier_callback'] === "function") {
    window['spiderfier_callback']();
  }

}).call(this);
