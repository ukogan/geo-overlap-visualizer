-- Seed data for major world cities and US cities
-- This script populates the boundaries table with sample boundary data

-- Insert largest 10 cities in the world
INSERT INTO boundaries (name, name_long, admin_level, country_code, geometry, bbox, area_km2, population) VALUES
('Tokyo', 'Tokyo Metropolitan Area, Japan', 2, 'JP', 
  ST_GeomFromGeoJSON('{"type":"MultiPolygon","coordinates":[[[[139.6917,35.6895],[139.6917,35.8000],[139.9000,35.8000],[139.9000,35.6895],[139.6917,35.6895]]]]}'),
  ST_GeomFromGeoJSON('{"type":"Polygon","coordinates":[[[139.6917,35.6895],[139.6917,35.8000],[139.9000,35.8000],[139.9000,35.6895],[139.6917,35.6895]]]}'),
  2194, 37400068),

('Delhi', 'National Capital Territory of Delhi, India', 2, 'IN',
  ST_GeomFromGeoJSON('{"type":"MultiPolygon","coordinates":[[[[77.1000,28.5000],[77.1000,28.8000],[77.3500,28.8000],[77.3500,28.5000],[77.1000,28.5000]]]]}'),
  ST_GeomFromGeoJSON('{"type":"Polygon","coordinates":[[[77.1000,28.5000],[77.1000,28.8000],[77.3500,28.8000],[77.3500,28.5000],[77.1000,28.5000]]]}'),
  1484, 32900000),

('Shanghai', 'Shanghai Municipality, China', 2, 'CN',
  ST_GeomFromGeoJSON('{"type":"MultiPolygon","coordinates":[[[[121.2000,31.0000],[121.2000,31.4000],[121.8000,31.4000],[121.8000,31.0000],[121.2000,31.0000]]]]}'),
  ST_GeomFromGeoJSON('{"type":"Polygon","coordinates":[[[121.2000,31.0000],[121.2000,31.4000],[121.8000,31.4000],[121.8000,31.0000],[121.2000,31.0000]]]}'),
  6341, 28500000),

('Dhaka', 'Dhaka Division, Bangladesh', 2, 'BD',
  ST_GeomFromGeoJSON('{"type":"MultiPolygon","coordinates":[[[[90.3000,23.7000],[90.3000,23.8500],[90.5000,23.8500],[90.5000,23.7000],[90.3000,23.7000]]]]}'),
  ST_GeomFromGeoJSON('{"type":"Polygon","coordinates":[[[90.3000,23.7000],[90.3000,23.8500],[90.5000,23.8500],[90.5000,23.7000],[90.3000,23.7000]]]}'),
  306, 22500000),

('São Paulo', 'São Paulo Metropolitan Area, Brazil', 2, 'BR',
  ST_GeomFromGeoJSON('{"type":"MultiPolygon","coordinates":[[[[-46.8000,-23.7000],[-46.8000,-23.3000],[-46.3000,-23.3000],[-46.3000,-23.7000],[-46.8000,-23.7000]]]]}'),
  ST_GeomFromGeoJSON('{"type":"Polygon","coordinates":[[[-46.8000,-23.7000],[-46.8000,-23.3000],[-46.3000,-23.3000],[-46.3000,-23.7000],[-46.8000,-23.7000]]]}'),
  7947, 22400000),

('Cairo', 'Greater Cairo, Egypt', 2, 'EG',
  ST_GeomFromGeoJSON('{"type":"MultiPolygon","coordinates":[[[[31.1000,29.9000],[31.1000,30.2000],[31.5000,30.2000],[31.5000,29.9000],[31.1000,29.9000]]]]}'),
  ST_GeomFromGeoJSON('{"type":"Polygon","coordinates":[[[31.1000,29.9000],[31.1000,30.2000],[31.5000,30.2000],[31.5000,29.9000],[31.1000,29.9000]]]}'),
  606, 21300000),

('Mexico City', 'Mexico City Metropolitan Area, Mexico', 2, 'MX',
  ST_GeomFromGeoJSON('{"type":"MultiPolygon","coordinates":[[[[-99.3000,19.2000],[-99.3000,19.6000],[-98.9000,19.6000],[-98.9000,19.2000],[-99.3000,19.2000]]]]}'),
  ST_GeomFromGeoJSON('{"type":"Polygon","coordinates":[[[-99.3000,19.2000],[-99.3000,19.6000],[-98.9000,19.6000],[-98.9000,19.2000],[-99.3000,19.2000]]]}'),
  7866, 21200000),

