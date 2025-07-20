-- Delete the bad San Francisco boundary data so it can be re-downloaded with proper geometry
DELETE FROM boundaries WHERE name = 'San Francisco' AND admin_level = 1;