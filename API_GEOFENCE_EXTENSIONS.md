# Geofence Extensions API Documentation

**Version:** 1.0  
**Date:** 2025-10-08  
**Purpose:** Extended geofence functionality for legacy Track system compatibility

---

## Overview

This document describes the extended geofence functionality added to Traccar to support legacy Track system features including:
- **Markers** (point-based locations with radius)
- **Zones** (polygon areas)
- **Routes** (polyline paths with deviation tolerance)
- **Geofence Groups** (organizing geofences)
- **Sub-account Privileges** (fine-grained access control)

All features are built on top of Traccar's existing geofence system using the unified `tc_geofences` table with geometry types (CIRCLE, POLYGON, LINESTRING).

---

## Table of Contents

1. [Database Schema](#database-schema)
2. [Geofence Model Extensions](#geofence-model-extensions)
3. [API Endpoints](#api-endpoints)
4. [Legacy Compatibility Endpoints](#legacy-compatibility-endpoints)
5. [Geofence Groups](#geofence-groups)
6. [Sub-Account Privileges](#sub-account-privileges)
7. [Usage Examples](#usage-examples)

---

## Database Schema

### New Tables

#### `tc_geofence_groups`
```sql
CREATE TABLE tc_geofence_groups (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(128) NOT NULL,
  description VARCHAR(256),
  attributes VARCHAR(4000)  -- JSON attributes
);
```

#### `tc_geofences` (Extended)
```sql
-- Added column to tc_geofences table
ALTER TABLE tc_geofences ADD COLUMN groupid INT NOT NULL DEFAULT 0;
ALTER TABLE tc_geofences ADD CONSTRAINT fk_geofence_groupid 
  FOREIGN KEY (groupid) REFERENCES tc_geofence_groups(id) ON DELETE SET DEFAULT;
```

**Note:** Geofences use the same grouping pattern as Devices - a simple `groupId` foreign key column.

### Extended Columns

#### `tc_users` (Sub-account privileges)

**Note:** The User model already includes these fields:
- `markerAccess` (TEXT) - Comma-separated marker geofence IDs
- `zoneAccess` (TEXT) - Comma-separated zone geofence IDs  
- `routeAccess` (TEXT) - Comma-separated route geofence IDs

These fields store comma-separated IDs of geofences the sub-account can access.

---

## Geofence Model Extensions

The `Geofence` model has been extended with convenience methods for legacy compatibility:

### Additional Attributes

All attributes are stored in the `attributes` JSON field:

| Attribute | Type | Description | Example |
|-----------|------|-------------|---------|
| `type` | String | Geofence type | "marker", "zone", "route" |
| `color` | String | Hex color for map display | "#FF5733" |
| `icon` | String | Custom icon path (markers only) | "data/user/places/123_icon.png" |
| `visible` | Boolean | Visibility on map | true |
| `nameVisible` | Boolean | Show name label on map | true |
| `polylineDistance` | Double | Corridor width for routes (meters) | 100.0 |
| `legacyGroupId` | Integer | Legacy group ID for migration | 5 |

### Java Methods

```java
// Type management
geofence.setGeofenceType("marker");  // "marker", "zone", or "route"
String type = geofence.getGeofenceType();

// Display attributes
geofence.setColor("#FF5733");
geofence.setVisible(true);
geofence.setNameVisible(true);

// Marker-specific
geofence.setIcon("path/to/icon.png");

// Route-specific
geofence.setPolylineDistance(100.0);  // 100 meters corridor

// Legacy compatibility
geofence.setLegacyGroupId(5);
```

---

## API Endpoints

### Standard Geofence Endpoints

The existing Traccar geofence endpoints work with all geometry types:

#### **GET /api/geofences**
Get all geofences (markers, zones, and routes)

**Query Parameters:**
- `all` (boolean) - Get all geofences for admin
- `userId` (long) - Filter by user ID
- `groupId` (long) - Filter by device group
- `deviceId` (long) - Filter by device

**Response:**
```json
[
  {
    "id": 1,
    "name": "Warehouse A",
    "description": "Main warehouse",
    "area": "CIRCLE (37.7749 -122.4194, 500)",
    "attributes": {
      "type": "marker",
      "color": "#4CAF50",
      "icon": "warehouse.png",
      "visible": true
    },
    "calendarId": 0
  },
  {
    "id": 2,
    "name": "Restricted Zone",
    "description": "No entry area",
    "area": "POLYGON ((37.7749 -122.4194, 37.7750 -122.4180, 37.7740 -122.4185, 37.7749 -122.4194))",
    "attributes": {
      "type": "zone",
      "color": "#FF5733",
      "visible": true,
      "nameVisible": true
    },
    "calendarId": 0
  },
  {
    "id": 3,
    "name": "Delivery Route 1",
    "description": "Main delivery route",
    "area": "LINESTRING (37.7749 -122.4194, 37.7750 -122.4180, 37.7760 -122.4170)",
    "attributes": {
      "type": "route",
      "color": "#2196F3",
      "visible": true,
      "nameVisible": true,
      "polylineDistance": 100
    },
    "calendarId": 0
  }
]
```

#### **POST /api/geofences**
Create a new geofence

**Request Body:**
```json
{
  "name": "Office Location",
  "description": "Main office",
  "area": "CIRCLE (37.7749 -122.4194, 200)",
  "attributes": {
    "type": "marker",
    "color": "#4CAF50",
    "visible": true
  }
}
```

**Response:** Created geofence object with ID

#### **PUT /api/geofences/{id}**
Update an existing geofence

**Request Body:** Same as POST

#### **DELETE /api/geofences/{id}**
Delete a geofence

---

## Legacy Compatibility Endpoints

These endpoints provide backward compatibility with the legacy Track system API. They filter geofences by type and enforce geometry validation.

### Markers API

#### **GET /api/markers**
Get all marker geofences (CIRCLE only)

**Query Parameters:** Same as `/api/geofences`

**Response:** Array of CIRCLE geofences with `type="marker"`

#### **POST /api/markers**
Create a new marker

**Request Body:**
```json
{
  "name": "Customer Location",
  "description": "Customer A",
  "area": "CIRCLE (37.7749 -122.4194, 500)",
  "attributes": {
    "color": "#4CAF50",
    "icon": "customer.png",
    "visible": true
  }
}
```

**Validation:**
- Geometry must be CIRCLE
- Type is automatically set to "marker"
- Default color: #4CAF50

#### **PUT /api/markers/{id}**
Update a marker

#### **DELETE /api/markers/{id}**
Delete a marker

### Zones API

#### **GET /api/zones**
Get all zone geofences (POLYGON only)

#### **POST /api/zones**
Create a new zone

**Request Body:**
```json
{
  "name": "Restricted Area",
  "description": "No entry zone",
  "area": "POLYGON ((37.7749 -122.4194, 37.7750 -122.4180, 37.7740 -122.4185, 37.7749 -122.4194))",
  "attributes": {
    "color": "#FF5733",
    "visible": true,
    "nameVisible": true
  }
}
```

**Validation:**
- Geometry must be POLYGON
- Type is automatically set to "zone"
- Default color: #FF5733

#### **PUT /api/zones/{id}**
Update a zone

#### **DELETE /api/zones/{id}**
Delete a zone

### Routes API

#### **GET /api/routes**
Get all route geofences (LINESTRING only)

#### **POST /api/routes**
Create a new route

**Request Body:**
```json
{
  "name": "Delivery Route",
  "description": "Main delivery path",
  "area": "LINESTRING (37.7749 -122.4194, 37.7750 -122.4180, 37.7760 -122.4170)",
  "attributes": {
    "color": "#2196F3",
    "visible": true,
    "nameVisible": true,
    "polylineDistance": 100
  }
}
```

**Validation:**
- Geometry must be LINESTRING
- Type is automatically set to "route"
- Default color: #2196F3
- Default polylineDistance: 100 meters

#### **PUT /api/routes/{id}**
Update a route

#### **DELETE /api/routes/{id}**
Delete a route

---

## Geofence Groups

Organize geofences into logical groups (e.g., "Customer Locations", "Delivery Routes").

### Endpoints

#### **GET /api/geofence-groups**
Get all geofence groups

**Response:**
```json
[
  {
    "id": 1,
    "name": "Customer Locations",
    "description": "All customer sites",
    "attributes": {}
  },
  {
    "id": 2,
    "name": "Delivery Routes",
    "description": "Standard delivery paths",
    "attributes": {}
  }
]
```

#### **POST /api/geofence-groups**
Create a new group

**Request Body:**
```json
{
  "name": "Warehouses",
  "description": "All warehouse locations",
  "attributes": {}
}
```

#### **PUT /api/geofence-groups/{id}**
Update a group

#### **DELETE /api/geofence-groups/{id}**
Delete a group (geofences are not deleted, only unlinked)

### Linking Geofences to Groups

Geofences use a simple `groupId` column, just like Devices:

```sql
-- Assign geofence 5 to group 1
UPDATE tc_geofences SET groupid = 1 WHERE id = 5;

-- Get all geofences in group 1
SELECT * FROM tc_geofences WHERE groupid = 1;

-- Remove geofence from group (set to 0)
UPDATE tc_geofences SET groupid = 0 WHERE id = 5;
```

**Via API:**
```bash
# Assign geofence to group
curl -X PUT http://localhost:8082/api/geofences/5 \
  -H "Content-Type: application/json" \
  -d '{"id": 5, "groupId": 1, "name": "Office HQ", "area": "CIRCLE (...)"}'  

# Create geofence with group
curl -X POST http://localhost:8082/api/markers \
  -H "Content-Type: application/json" \
  -d '{"name": "Warehouse", "groupId": 1, "area": "CIRCLE (...)"}'
```

---

## Sub-Account Privileges

Control which markers, zones, and routes sub-accounts can access.

### User Model Extensions

The `User` model includes these existing fields:

```java
private String markerAccess;  // Comma-separated marker geofence IDs
private String zoneAccess;    // Comma-separated zone geofence IDs
private String routeAccess;   // Comma-separated route geofence IDs
```

### Setting Privileges

**Example:**
```json
{
  "id": 10,
  "name": "Sub Account",
  "email": "subaccount@example.com",
  "markerAccess": "1,2,5,8",
  "zoneAccess": "3,4",
  "routeAccess": "6,7,9"
}
```

This sub-account can only access:
- Markers: 1, 2, 5, 8
- Zones: 3, 4
- Routes: 6, 7, 9

### Filtering by Privileges

When a sub-account requests geofences, filter by their privileges:

```java
// Check if user has access to specific geofence
String[] allowedMarkers = user.getMarkerAccess().split(",");
if (Arrays.asList(allowedMarkers).contains(String.valueOf(geofenceId))) {
    // User has access
}
```

### Permission Management

The `SubAccountResource` automatically creates `tc_user_geofence` permissions when:
- Creating a sub-account with `markerAccess`, `zoneAccess`, or `routeAccess` fields
- Updating a sub-account's access fields

This ensures sub-accounts can only access geofences they're explicitly granted permission to.

---

## Usage Examples

### Example 1: Create a Marker

```bash
curl -X POST http://localhost:8082/api/markers \
  -H "Content-Type: application/json" \
  -H "Authorization: Basic dXNlcjpwYXNzd29yZA==" \
  -d '{
    "name": "Office HQ",
    "description": "Main office location",
    "area": "CIRCLE (37.7749 -122.4194, 300)",
    "attributes": {
      "color": "#4CAF50",
      "icon": "office.png",
      "visible": true
    }
  }'
```

### Example 2: Create a Zone

```bash
curl -X POST http://localhost:8082/api/zones \
  -H "Content-Type: application/json" \
  -H "Authorization: Basic dXNlcjpwYXNzd29yZA==" \
  -d '{
    "name": "Restricted Area",
    "description": "No entry zone",
    "area": "POLYGON ((37.7749 -122.4194, 37.7750 -122.4180, 37.7740 -122.4185, 37.7749 -122.4194))",
    "attributes": {
      "color": "#FF5733",
      "visible": true,
      "nameVisible": true
    }
  }'
```

### Example 3: Create a Route

```bash
curl -X POST http://localhost:8082/api/routes \
  -H "Content-Type: application/json" \
  -H "Authorization: Basic dXNlcjpwYXNzd29yZA==" \
  -d '{
    "name": "Delivery Route 1",
    "description": "Main delivery path",
    "area": "LINESTRING (37.7749 -122.4194, 37.7750 -122.4180, 37.7760 -122.4170)",
    "attributes": {
      "color": "#2196F3",
      "visible": true,
      "nameVisible": true,
      "polylineDistance": 150
    }
  }'
```

### Example 4: Get All Markers for a User

```bash
curl -X GET "http://localhost:8082/api/markers?userId=5" \
  -H "Authorization: Basic dXNlcjpwYXNzd29yZA=="
```

### Example 5: Create a Geofence Group

```bash
curl -X POST http://localhost:8082/api/geofence-groups \
  -H "Content-Type: application/json" \
  -H "Authorization: Basic dXNlcjpwYXNzd29yZA==" \
  -d '{
    "name": "Customer Sites",
    "description": "All customer locations",
    "attributes": {}
  }'
```

### Example 6: Update Sub-Account Privileges

```bash
curl -X PUT http://localhost:8082/api/subaccounts/10 \
  -H "Content-Type: application/json" \
  -H "Authorization: Basic YWRtaW46YWRtaW4=" \
  -d '{
    "id": 10,
    "name": "Sub Account",
    "email": "subaccount@example.com",
    "markerAccess": "1,2,5",
    "zoneAccess": "3,4",
    "routeAccess": "6"
  }'
```

**Note:** Use `/api/subaccounts/{id}` endpoint for sub-account updates, which automatically manages geofence permissions.

---

## Migration from Legacy Track System

### Data Mapping

| Legacy Table | Traccar Table | Geometry Type | Type Attribute |
|--------------|---------------|---------------|----------------|
| `gs_user_markers` | `tc_geofences` | CIRCLE | "marker" |
| `gs_user_zones` | `tc_geofences` | POLYGON | "zone" |
| `gs_user_routes` | `tc_geofences` | LINESTRING | "route" |
| `gs_user_places_groups` | `tc_geofence_groups` | N/A | N/A |

### Migration Script Example

```sql
-- Migrate markers
INSERT INTO tc_geofences (name, description, area, attributes)
SELECT 
    marker_name,
    marker_desc,
    CONCAT('CIRCLE (', marker_lat, ' ', marker_lng, ', ', marker_radius, ')'),
    JSON_OBJECT(
        'type', 'marker',
        'icon', marker_icon,
        'color', '#4CAF50',
        'visible', marker_visible = 'true',
        'legacyGroupId', group_id
    )
FROM gs_user_markers;

-- Migrate user permissions
INSERT INTO tc_user_geofence (userid, geofenceid)
SELECT 
    t.id AS userid,
    g.id AS geofenceid
FROM gs_user_markers m
JOIN tc_users t ON m.user_id = t.legacy_user_id
JOIN tc_geofences g ON g.name = m.marker_name 
    AND JSON_EXTRACT(g.attributes, '$.type') = 'marker';
```

---

## Best Practices

1. **Always set the type attribute** when creating geofences for proper filtering
2. **Use legacy endpoints** (`/api/markers`, `/api/zones`, `/api/routes`) for type-specific operations
3. **Set default colors** to distinguish between types on the map
4. **Use geofence groups** to organize large numbers of geofences
5. **Implement privilege filtering** in the frontend for sub-accounts
6. **Store custom metadata** in the attributes field as needed
7. **Use polylineDistance** for route corridor width (default 100m)

---

## Error Handling

### Common Errors

**400 Bad Request - Invalid Geometry**
```json
{
  "error": "Marker must use CIRCLE geometry"
}
```

**403 Forbidden - No Permission**
```json
{
  "error": "Permission denied"
}
```

**404 Not Found**
```json
{
  "error": "Geofence not found"
}
```

---

## Performance Considerations

1. **Indexing**: Geofence queries are indexed by user permissions
2. **Filtering**: Legacy endpoints filter in-memory after database query
3. **Large Datasets**: For 10,000+ geofences, consider pagination
4. **Geometry Calculations**: POLYGON containsPoint is O(n) where n = vertices
5. **Caching**: Traccar caches geofence data for active devices

---

## Future Enhancements

Potential improvements for future versions:

1. **Geofence Group API** - Full CRUD operations for group membership
2. **Bulk Operations** - Create/update multiple geofences at once
3. **Advanced Filtering** - Filter by type, color, visibility in GET requests
4. **Geofence Templates** - Predefined geofence shapes
5. **Import/Export** - KML/GeoJSON support
6. **Spatial Queries** - Find geofences near a point or within a bounding box

---

## Support

For issues or questions:
- Check Traccar documentation: https://www.traccar.org/documentation/
- Review migration analysis: `/traccar/docs/ROUTES_ZONES_MARKERS_ANALYSIS.md`
- Contact: support@example.com

---

**Document Version:** 1.0  
**Last Updated:** 2025-10-08  
**Author:** Migration Team