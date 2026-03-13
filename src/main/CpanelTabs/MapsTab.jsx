import { Typography, TextField, Grid } from '@mui/material';
import {
 sectionHeading, fieldSx, selectFieldSx, YesNoSelect 
} from './cpanelTabHelpers';

const MapsTab = ({ server, attr, attrBool, updateAttribute, updateField }) => (
  <>
    <Typography sx={sectionHeading}>Available Maps</Typography>
    <Grid container spacing={1}>
      {[
        { label: 'OSM Map', key: 'mapOsm' },
        { label: 'Bing Maps', key: 'mapBing' },
        { label: 'Google Maps', key: 'mapGoogle' },
        { label: 'Google Street View', key: 'mapGoogleStreetView' },
        { label: 'Google Traffic', key: 'mapGoogleTraffic' },
        { label: 'Mapbox Maps', key: 'mapMapbox' },
        { label: 'ArcGIS Maps', key: 'mapArcgis' },
        { label: 'Yandex Map', key: 'mapYandex' },
      ].map((m) => (
        <Grid item xs={3} key={m.key}>
          <YesNoSelect label={m.label} attrKey={m.key} attrBool={attrBool} updateAttribute={updateAttribute} />
        </Grid>
      ))}
    </Grid>

    <Typography sx={sectionHeading}>Geocoder</Typography>
    <TextField
      label="Geocoder Service" size="small" fullWidth select
      value={attr('geocoderService') || 'nominatim'}
      onChange={(e) => updateAttribute('geocoderService', e.target.value)}
      sx={selectFieldSx}
      SelectProps={{ native: true }}
    >
      <option value="nominatim">Nominatim (OpenStreetMap)</option>
      <option value="google">Google</option>
      <option value="bing">Bing</option>
      <option value="mapbox">Mapbox</option>
      <option value="pickpoint">PickPoint</option>
      <option value="custom">Custom</option>
    </TextField>
    <YesNoSelect label="Use Geocoder Cache" attrKey="geocoderCache" attrBool={attrBool} updateAttribute={updateAttribute} />

    <Typography sx={sectionHeading}>Map License Keys</Typography>
    {[
      { label: 'Bing Maps Key', key: 'bingKey' },
      { label: 'Google Maps Key', key: 'googleKey' },
      { label: 'Mapbox Maps Key', key: 'mapboxKey' },
      { label: 'ArcGIS Maps Key', key: 'arcgisKey' },
      { label: 'Yandex Maps Key', key: 'yandexKey' },
    ].map((k) => (
      <TextField
        key={k.key}
        label={k.label} size="small" fullWidth
        value={attr(k.key)}
        onChange={(e) => updateAttribute(k.key, e.target.value)}
        sx={fieldSx}
      />
    ))}

    <Typography sx={sectionHeading}>Geocoder License Keys</Typography>
    {[
      { label: 'Bing Geocoder Key', key: 'bingGeocoderKey' },
      { label: 'Google Geocoder Key', key: 'googleGeocoderKey' },
      { label: 'Mapbox Geocoder Key', key: 'mapboxGeocoderKey' },
      { label: 'PickPoint Geocoder Key', key: 'pickpointGeocoderKey' },
    ].map((k) => (
      <TextField
        key={k.key}
        label={k.label} size="small" fullWidth
        value={attr(k.key)}
        onChange={(e) => updateAttribute(k.key, e.target.value)}
        sx={fieldSx}
      />
    ))}

    <Typography sx={sectionHeading}>Map Routing</Typography>
    <TextField
      label="OSRM Service URL" size="small" fullWidth
      value={attr('osrmUrl')}
      onChange={(e) => updateAttribute('osrmUrl', e.target.value)}
      sx={fieldSx} placeholder="https://router.project-osrm.org"
    />

    <Typography sx={sectionHeading}>Default Map View After Login</Typography>
    <Grid container spacing={1}>
      <Grid item xs={4}>
        <TextField
          label="Default Map Layer" size="small" fullWidth select
          value={attr('defaultMapLayer') || 'osm'}
          onChange={(e) => updateAttribute('defaultMapLayer', e.target.value)}
          sx={selectFieldSx}
          SelectProps={{ native: true }}
        >
          <option value="osm">OSM Map</option>
          <option value="bingRoad">Bing Road</option>
          <option value="bingAerial">Bing Aerial</option>
          <option value="bingHybrid">Bing Hybrid</option>
          <option value="googleStreets">Google Streets</option>
          <option value="googleSatellite">Google Satellite</option>
          <option value="googleHybrid">Google Hybrid</option>
          <option value="googleTerrain">Google Terrain</option>
          <option value="mapboxStreets">Mapbox Streets</option>
          <option value="mapboxSatellite">Mapbox Satellite</option>
          <option value="arcgisTopographic">ArcGIS Topographic</option>
          <option value="arcgisStreets">ArcGIS Streets</option>
          <option value="arcgisImagery">ArcGIS Imagery</option>
          <option value="yandex">Yandex</option>
        </TextField>
      </Grid>
      <Grid item xs={2}>
        <TextField
          label="Zoom" size="small" fullWidth select
          value={attr('defaultZoom') || '10'}
          onChange={(e) => updateAttribute('defaultZoom', e.target.value)}
          sx={selectFieldSx}
          SelectProps={{ native: true }}
        >
          {Array.from({ length: 16 }, (_, i) => i + 3).map((z) => (
            <option key={z} value={z}>{z}</option>
          ))}
        </TextField>
      </Grid>
      <Grid item xs={3}>
        <TextField
          label="Latitude" size="small" fullWidth type="number"
          value={server.latitude || ''}
          onChange={(e) => updateField('latitude', parseFloat(e.target.value) || 0)}
          sx={fieldSx}
          inputProps={{ min: -90, max: 90, step: 0.0001 }}
        />
      </Grid>
      <Grid item xs={3}>
        <TextField
          label="Longitude" size="small" fullWidth type="number"
          value={server.longitude || ''}
          onChange={(e) => updateField('longitude', parseFloat(e.target.value) || 0)}
          sx={fieldSx}
          inputProps={{ min: -180, max: 180, step: 0.0001 }}
        />
      </Grid>
    </Grid>

    <Typography sx={sectionHeading}>Address Display</Typography>
    <Grid container spacing={1}>
      <Grid item xs={4}>
        <YesNoSelect label="Object Data List" attrKey="addressInObjectList" attrBool={attrBool} updateAttribute={updateAttribute} />
      </Grid>
      <Grid item xs={4}>
        <YesNoSelect label="Event Data List" attrKey="addressInEventList" attrBool={attrBool} updateAttribute={updateAttribute} />
      </Grid>
      <Grid item xs={4}>
        <YesNoSelect label="History Route List" attrKey="addressInHistoryList" attrBool={attrBool} updateAttribute={updateAttribute} />
      </Grid>
    </Grid>
    <Typography variant="caption" sx={{ color: '#e65100', fontSize: 10 }}>
      Enabling address display increases geocoder API usage and may slow loading.
    </Typography>
  </>
);

export default MapsTab;