('Beijing', 'Beijing Municipality, China', 2, 'CN',
  ST_GeomFromGeoJSON('{"type":"MultiPolygon","coordinates":[[[[116.2000,39.7000],[116.2000,40.0000],[116.6000,40.0000],[116.6000,39.7000],[116.2000,39.7000]]]]}'),
  ST_GeomFromGeoJSON('{"type":"Polygon","coordinates":[[[116.2000,39.7000],[116.2000,40.0000],[116.6000,40.0000],[116.6000,39.7000],[116.2000,39.7000]]]}'),
  16410, 21100000),

('Mumbai', 'Mumbai Metropolitan Region, India', 2, 'IN',
  ST_GeomFromGeoJSON('{"type":"MultiPolygon","coordinates":[[[[72.7000,18.9000],[72.7000,19.3000],[73.1000,19.3000],[73.1000,18.9000],[72.7000,18.9000]]]]}'),
  ST_GeomFromGeoJSON('{"type":"Polygon","coordinates":[[[72.7000,18.9000],[72.7000,19.3000],[73.1000,19.3000],[73.1000,18.9000],[72.7000,18.9000]]]}'),
  603, 20700000),

('Osaka', 'Osaka Metropolitan Area, Japan', 2, 'JP',
  ST_GeomFromGeoJSON('{"type":"MultiPolygon","coordinates":[[[[135.3000,34.5000],[135.3000,34.8000],[135.7000,34.8000],[135.7000,34.5000],[135.3000,34.5000]]]]}'),
  ST_GeomFromGeoJSON('{"type":"Polygon","coordinates":[[[135.3000,34.5000],[135.3000,34.8000],[135.7000,34.8000],[135.7000,34.5000],[135.3000,34.5000]]]}'),
  13572, 19000000);

-- Insert largest 10 cities in the United States
INSERT INTO boundaries (name, name_long, admin_level, country_code, geometry, bbox, area_km2, population) VALUES
('New York', 'New York Metropolitan Area, New York, USA', 2, 'US',
  ST_GeomFromGeoJSON('{"type":"MultiPolygon","coordinates":[[[[-74.2000,40.5000],[-74.2000,40.9000],[-73.7000,40.9000],[-73.7000,40.5000],[-74.2000,40.5000]]]]}'),
  ST_GeomFromGeoJSON('{"type":"Polygon","coordinates":[[[-74.2000,40.5000],[-74.2000,40.9000],[-73.7000,40.9000],[-73.7000,40.5000],[-74.2000,40.5000]]]}'),
  17405, 20140470),

('Los Angeles', 'Los Angeles Metropolitan Area, California, USA', 2, 'US',
  ST_GeomFromGeoJSON('{"type":"MultiPolygon","coordinates":[[[[-118.7000,33.7000],[-118.7000,34.3000],[-117.9000,34.3000],[-117.9000,33.7000],[-118.7000,33.7000]]]]}'),
  ST_GeomFromGeoJSON('{"type":"Polygon","coordinates":[[[-118.7000,33.7000],[-118.7000,34.3000],[-117.9000,34.3000],[-117.9000,33.7000],[-118.7000,33.7000]]]}'),
  33954, 13200998),

('Chicago', 'Chicago Metropolitan Area, Illinois, USA', 2, 'US',
  ST_GeomFromGeoJSON('{"type":"MultiPolygon","coordinates":[[[[-88.0000,41.6000],[-88.0000,42.0000],[-87.5000,42.0000],[-87.5000,41.6000],[-88.0000,41.6000]]]]}'),
  ST_GeomFromGeoJSON('{"type":"Polygon","coordinates":[[[-88.0000,41.6000],[-88.0000,42.0000],[-87.5000,42.0000],[-87.5000,41.6000],[-88.0000,41.6000]]]}'),
  28120, 9618502),

