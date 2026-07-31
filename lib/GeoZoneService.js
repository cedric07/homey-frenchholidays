'use strict';

const {
  getSchoolZoneFromDepartment,
  getHolidayRegionFromDepartment,
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
      return { lat, lon };
    } catch (err) {
      this.error('[GeoZoneService] geolocation unavailable:', err.message);
      return null;
    }
  }

  async _reverseGeocode(lat, lon) {
    const url = `${GEO_API}/communes?lat=${lat}&lon=${lon}&fields=codeDepartement,nom&limit=1`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Geo API error ${response.status}`);
    }
    const data = await response.json();
    if (!Array.isArray(data) || data.length === 0) {
      throw new Error('No commune found for coordinates');
    }
    return data[0].codeDepartement;
  }

  async suggestZones() {
    const coords = this._getCoordinates();
    if (!coords) {
      return { error: 'geolocation_unavailable' };
    }

    try {
      const department = await this._reverseGeocode(coords.lat, coords.lon);
      const schoolZone = getSchoolZoneFromDepartment(department);
      const holidayRegion = getHolidayRegionFromDepartment(department);

      return {
        department,
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
