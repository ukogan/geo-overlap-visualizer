-- Clear existing placeholder data
DELETE FROM boundaries;

-- Insert top 10 US cities with more realistic metropolitan area boundaries
-- New York Metropolitan Area
INSERT INTO boundaries (name, name_long, admin_level, country_code, area_km2, population, geometry, geometry_geojson, bbox_geojson, center_lng, center_lat) VALUES
('New York', 'New York Metropolitan Area', 1, 'US', 17405, 20140470, 
 ST_GeomFromGeoJSON('{"type":"MultiPolygon","coordinates":[[[[-74.25,40.48],[-74.25,40.92],[-73.7,40.92],[-73.7,40.48],[-74.25,40.48]]]]}'),
 '{"type":"MultiPolygon","coordinates":[[[[-74.25,40.48],[-74.25,40.92],[-73.7,40.92],[-73.7,40.48],[-74.25,40.48]]]]}',
 '{"type":"Polygon","coordinates":[[[-74.25,40.48],[-73.7,40.48],[-73.7,40.92],[-74.25,40.92],[-74.25,40.48]]]}',
 -73.975, 40.7),

-- Los Angeles Metropolitan Area  
('Los Angeles', 'Los Angeles Metropolitan Area', 1, 'US', 33954, 13200998,
 ST_GeomFromGeoJSON('{"type":"MultiPolygon","coordinates":[[[[-118.67,33.7],[-118.67,34.34],[-117.63,34.34],[-117.63,33.7],[-118.67,33.7]]]]}'),
 '{"type":"MultiPolygon","coordinates":[[[[-118.67,33.7],[-118.67,34.34],[-117.63,34.34],[-117.63,33.7],[-118.67,33.7]]]]}',
 '{"type":"Polygon","coordinates":[[[-118.67,33.7],[-117.63,33.7],[-117.63,34.34],[-118.67,34.34],[-118.67,33.7]]]}',
 -118.15, 34.02),

-- Chicago Metropolitan Area
('Chicago', 'Chicago Metropolitan Area', 1, 'US', 28120, 9618502,
 ST_GeomFromGeoJSON('{"type":"MultiPolygon","coordinates":[[[[-88.32,41.47],[-88.32,42.18],[-87.27,42.18],[-87.27,41.47],[-88.32,41.47]]]]}'),
 '{"type":"MultiPolygon","coordinates":[[[[-88.32,41.47],[-88.32,42.18],[-87.27,42.18],[-87.27,41.47],[-88.32,41.47]]]]}',
 '{"type":"Polygon","coordinates":[[[-88.32,41.47],[-87.27,41.47],[-87.27,42.18],[-88.32,42.18],[-88.32,41.47]]]}',
 -87.795, 41.825),

-- Houston Metropolitan Area
('Houston', 'Houston Metropolitan Area', 1, 'US', 26061, 7122240,
 ST_GeomFromGeoJSON('{"type":"MultiPolygon","coordinates":[[[[-95.82,29.4],[-95.82,30.11],[-94.92,30.11],[-94.92,29.4],[-95.82,29.4]]]]}'),
 '{"type":"MultiPolygon","coordinates":[[[[-95.82,29.4],[-95.82,30.11],[-94.92,30.11],[-94.92,29.4],[-95.82,29.4]]]]}',
 '{"type":"Polygon","coordinates":[[[-95.82,29.4],[-94.92,29.4],[-94.92,30.11],[-95.82,30.11],[-95.82,29.4]]]}',
 -95.37, 29.755),

-- Phoenix Metropolitan Area
('Phoenix', 'Phoenix Metropolitan Area', 1, 'US', 37027, 4845832,
 ST_GeomFromGeoJSON('{"type":"MultiPolygon","coordinates":[[[[-112.74,33.25],[-112.74,33.91],[-111.73,33.91],[-111.73,33.25],[-112.74,33.25]]]]}'),
 '{"type":"MultiPolygon","coordinates":[[[[-112.74,33.25],[-112.74,33.91],[-111.73,33.91],[-111.73,33.25],[-112.74,33.25]]]]}',
 '{"type":"Polygon","coordinates":[[[-112.74,33.25],[-111.73,33.25],[-111.73,33.91],[-112.74,33.91],[-112.74,33.25]]]}',
 -112.235, 33.58),

