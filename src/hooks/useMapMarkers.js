import { useCallback } from 'react';
import Feature from 'ol/Feature';
import Point from 'ol/geom/Point';
import { fromLonLat } from 'ol/proj';
import { Style, Circle, Fill, Stroke, Text } from 'ol/style';

const useMapMarkers = (vectorSource) => {
  const getMarkerColor = (speed) => {
    if (speed > 50) return '#22c55e';
    if (speed > 10) return '#f59e0b';
    if (speed > 1) return '#ef4444';
    return '#6b7280';
  };

  const addMarkersToMap = useCallback((logs) => {
    if (!vectorSource) {
      console.error('Vector source not initialized');
      return;
    }
    
    console.log('Adding markers for logs:', logs);
    vectorSource.clear();
    
    logs.forEach((log, idx) => {
      if (!log.longitude || !log.latitude) {
        console.error('Invalid coordinates for log:', log);
        return;
      }

      const coordinates = fromLonLat([log.longitude, log.latitude]);
      console.log('Marker coordinates:', coordinates);
      
      const feature = new Feature({
        geometry: new Point(coordinates)
      });

      const color = getMarkerColor(log.speed);
      
      // Create marker style with auto-test indicator
      const styles = [
        new Style({
          image: new Circle({
            radius: 12,
            fill: new Fill({
              color: color
            }),
            stroke: new Stroke({
              color: '#ffffff',
              width: 2
            })
          }),
          text: new Text({
            text: (idx + 1).toString(),
            fill: new Fill({
              color: '#ffffff'
            }),
            font: '12px sans-serif'
          })
        })
      ];

      // Add auto-test indicator
      if (log.isAutoTest) {
        styles.push(
          new Style({
            image: new Circle({
              radius: 4,
              fill: new Fill({
                color: '#3b82f6'
              }),
              stroke: new Stroke({
                color: '#ffffff',
                width: 1
              }),
              displacement: [8, -8] // Offset from main marker
            })
          })
        );
      }
      
      feature.setStyle(styles);
      feature.set('data', log);
      vectorSource.addFeature(feature);
    });

    console.log('Total features added:', vectorSource.getFeatures().length);
  }, [vectorSource]);

  const clearMarkers = useCallback(() => {
    if (vectorSource) {
      vectorSource.clear();
    }
  }, [vectorSource]);

  const animateToMarker = useCallback((map, coordinates, options = {}) => {
    if (!map) return;

    const {
      zoom = 16,
      duration = 1000
    } = options;

    map.getView().animate({
      center: fromLonLat(coordinates),
      zoom,
      duration
    });
  }, []);

  return {
    addMarkersToMap,
    clearMarkers,
    animateToMarker,
    getMarkerColor
  };
};

export default useMapMarkers; 