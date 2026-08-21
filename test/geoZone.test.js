'use strict';

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');

const {
  normalizeDepartmentCode,
  getSchoolZoneFromDepartment,
  getHolidayRegionFromDepartment,
} = require('../lib/departmentZones');
const GeoZoneService = require('../lib/GeoZoneService');

describe('departmentZones', () => {
  it('pads numeric department codes', () => {
    assert.equal(normalizeDepartmentCode('1'), '01');
    assert.equal(normalizeDepartmentCode(1), '01');
    assert.equal(normalizeDepartmentCode('75'), '75');
    assert.equal(normalizeDepartmentCode('971'), '971');
  });

  it('keeps Corsica codes', () => {
    assert.equal(normalizeDepartmentCode('2a'), '2A');
    assert.equal(getSchoolZoneFromDepartment('2B'), 'Corse');
  });

  it('maps metro zones', () => {
    assert.equal(getSchoolZoneFromDepartment('69'), 'Zone A');
    assert.equal(getSchoolZoneFromDepartment('59'), 'Zone B');
    assert.equal(getSchoolZoneFromDepartment('75'), 'Zone C');
  });

  it('maps holiday regions', () => {
    assert.equal(getHolidayRegionFromDepartment('75'), 'metropole');
    assert.equal(getHolidayRegionFromDepartment('67'), 'alsace-moselle');
    assert.equal(getHolidayRegionFromDepartment('971'), 'guadeloupe');
    assert.equal(getHolidayRegionFromDepartment('987'), 'polynesie-francaise');
  });
});

describe('GeoZoneService.suggestZones', () => {
  function createService({ lat, lon }, fetchImpl) {
    const logs = [];
    const errors = [];
    const homey = {
      geolocation: {
        getLatitude: () => lat,
        getLongitude: () => lon,
      },
    };
    const previousFetch = global.fetch;
    global.fetch = fetchImpl;
    const service = new GeoZoneService(
      homey,
      (...args) => logs.push(args.join(' ')),
      (...args) => errors.push(args.join(' ')),
    );
    return {
      service,
      logs,
      errors,
      restore() {
        global.fetch = previousFetch;
      },
    };
  }

  it('returns geolocation_unavailable without coordinates', async () => {
    const ctx = createService({ lat: null, lon: null }, async () => {
      throw new Error('fetch should not be called');
    });
    try {
      const result = await ctx.service.suggestZones();
      assert.deepEqual(result, { error: 'geolocation_unavailable' });
    } finally {
      ctx.restore();
    }
  });

  it('returns geolocation_unavailable for 0,0', async () => {
    const ctx = createService({ lat: 0, lon: 0 }, async () => {
      throw new Error('fetch should not be called');
    });
    try {
      const result = await ctx.service.suggestZones();
      assert.equal(result.error, 'geolocation_unavailable');
    } finally {
      ctx.restore();
    }
  });

  it('suggests zone and region from geo API', async () => {
    const ctx = createService({ lat: 48.8566, lon: 2.3522 }, async () => ({
      ok: true,
      json: async () => [{ codeDepartement: '75', nom: 'Paris' }],
    }));
    try {
      const result = await ctx.service.suggestZones();
      assert.equal(result.schoolZone, 'Zone C');
      assert.equal(result.holidayRegion, 'metropole');
      assert.equal(result.department, '75');
      assert.equal(result.commune, 'Paris');
    } finally {
      ctx.restore();
    }
  });

  it('pads single-digit department from API', async () => {
    const ctx = createService({ lat: 46.2, lon: 5.2 }, async () => ({
      ok: true,
      json: async () => [{ codeDepartement: '1', nom: 'Bourg-en-Bresse' }],
    }));
    try {
      const result = await ctx.service.suggestZones();
      assert.equal(result.department, '01');
      assert.equal(result.schoolZone, 'Zone A');
    } finally {
      ctx.restore();
    }
  });

  it('returns geocode_failed when commune is missing', async () => {
    const ctx = createService({ lat: 0.1, lon: 0.1 }, async () => ({
      ok: true,
      json: async () => [],
    }));
    try {
      const result = await ctx.service.suggestZones();
      assert.equal(result.error, 'geocode_failed');
    } finally {
      ctx.restore();
    }
  });
});