-- Philadelphia Metropolitan Area
('Philadelphia', 'Philadelphia Metropolitan Area', 1, 'US', 13256, 6245051,
 ST_GeomFromGeoJSON('{"type":"MultiPolygon","coordinates":[[[[-75.56,39.72],[-75.56,40.32],[-74.89,40.32],[-74.89,39.72],[-75.56,39.72]]]]}'),
 '{"type":"MultiPolygon","coordinates":[[[[-75.56,39.72],[-75.56,40.32],[-74.89,40.32],[-74.89,39.72],[-75.56,39.72]]]]}',
 '{"type":"Polygon","coordinates":[[[-75.56,39.72],[-74.89,39.72],[-74.89,40.32],[-75.56,40.32],[-75.56,39.72]]]}',
 -75.225, 40.02),

-- San Antonio Metropolitan Area
('San Antonio', 'San Antonio Metropolitan Area', 1, 'US', 7387, 2558143,
 ST_GeomFromGeoJSON('{"type":"MultiPolygon","coordinates":[[[[-98.83,29.15],[-98.83,29.75],[-98.25,29.75],[-98.25,29.15],[-98.83,29.15]]]]}'),
 '{"type":"MultiPolygon","coordinates":[[[[-98.83,29.15],[-98.83,29.75],[-98.25,29.75],[-98.25,29.15],[-98.83,29.15]]]]}',
 '{"type":"Polygon","coordinates":[[[-98.83,29.15],[-98.25,29.15],[-98.25,29.75],[-98.83,29.75],[-98.83,29.15]]]}',
 -98.54, 29.45),

-- San Diego Metropolitan Area  
('San Diego', 'San Diego Metropolitan Area', 1, 'US', 11020, 3298634,
 ST_GeomFromGeoJSON('{"type":"MultiPolygon","coordinates":[[[[-117.6,32.53],[-117.6,33.25],[-116.93,33.25],[-116.93,32.53],[-117.6,32.53]]]]}'),
 '{"type":"MultiPolygon","coordinates":[[[[-117.6,32.53],[-117.6,33.25],[-116.93,33.25],[-116.93,32.53],[-117.6,32.53]]]]}',
 '{"type":"Polygon","coordinates":[[[-117.6,32.53],[-116.93,32.53],[-116.93,33.25],[-117.6,33.25],[-117.6,32.53]]]}',
 -117.265, 32.89),

-- Dallas Metropolitan Area
('Dallas', 'Dallas-Fort Worth Metropolitan Area', 1, 'US', 24059, 7637387,
 ST_GeomFromGeoJSON('{"type":"MultiPolygon","coordinates":[[[[-97.56,32.45],[-97.56,33.25],[-96.54,33.25],[-96.54,32.45],[-97.56,32.45]]]]}'),
 '{"type":"MultiPolygon","coordinates":[[[[-97.56,32.45],[-97.56,33.25],[-96.54,33.25],[-96.54,32.45],[-97.56,32.45]]]]}',
 '{"type":"Polygon","coordinates":[[[-97.56,32.45],[-96.54,32.45],[-96.54,33.25],[-97.56,33.25],[-97.56,32.45]]]}',
 -97.05, 32.85),

-- San Jose Metropolitan Area
('San Jose', 'San Jose Metropolitan Area', 1, 'US', 4304, 2016270,
 ST_GeomFromGeoJSON('{"type":"MultiPolygon","coordinates":[[[[-122.18,37.17],[-122.18,37.58],[-121.56,37.58],[-121.56,37.17],[-122.18,37.17]]]]}'),
 '{"type":"MultiPolygon","coordinates":[[[[-122.18,37.17],[-122.18,37.58],[-121.56,37.58],[-121.56,37.17],[-122.18,37.17]]]]}',
 '{"type":"Polygon","coordinates":[[[-122.18,37.17],[-121.56,37.17],[-121.56,37.58],[-122.18,37.58],[-122.18,37.17]]]}',
 -121.87, 37.375);

