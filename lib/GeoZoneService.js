'use strict';

const {
  getSchoolZoneFromDepartment,
  getHolidayRegionFromDepartment,
  normalizeDepartmentCode,
} = require('./departmentZones');

const GEO_API = 'https://geo.api.gouv.fr';

class GeoZoneService {

  constructor(homey, log, error) {
    this.homey = homey;
    this.log = log;
    this.error = error;
  }

  _getCoordinates() {
    try {
      const lat = this.homey.geolocation.getLatitude();
      const lon = this.homey.geolocation.getLongitude();
      if (typeof lat !== 'number' || typeof lon !== 'number') return null;
      if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;
      // Homey sometimes exposes 0/0 when no address is configured.
      if (lat === 0 && lon === 0) return null;
      return { lat, lon };
    } catch (err) {
      this.error('[GeoZoneService] geolocation unavailable:', err.message);
      return null;
    }
  }

  async _reverseGeocode(lat, lon) {
    const url = `${GEO_API}/communes?lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lon)}&fields=codeDepartement,nom&limit=1`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Geo API error ${response.status}`);
    }
    const data = await response.json();
    if (!Array.isArray(data) || data.length === 0) {
      throw new Error('No commune found for coordinates');
    }
    const code = normalizeDepartmentCode(data[0].codeDepartement);
    if (!code) {
      throw new Error('Missing department code in geo response');
    }
    return {
      department: code,
      commune: data[0].nom || null,
    };
  }

  async suggestZones() {
    const coords = this._getCoordinates();
    if (!coords) {
      this.log('[GeoZoneService] Homey location unavailable (check Homey address)');
      return { error: 'geolocation_unavailable' };
    }

    try {
      const { department, commune } = await this._reverseGeocode(coords.lat, coords.lon);
      const schoolZone = getSchoolZoneFromDepartment(department);
      const holidayRegion = getHolidayRegionFromDepartment(department);

      if (!schoolZone) {
        this.error(`[GeoZoneService] No school zone mapped for department ${department}`);
        return {
          error: 'zone_unknown',
          department,
          commune,
          holidayRegion,
          latitude: coords.lat,
          longitude: coords.lon,
        };
      }

      this.log(
        `[GeoZoneService] Suggested ${schoolZone} / ${holidayRegion} (dept ${department}${commune ? `, ${commune}` : ''})`,
      );

      return {
        department,
        commune,
        schoolZone,
        holidayRegion,
        latitude: coords.lat,
        longitude: coords.lon,
      };
    } catch (err) {
      this.error('[GeoZoneService] reverse geocode failed:', err.message);
      return { error: 'geocode_failed', message: err.message };
    }
  }

}

module.exports = GeoZoneService;
