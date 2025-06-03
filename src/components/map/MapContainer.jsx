import React, { useEffect, useRef } from 'react';
import { Map, View } from 'ol';
import TileLayer from 'ol/layer/Tile';
import XYZ from 'ol/source/XYZ';
import { fromLonLat } from 'ol/proj';
import { Vector as VectorLayer } from 'ol/layer';
import { Vector as VectorSource } from 'ol/source';
import { defaults as defaultControls } from 'ol/control';
import 'ol/ol.css';

const mapStyles = {
  dark: 'https://{a-c}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
  streets: 'https://{a-c}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png',
  satellite: 'https://{a-c}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png'
};

const MapContainer = ({
  selectedStyle = 'dark',
  initialCenter = [87.8549755, 22.9867569],
  initialZoom = 16,
  onMapReady,
  className = ''
}) => {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const vectorSourceRef = useRef(null);

  useEffect(() => {
    if (!mapRef.current) return;

    // Initialize map
    const map = new Map({
      target: mapRef.current,
      layers: [
        new TileLayer({
          source: new XYZ({
            url: mapStyles[selectedStyle],
            attributions: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          })
        })
      ],
      view: new View({
        center: fromLonLat(initialCenter),
        zoom: initialZoom,
        minZoom: 2,
        maxZoom: 19
      }),
      controls: defaultControls({
        zoom: true,
        rotate: false,
        attribution: true
      })
    });

    // Initialize vector layer
    vectorSourceRef.current = new VectorSource();
    const vectorLayer = new VectorLayer({
      source: vectorSourceRef.current,
      zIndex: 2
    });
    map.addLayer(vectorLayer);

    // Force a resize to ensure proper rendering
    setTimeout(() => {
      map.updateSize();
    }, 200);

    mapInstanceRef.current = map;

    if (onMapReady) {
      onMapReady({
        map,
        vectorSource: vectorSourceRef.current
      });
    }

    return () => {
      if (map) {
        map.setTarget(null);
      }
    };
  }, []);

  // Update map style when selected style changes
  useEffect(() => {
    if (mapInstanceRef.current) {
      const layers = mapInstanceRef.current.getLayers();
      layers.getArray()[0].setSource(
        new XYZ({
          url: mapStyles[selectedStyle],
          attributions: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
        })
      );
    }
  }, [selectedStyle]);

  return (
    <div ref={mapRef} className={`ol-map ${className}`} />
  );
};

export default MapContainer; 