-- Insert top 10 global cities with realistic metropolitan boundaries
-- Tokyo Metropolitan Area (more accurate boundaries)
INSERT INTO boundaries (name, name_long, admin_level, country_code, area_km2, population, geometry, geometry_geojson, bbox_geojson, center_lng, center_lat) VALUES
('Tokyo', 'Tokyo Metropolitan Area', 1, 'JP', 13572, 37194104,
 ST_GeomFromGeoJSON('{"type":"MultiPolygon","coordinates":[[[[139.3,35.5],[139.3,35.9],[140.0,35.9],[140.0,35.5],[139.3,35.5]]]]}'),
 '{"type":"MultiPolygon","coordinates":[[[[139.3,35.5],[139.3,35.9],[140.0,35.9],[140.0,35.5],[139.3,35.5]]]]}',
 '{"type":"Polygon","coordinates":[[[139.3,35.5],[140.0,35.5],[140.0,35.9],[139.3,35.9],[139.3,35.5]]]}',
 139.65, 35.7),

-- Delhi Metropolitan Area
('Delhi', 'National Capital Territory of Delhi', 1, 'IN', 1484, 32941308,
 ST_GeomFromGeoJSON('{"type":"MultiPolygon","coordinates":[[[[76.8,28.4],[76.8,28.9],[77.35,28.9],[77.35,28.4],[76.8,28.4]]]]}'),
 '{"type":"MultiPolygon","coordinates":[[[[76.8,28.4],[76.8,28.9],[77.35,28.9],[77.35,28.4],[76.8,28.4]]]]}',
 '{"type":"Polygon","coordinates":[[[76.8,28.4],[77.35,28.4],[77.35,28.9],[76.8,28.9],[76.8,28.4]]]}',
 77.075, 28.65),

-- Shanghai Metropolitan Area
('Shanghai', 'Shanghai Municipality', 1, 'CN', 6341, 28516904,
 ST_GeomFromGeoJSON('{"type":"MultiPolygon","coordinates":[[[[121.0,30.7],[121.0,31.6],[121.9,31.6],[121.9,30.7],[121.0,30.7]]]]}'),
 '{"type":"MultiPolygon","coordinates":[[[[121.0,30.7],[121.0,31.6],[121.9,31.6],[121.9,30.7],[121.0,30.7]]]]}',
 '{"type":"Polygon","coordinates":[[[121.0,30.7],[121.9,30.7],[121.9,31.6],[121.0,31.6],[121.0,30.7]]]}',
 121.45, 31.15),

-- Dhaka Metropolitan Area
('Dhaka', 'Dhaka Metropolitan Area', 1, 'BD', 2161, 22478116,
 ST_GeomFromGeoJSON('{"type":"MultiPolygon","coordinates":[[[[90.0,23.5],[90.0,24.0],[90.7,24.0],[90.7,23.5],[90.0,23.5]]]]}'),
 '{"type":"MultiPolygon","coordinates":[[[[90.0,23.5],[90.0,24.0],[90.7,24.0],[90.7,23.5],[90.0,23.5]]]]}',
 '{"type":"Polygon","coordinates":[[[90.0,23.5],[90.7,23.5],[90.7,24.0],[90.0,24.0],[90.0,23.5]]]}',
 90.35, 23.75),

-- São Paulo Metropolitan Area
('São Paulo', 'São Paulo Metropolitan Region', 1, 'BR', 7946, 22620000,
 ST_GeomFromGeoJSON('{"type":"MultiPolygon","coordinates":[[[[-47.1,-24.0],[-47.1,-23.2],[-46.3,-23.2],[-46.3,-24.0],[-47.1,-24.0]]]]}'),
 '{"type":"MultiPolygon","coordinates":[[[[-47.1,-24.0],[-47.1,-23.2],[-46.3,-23.2],[-46.3,-24.0],[-47.1,-24.0]]]]}',
 '{"type":"Polygon","coordinates":[[[-47.1,-24.0],[-46.3,-24.0],[-46.3,-23.2],[-47.1,-23.2],[-47.1,-24.0]]]}',
 -46.7, -23.6),