('Dallas', 'Dallas-Fort Worth Metroplex, Texas, USA', 2, 'US',
  ST_GeomFromGeoJSON('{"type":"MultiPolygon","coordinates":[[[[-97.5000,32.5000],[-97.5000,33.0000],[-96.5000,33.0000],[-96.5000,32.5000],[-97.5000,32.5000]]]]}'),
  ST_GeomFromGeoJSON('{"type":"Polygon","coordinates":[[[-97.5000,32.5000],[-97.5000,33.0000],[-96.5000,33.0000],[-96.5000,32.5000],[-97.5000,32.5000]]]}'),
  24059, 7637387),

('Houston', 'Greater Houston Area, Texas, USA', 2, 'US',
  ST_GeomFromGeoJSON('{"type":"MultiPolygon","coordinates":[[[[-95.8000,29.4000],[-95.8000,30.1000],[-95.0000,30.1000],[-95.0000,29.4000],[-95.8000,29.4000]]]]}'),
  ST_GeomFromGeoJSON('{"type":"Polygon","coordinates":[[[-95.8000,29.4000],[-95.8000,30.1000],[-95.0000,30.1000],[-95.0000,29.4000],[-95.8000,29.4000]]]}'),
  26061, 7122240),

('Washington D.C.', 'Washington Metropolitan Area, District of Columbia, USA', 2, 'US',
  ST_GeomFromGeoJSON('{"type":"MultiPolygon","coordinates":[[[[-77.5000,38.7000],[-77.5000,39.0000],[-76.9000,39.0000],[-76.9000,38.7000],[-77.5000,38.7000]]]]}'),
  ST_GeomFromGeoJSON('{"type":"Polygon","coordinates":[[[-77.5000,38.7000],[-77.5000,39.0000],[-76.9000,39.0000],[-76.9000,38.7000],[-77.5000,38.7000]]]}'),
  14412, 6280487),

('Philadelphia', 'Philadelphia Metropolitan Area, Pennsylvania, USA', 2, 'US',
  ST_GeomFromGeoJSON('{"type":"MultiPolygon","coordinates":[[[[-75.5000,39.7000],[-75.5000,40.2000],[-74.9000,40.2000],[-74.9000,39.7000],[-75.5000,39.7000]]]]}'),
  ST_GeomFromGeoJSON('{"type":"Polygon","coordinates":[[[-75.5000,39.7000],[-75.5000,40.2000],[-74.9000,40.2000],[-74.9000,39.7000],[-75.5000,39.7000]]]}'),
  13256, 6245051),

('Atlanta', 'Atlanta Metropolitan Area, Georgia, USA', 2, 'US',
  ST_GeomFromGeoJSON('{"type":"MultiPolygon","coordinates":[[[[-84.8000,33.4000],[-84.8000,33.9000],[-84.0000,33.9000],[-84.0000,33.4000],[-84.8000,33.4000]]]]}'),
  ST_GeomFromGeoJSON('{"type":"Polygon","coordinates":[[[-84.8000,33.4000],[-84.8000,33.9000],[-84.0000,33.9000],[-84.0000,33.4000],[-84.8000,33.4000]]]}'),
  21694, 6089815),

('Miami', 'Miami Metropolitan Area, Florida, USA', 2, 'US',
  ST_GeomFromGeoJSON('{"type":"MultiPolygon","coordinates":[[[[-80.7000,25.4000],[-80.7000,26.0000],[-80.1000,26.0000],[-80.1000,25.4000],[-80.7000,25.4000]]]]}'),
  ST_GeomFromGeoJSON('{"type":"Polygon","coordinates":[[[-80.7000,25.4000],[-80.7000,26.0000],[-80.1000,26.0000],[-80.1000,25.4000],[-80.7000,25.4000]]]}'),
  15890, 6138333),

('Phoenix', 'Phoenix Metropolitan Area, Arizona, USA', 2, 'US',
  ST_GeomFromGeoJSON('{"type":"MultiPolygon","coordinates":[[[[-112.5000,33.2000],[-112.5000,33.8000],[-111.6000,33.8000],[-111.6000,33.2000],[-112.5000,33.2000]]]]}'),
  ST_GeomFromGeoJSON('{"type":"Polygon","coordinates":[[[-112.5000,33.2000],[-112.5000,33.8000],[-111.6000,33.8000],[-111.6000,33.2000],[-112.5000,33.2000]]]}'),
  37744, 4845832);

-- Update table statistics
ANALYZE boundaries;