-- Cairo Metropolitan Area
('Cairo', 'Greater Cairo Metropolitan Area', 1, 'EG', 3085, 21322750,
 ST_GeomFromGeoJSON('{"type":"MultiPolygon","coordinates":[[[[31.0,29.8],[31.0,30.3],[31.6,30.3],[31.6,29.8],[31.0,29.8]]]]}'),
 '{"type":"MultiPolygon","coordinates":[[[[31.0,29.8],[31.0,30.3],[31.6,30.3],[31.6,29.8],[31.0,29.8]]]]}',
 '{"type":"Polygon","coordinates":[[[31.0,29.8],[31.6,29.8],[31.6,30.3],[31.0,30.3],[31.0,29.8]]]}',
 31.3, 30.05),

-- Mexico City Metropolitan Area
('Mexico City', 'Mexico City Metropolitan Area', 1, 'MX', 7866, 21804515,
 ST_GeomFromGeoJSON('{"type":"MultiPolygon","coordinates":[[[[-99.4,19.1],[-99.4,19.7],[-98.8,19.7],[-98.8,19.1],[-99.4,19.1]]]]}'),
 '{"type":"MultiPolygon","coordinates":[[[[-99.4,19.1],[-99.4,19.7],[-98.8,19.7],[-98.8,19.1],[-99.4,19.1]]]]}',
 '{"type":"Polygon","coordinates":[[[-99.4,19.1],[-98.8,19.1],[-98.8,19.7],[-99.4,19.7],[-99.4,19.1]]]}',
 -99.1, 19.4),

-- Beijing Metropolitan Area
('Beijing', 'Beijing Municipality', 1, 'CN', 16411, 21893095,
 ST_GeomFromGeoJSON('{"type":"MultiPolygon","coordinates":[[[[115.7,39.4],[115.7,40.5],[117.4,40.5],[117.4,39.4],[115.7,39.4]]]]}'),
 '{"type":"MultiPolygon","coordinates":[[[[115.7,39.4],[115.7,40.5],[117.4,40.5],[117.4,39.4],[115.7,39.4]]]]}',
 '{"type":"Polygon","coordinates":[[[115.7,39.4],[117.4,39.4],[117.4,40.5],[115.7,40.5],[115.7,39.4]]]}',
 116.55, 39.95),

-- Mumbai Metropolitan Area
('Mumbai', 'Mumbai Metropolitan Region', 1, 'IN', 4355, 20185064,
 ST_GeomFromGeoJSON('{"type":"MultiPolygon","coordinates":[[[[72.6,18.9],[72.6,19.4],[73.2,19.4],[73.2,18.9],[72.6,18.9]]]]}'),
 '{"type":"MultiPolygon","coordinates":[[[[72.6,18.9],[72.6,19.4],[73.2,19.4],[73.2,18.9],[72.6,18.9]]]]}',
 '{"type":"Polygon","coordinates":[[[72.6,18.9],[73.2,18.9],[73.2,19.4],[72.6,19.4],[72.6,18.9]]]}',
 72.9, 19.15),

-- Osaka Metropolitan Area
('Osaka', 'Osaka Metropolitan Area', 1, 'JP', 13033, 18967459,
 ST_GeomFromGeoJSON('{"type":"MultiPolygon","coordinates":[[[[135.0,34.3],[135.0,34.9],[135.8,34.9],[135.8,34.3],[135.0,34.3]]]]}'),
 '{"type":"MultiPolygon","coordinates":[[[[135.0,34.3],[135.0,34.9],[135.8,34.9],[135.8,34.3],[135.0,34.3]]]]}',
 '{"type":"Polygon","coordinates":[[[135.0,34.3],[135.8,34.3],[135.8,34.9],[135.0,34.9],[135.0,34.3]]]}',
 135.4, 34.6);